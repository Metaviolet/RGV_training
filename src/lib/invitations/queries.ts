import { createHash } from 'crypto';
import { createClient } from '@/lib/supabase/server';

export type InvitationSummary = {
  id: string;
  email: string;
  createdAt: string;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  isPending: boolean;
  isExpired: boolean;
};

function digestToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export async function getLatestInvitationForClient(coachId: string, clientId: string): Promise<InvitationSummary | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('client_invitations')
    .select('id, email, created_at, expires_at, accepted_at, revoked_at')
    .eq('coach_id', coachId)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  const isExpired = Boolean(data.expires_at && new Date(data.expires_at).getTime() < Date.now());
  const isPending = !data.accepted_at && !data.revoked_at && !isExpired;

  return {
    id: data.id,
    email: data.email,
    createdAt: data.created_at,
    expiresAt: data.expires_at,
    acceptedAt: data.accepted_at,
    revokedAt: data.revoked_at,
    isPending,
    isExpired
  };
}

export async function getInvitationForPage(invitationId: string, token: string) {
  const supabase = await createClient();
  const tokenDigest = digestToken(token);

  const { data } = await supabase
    .from('client_invitations')
    .select(`
      id,
      email,
      expires_at,
      accepted_at,
      revoked_at,
      clients!inner(
        id,
        profiles!inner(full_name, language)
      )
    `)
    .eq('id', invitationId)
    .eq('token_digest', tokenDigest)
    .maybeSingle();

  if (!data) return null;

  const isExpired = new Date(data.expires_at).getTime() < Date.now();

  return {
    id: data.id,
    email: data.email,
    expiresAt: data.expires_at,
    acceptedAt: data.accepted_at,
    revokedAt: data.revoked_at,
    isExpired,
    clientName: data.clients.profiles.full_name as string,
    preferredLanguage: (data.clients.profiles.language as 'en' | 'es' | null) ?? 'es'
  };
}
