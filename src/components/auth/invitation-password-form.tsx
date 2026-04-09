"use client";

import { useActionState } from 'react';
import { acceptInvitationAction, InvitationActionState } from '@/lib/invitations/actions';
import { AppLocale } from '@/i18n/routing';

const initialState: InvitationActionState = {};

export function InvitationPasswordForm({
  locale,
  invitationId,
  token,
  labels
}: {
  locale: AppLocale;
  invitationId: string;
  token: string;
  labels: {
    password: string;
    confirmPassword: string;
    submit: string;
  };
}) {
  const [state, formAction, pending] = useActionState(acceptInvitationAction, initialState);

  return (
    <form className="stack" action={formAction}>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="invitationId" value={invitationId} />
      <input type="hidden" name="token" value={token} />

      <label className="stack">
        <span>{labels.password}</span>
        <input className="input" type="password" name="password" minLength={8} required autoComplete="new-password" />
      </label>

      <label className="stack">
        <span>{labels.confirmPassword}</span>
        <input className="input" type="password" name="confirmPassword" minLength={8} required autoComplete="new-password" />
      </label>

      {state.error ? <p className="error-text">{state.error}</p> : null}
      <button className="button" type="submit" disabled={pending}>{pending ? '...' : labels.submit}</button>
    </form>
  );
}
