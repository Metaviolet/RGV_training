"use client";

import { useActionState } from 'react';
import { signInAction } from '@/lib/auth/actions';
import { AppLocale } from '@/i18n/routing';
import type { AuthActionState } from '@/types/app';

const initialState: AuthActionState = {};

export function LoginForm({
  labels,
  locale
}: {
  labels: { email: string; password: string; submit: string };
  locale: AppLocale;
}) {
  const [state, formAction, pending] = useActionState(signInAction, initialState);

  return (
    <form className="stack" action={formAction}>
      <input type="hidden" name="locale" value={locale} />

      <label className="stack">
        <span>{labels.email}</span>
        <input className="input" name="email" type="email" required autoComplete="email" />
      </label>

      <label className="stack">
        <span>{labels.password}</span>
        <input className="input" name="password" type="password" required autoComplete="current-password" minLength={8} />
      </label>

      {state?.error ? <p className="error-text">{state.error}</p> : null}
      <button className="button" type="submit" disabled={pending}>{pending ? '...' : labels.submit}</button>
    </form>
  );
}
