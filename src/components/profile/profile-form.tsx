"use client";

import { useActionState } from 'react';
import { updateProfileAction } from '@/lib/auth/actions';
import { Profile } from '@/types/app';
import { AppLocale } from '@/i18n/routing';

const initialState = {error: undefined, success: undefined};

type ProfileFormState = {
  error?: string;
  success?: string;
};

export function ProfileForm({
  profile,
  locale,
  saveLabel,
  personalInfoLabel,
  languageLabel
}: {
  profile: Profile;
  locale: AppLocale;
  saveLabel: string;
  personalInfoLabel: string;
  languageLabel: string;
}) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);

  return (
    <form className="card stack" action={formAction}>
      <input type="hidden" name="profileId" value={profile.id} />
      <input type="hidden" name="role" value={profile.role} />
      <input type="hidden" name="locale" value={locale} />

      <div>
        <h1 style={{ marginBottom: 8 }}>{personalInfoLabel}</h1>
        <p className="muted">Connect photo uploads next using Supabase Storage.</p>
      </div>

      <div className="grid grid-3">
        <label className="stack">
          <span>{personalInfoLabel}</span>
          <input className="input" name="fullName" defaultValue={profile.full_name} required />
        </label>

        <label className="stack">
          <span>Email</span>
          <input className="input" value={profile.email} disabled readOnly />
        </label>

        <label className="stack">
          <span>Phone</span>
          <input className="input" name="phone" defaultValue={profile.phone ?? ''} />
        </label>
      </div>

      <label className="stack" style={{ maxWidth: 280 }}>
        <span>{languageLabel}</span>
        <select className="select" name="language" defaultValue={profile.language}>
          <option value="es">Español</option>
          <option value="en">English</option>
        </select>
      </label>

      {state?.error ? <p className="error-text">{state.error}</p> : null}
      {state?.success ? <p className="success-text">{state.success}</p> : null}

      <div className="row">
        <button className="button" type="submit" disabled={pending}>{pending ? '...' : saveLabel}</button>
      </div>
    </form>
  );
}
