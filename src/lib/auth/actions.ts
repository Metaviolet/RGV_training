"use server";

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { AppLocale } from '@/i18n/routing';
import { AuthActionState, ProfileFormState } from '@/types/app';

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  locale: z.enum(['en', 'es'])
});

export async function signInAction(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    locale: formData.get('locale')
  });

  if (!parsed.success) {
    return { error: 'Please check your email, password, and language.' };
  }

  const supabase = await createClient();
  const { email, password, locale } = parsed.data;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  const { data: authUser } = await supabase.auth.getUser();
  if (!authUser.user) return { error: 'Unable to start session.' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('auth_user_id', authUser.user.id)
    .single();

  if (!profile) {
    await supabase.auth.signOut();
    return { error: 'This account does not have an app profile yet.' };
  }

  await supabase.from('profiles').update({ language: locale }).eq('id', profile.id);
  redirect(`/${locale}/${profile.role === 'coach' ? 'coach/dashboard' : 'client/dashboard'}`);
}

export async function signOutAction(locale: AppLocale) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/${locale}/login`);
}

const profileSchema = z.object({
  profileId: z.uuid(),
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(40).optional(),
  language: z.enum(['en', 'es']),
  role: z.enum(['coach', 'client']),
  locale: z.enum(['en', 'es'])
});

export async function updateProfileAction(_: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const parsed = profileSchema.safeParse({
    profileId: formData.get('profileId'),
    fullName: formData.get('fullName'),
    phone: formData.get('phone') || undefined,
    language: formData.get('language'),
    role: formData.get('role'),
    locale: formData.get('locale')
  });

  if (!parsed.success) {
    return { error: 'Please review the profile details and try again.' };
  }

  const supabase = await createClient();
  const { data: authUser } = await supabase.auth.getUser();
  if (!authUser.user) return { error: 'Your session expired. Please sign in again.' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_user_id', authUser.user.id)
    .single();

  if (!profile || profile.id !== parsed.data.profileId) {
    return { error: 'You do not have permission to update this profile.' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: parsed.data.fullName,
      phone: parsed.data.phone?.trim() ? parsed.data.phone.trim() : null,
      language: parsed.data.language
    })
    .eq('id', parsed.data.profileId);

  if (error) return { error: error.message };

  if (parsed.data.language !== parsed.data.locale) {
    redirect(`/${parsed.data.language}/${parsed.data.role === 'coach' ? 'coach/dashboard' : 'client/dashboard'}`);
  }

  return { success: 'Profile updated successfully.' };
}
