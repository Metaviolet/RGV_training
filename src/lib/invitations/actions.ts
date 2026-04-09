"use server";

import { createHash, randomBytes } from 'crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { AppLocale } from '@/i18n/routing';
import { requireRole } from '@/lib/auth/queries';
import { getCoachIdByProfileId } from '@/lib/clients/queries';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export type InvitationActionState = {
  error?: string;
  success?: string;
  inviteUrl?: string;
  emailSubject?: string;
  emailBody?: string;
};

const regenerateSchema = z.object({
  locale: z.enum(['en', 'es']),
  clientId: z.uuid()
});

const acceptSchema = z.object({
  invitationId: z.uuid(),
  token: z.string().min(16),
  locale: z.enum(['en', 'es']),
  password: z.string().min(8),
  confirmPassword: z.string().min(8)
}).refine((value) => value.password === value.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword']
});

function digestToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function buildInviteCopy({ locale, coachName, clientName, inviteUrl, expiresAt }: {
  locale: AppLocale;
  coachName: string;
  clientName: string;
  inviteUrl: string;
  expiresAt: string;
}) {
  const formattedDate = new Intl.DateTimeFormat(locale === 'es' ? 'es-MX' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(expiresAt));

  if (locale === 'es') {
    return {
      subject: `Tu acceso a FitCoach está listo`,
      body: `Hola ${clientName},\n\n${coachName} te invitó a FitCoach para que puedas revisar tu plan y registrar tu avance.\n\nActiva tu acceso aquí:\n${inviteUrl}\n\nEste enlace vence el ${formattedDate}.\n\nCuando abras el enlace podrás crear tu contraseña y entrar por primera vez.\n\nSi tú no esperabas este mensaje, puedes ignorarlo.\n\nSaludos.`
    };
  }

  return {
    subject: 'Your FitCoach access is ready',
    body: `Hi ${clientName},\n\n${coachName} invited you to FitCoach so you can review your plan and log your progress.\n\nActivate your access here:\n${inviteUrl}\n\nThis link expires on ${formattedDate}.\n\nOnce you open it, you will be able to create your password and sign in for the first time.\n\nIf you were not expecting this message, you can ignore it.\n\nBest regards.`
  };
}

async function createInvitationRecord({ locale, clientId, coachId, coachProfileName }: { locale: AppLocale; clientId: string; coachId: string; coachProfileName: string }) {
  const supabase = await createClient();
  const { data: client } = await supabase
    .from('clients')
    .select('id, profiles!inner(full_name, email, language)')
    .eq('id', clientId)
    .eq('coach_id', coachId)
    .single();

  if (!client) {
    throw new Error('Client not found.');
  }

  await supabase
    .from('client_invitations')
    .update({ revoked_at: new Date().toISOString() })
    .eq('client_id', clientId)
    .eq('coach_id', coachId)
    .is('accepted_at', null)
    .is('revoked_at', null);

  const rawToken = randomBytes(24).toString('hex');
  const tokenDigest = digestToken(rawToken);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();

  const { data: invitation, error } = await supabase
    .from('client_invitations')
    .insert({
      client_id: clientId,
      coach_id: coachId,
      email: client.profiles.email,
      token_digest: tokenDigest,
      expires_at: expiresAt
    })
    .select('id')
    .single();

  if (error || !invitation) {
    throw new Error(error?.message ?? 'Unable to create invitation.');
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const preferredLocale = (client.profiles.language as AppLocale | null) ?? locale;
  const inviteUrl = `${appUrl}/${preferredLocale}/invite/${invitation.id}?token=${rawToken}`;
  const emailCopy = buildInviteCopy({
    locale: preferredLocale,
    coachName: coachProfileName,
    clientName: client.profiles.full_name,
    inviteUrl,
    expiresAt
  });

  return {
    inviteUrl,
    preferredLocale,
    emailSubject: emailCopy.subject,
    emailBody: emailCopy.body,
    clientEmail: client.profiles.email
  };
}

export async function regenerateInvitationAction(_: InvitationActionState, formData: FormData): Promise<InvitationActionState> {
  const parsed = regenerateSchema.safeParse({
    locale: formData.get('locale'),
    clientId: formData.get('clientId')
  });

  if (!parsed.success) {
    return { error: 'Could not generate the invitation link.' };
  }

  const { locale, clientId } = parsed.data;
  const profile = await requireRole(locale, 'coach');
  const coachId = await getCoachIdByProfileId(profile.id);
  if (!coachId) return { error: 'Coach account setup is incomplete.' };

  try {
    const invitation = await createInvitationRecord({ locale, clientId, coachId, coachProfileName: profile.full_name });
    revalidatePath(`/${locale}/coach/clients/${clientId}/edit`);
    return {
      success: locale === 'es' ? 'Nuevo enlace generado. Compártelo con tu cliente.' : 'New invitation link generated. Share it with your client.',
      inviteUrl: invitation.inviteUrl,
      emailSubject: invitation.emailSubject,
      emailBody: invitation.emailBody
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unable to create the invitation.' };
  }
}

export async function acceptInvitationAction(_: InvitationActionState, formData: FormData): Promise<InvitationActionState> {
  const parsed = acceptSchema.safeParse({
    invitationId: formData.get('invitationId'),
    token: formData.get('token'),
    locale: formData.get('locale'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword')
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Please review your password.' };
  }

  const { invitationId, token, locale, password } = parsed.data;
  const supabase = await createClient();
  const tokenDigest = digestToken(token);

  const { data: invitation } = await supabase
    .from('client_invitations')
    .select(`
      id,
      email,
      expires_at,
      accepted_at,
      revoked_at,
      clients!inner(
        id,
        profile_id,
        profiles!inner(auth_user_id, role)
      )
    `)
    .eq('id', invitationId)
    .eq('token_digest', tokenDigest)
    .maybeSingle();

  if (!invitation) {
    return { error: locale === 'es' ? 'El enlace no es válido.' : 'This invitation link is not valid.' };
  }

  if (invitation.accepted_at) {
    return { error: locale === 'es' ? 'Este enlace ya fue usado.' : 'This invitation link has already been used.' };
  }

  if (invitation.revoked_at) {
    return { error: locale === 'es' ? 'Este enlace fue reemplazado por uno más reciente.' : 'This invitation was replaced by a newer one.' };
  }

  if (new Date(invitation.expires_at).getTime() < Date.now()) {
    return { error: locale === 'es' ? 'Este enlace ya venció.' : 'This invitation link has expired.' };
  }

  try {
    const admin = createAdminClient();
    const userId = invitation.clients.profiles.auth_user_id as string;
    const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
      user_metadata: { role: 'client' }
    });

    if (updateError) {
      return { error: updateError.message };
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unable to activate the account.' };
  }

  await supabase
    .from('client_invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invitationId);

  redirect(`/${locale}/login?invited=1&email=${encodeURIComponent(invitation.email)}`);
}

export async function createInvitationAfterClientCreation({ locale, clientId, coachProfileName, coachId }: { locale: AppLocale; clientId: string; coachProfileName: string; coachId: string }) {
  return createInvitationRecord({ locale, clientId, coachId, coachProfileName });
}
