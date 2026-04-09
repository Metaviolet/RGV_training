import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppLocale } from '@/i18n/routing';
import { Profile, UserRole } from '@/types/app';

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, auth_user_id, role, full_name, email, phone, photo_url, language, timezone')
    .eq('auth_user_id', auth.user.id)
    .single();

  if (error) return null;
  return data as Profile;
});

export async function requireProfile(locale: AppLocale) {
  const profile = await getCurrentProfile();
  if (!profile) redirect(`/${locale}/login`);
  return profile;
}

export async function requireRole(locale: AppLocale, role: UserRole) {
  const profile = await requireProfile(locale);
  if (profile.role !== role) {
    redirect(`/${locale}/${profile.role === 'coach' ? 'coach/dashboard' : 'client/dashboard'}`);
  }
  return profile;
}

export async function redirectSignedInUser(locale: AppLocale) {
  const profile = await getCurrentProfile();
  if (!profile) return;
  redirect(`/${locale}/${profile.role === 'coach' ? 'coach/dashboard' : 'client/dashboard'}`);
}
