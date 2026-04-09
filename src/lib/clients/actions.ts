"use server";

import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { AppLocale } from '@/i18n/routing';
import { requireRole } from '@/lib/auth/queries';
import { getCoachIdByProfileId } from '@/lib/clients/queries';
import { createAdminClient } from '@/lib/supabase/admin';
import { createInvitationAfterClientCreation } from '@/lib/invitations/actions';
import { createClient } from '@/lib/supabase/server';
import { CoachClientFormState } from '@/types/app';

const emptyToUndefined = (value: FormDataEntryValue | null) => {
  const normalized = typeof value === 'string' ? value.trim() : '';
  return normalized.length ? normalized : undefined;
};

const clientSchema = z.object({
  locale: z.enum(['en', 'es']),
  clientId: z.string().uuid().optional(),
  fullName: z.string().trim().min(2).max(120),
  email: z.email(),
  phone: z.string().trim().max(40).optional(),
  language: z.enum(['en', 'es']),
  dateOfBirth: z.string().optional(),
  sex: z.enum(['female', 'male', 'other', 'prefer_not_to_say']),
  heightCm: z.coerce.number().positive().max(300).optional(),
  startingWeightKg: z.coerce.number().positive().max(999).optional(),
  currentWeightKg: z.coerce.number().positive().max(999).optional(),
  goalSummary: z.string().trim().max(1000).optional(),
  medicalNotes: z.string().trim().max(3000).optional(),
  preferredContactMethod: z.enum(['whatsapp', 'email']),
  emergencyContactName: z.string().trim().max(120).optional(),
  emergencyContactPhone: z.string().trim().max(40).optional(),
  active: z.enum(['true', 'false']).transform((value) => value === 'true')
});

function parseClientForm(formData: FormData) {
  return clientSchema.safeParse({
    locale: formData.get('locale'),
    clientId: emptyToUndefined(formData.get('clientId')),
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    phone: emptyToUndefined(formData.get('phone')),
    language: formData.get('language'),
    dateOfBirth: emptyToUndefined(formData.get('dateOfBirth')),
    sex: formData.get('sex'),
    heightCm: emptyToUndefined(formData.get('heightCm')),
    startingWeightKg: emptyToUndefined(formData.get('startingWeightKg')),
    currentWeightKg: emptyToUndefined(formData.get('currentWeightKg')),
    goalSummary: emptyToUndefined(formData.get('goalSummary')),
    medicalNotes: emptyToUndefined(formData.get('medicalNotes')),
    preferredContactMethod: formData.get('preferredContactMethod'),
    emergencyContactName: emptyToUndefined(formData.get('emergencyContactName')),
    emergencyContactPhone: emptyToUndefined(formData.get('emergencyContactPhone')),
    active: formData.get('active') ?? 'true'
  });
}

export async function upsertCoachClientAction(_: CoachClientFormState, formData: FormData): Promise<CoachClientFormState> {
  const parsed = parseClientForm(formData);
  if (!parsed.success) {
    return { error: 'Please review the client details and try again.' };
  }

  const values = parsed.data;
  const locale = values.locale as AppLocale;
  const profile = await requireRole(locale, 'coach');
  const coachId = await getCoachIdByProfileId(profile.id);
  if (!coachId) {
    return { error: 'Coach account setup is incomplete.' };
  }

  const supabase = await createClient();

  if (values.clientId) {
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id, profile_id')
      .eq('id', values.clientId)
      .eq('coach_id', coachId)
      .single();

    if (!existingClient) {
      return { error: 'Client not found.' };
    }

    const { data: conflictingProfile } = await supabase
      .from('profiles')
      .select('id')
      .neq('id', existingClient.profile_id)
      .eq('email', values.email)
      .maybeSingle();

    if (conflictingProfile) {
      return { error: 'Another user already uses that email address.' };
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: values.fullName,
        email: values.email,
        phone: values.phone ?? null,
        language: values.language
      })
      .eq('id', existingClient.profile_id);

    if (profileError) return { error: profileError.message };

    const { error: clientError } = await supabase
      .from('clients')
      .update({
        date_of_birth: values.dateOfBirth ?? null,
        sex: values.sex,
        height_cm: values.heightCm ?? null,
        starting_weight_kg: values.startingWeightKg ?? null,
        current_weight_kg: values.currentWeightKg ?? null,
        goal_summary: values.goalSummary ?? null,
        medical_notes: values.medicalNotes ?? null,
        preferred_contact_method: values.preferredContactMethod,
        emergency_contact_name: values.emergencyContactName ?? null,
        emergency_contact_phone: values.emergencyContactPhone ?? null,
        active: values.active
      })
      .eq('id', values.clientId)
      .eq('coach_id', coachId);

    if (clientError) return { error: clientError.message };

    await supabase.from('audit_events').insert({
      actor_profile_id: profile.id,
      entity_type: 'client',
      entity_id: values.clientId,
      action: 'client.updated',
      metadata: { email: values.email }
    });

    revalidatePath(`/${locale}/coach/clients`);
    revalidatePath(`/${locale}/coach/dashboard`);
    redirect(`/${locale}/coach/clients`);
  }

  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', values.email)
    .maybeSingle();

  if (existingProfile) {
    return { error: 'A profile with that email already exists.' };
  }

  let authUserId: string;
  try {
    const admin = createAdminClient();
    const tempPassword = `FitCoach-${randomUUID().slice(0, 8)}!`;
    const { data: createdUser, error: authError } = await admin.auth.admin.createUser({
      email: values.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: values.fullName, role: 'client' }
    });

    if (authError || !createdUser.user) {
      return { error: authError?.message ?? 'Unable to create the login account.' };
    }
    authUserId = createdUser.user.id;
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unable to create the login account.' };
  }

  const { data: createdProfile, error: profileError } = await supabase
    .from('profiles')
    .insert({
      auth_user_id: authUserId,
      role: 'client',
      full_name: values.fullName,
      email: values.email,
      phone: values.phone ?? null,
      language: values.language
    })
    .select('id')
    .single();

  if (profileError || !createdProfile) {
    return { error: profileError?.message ?? 'Unable to create the client profile.' };
  }

  const { data: createdClient, error: clientError } = await supabase
    .from('clients')
    .insert({
      profile_id: createdProfile.id,
      coach_id: coachId,
      date_of_birth: values.dateOfBirth ?? null,
      sex: values.sex,
      height_cm: values.heightCm ?? null,
      starting_weight_kg: values.startingWeightKg ?? null,
      current_weight_kg: values.currentWeightKg ?? null,
      goal_summary: values.goalSummary ?? null,
      medical_notes: values.medicalNotes ?? null,
      preferred_contact_method: values.preferredContactMethod,
      emergency_contact_name: values.emergencyContactName ?? null,
      emergency_contact_phone: values.emergencyContactPhone ?? null,
      active: values.active
    })
    .select('id')
    .single();

  if (clientError || !createdClient) {
    return { error: clientError?.message ?? 'Unable to create the client record.' };
  }

  await supabase.from('audit_events').insert({
    actor_profile_id: profile.id,
    entity_type: 'client',
    entity_id: createdClient.id,
    action: 'client.created',
    metadata: { email: values.email }
  });

  await createInvitationAfterClientCreation({
    locale,
    clientId: createdClient.id,
    coachId,
    coachProfileName: profile.full_name
  });

  revalidatePath(`/${locale}/coach/clients`);
  revalidatePath(`/${locale}/coach/dashboard`);
  redirect(`/${locale}/coach/clients/${createdClient.id}/edit?created=1`);
}
