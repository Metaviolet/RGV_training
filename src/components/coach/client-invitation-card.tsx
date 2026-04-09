"use client";

import { useActionState } from 'react';
import { regenerateInvitationAction, InvitationActionState } from '@/lib/invitations/actions';
import { AppLocale } from '@/i18n/routing';

type Labels = {
  title: string;
  intro: string;
  statusPending: string;
  statusAccepted: string;
  statusExpired: string;
  statusMissing: string;
  expires: string;
  generated: string;
  regenerate: string;
  invitationReady: string;
  emailSubject: string;
  emailBody: string;
  copyLink: string;
  copyEmail: string;
  mailto: string;
};

const initialState: InvitationActionState = {};

export function ClientInvitationCard({
  locale,
  clientId,
  labels,
  invitation
}: {
  locale: AppLocale;
  clientId: string;
  labels: Labels;
  invitation: {
    createdAt?: string;
    expiresAt?: string;
    acceptedAt?: string | null;
    isPending?: boolean;
    isExpired?: boolean;
  } | null;
}) {
  const [state, action, pending] = useActionState(regenerateInvitationAction, initialState);
  const statusText = invitation?.acceptedAt
    ? labels.statusAccepted
    : invitation?.isPending
      ? labels.statusPending
      : invitation?.isExpired
        ? labels.statusExpired
        : labels.statusMissing;

  const mailtoHref = state.emailSubject && state.emailBody
    ? `mailto:?subject=${encodeURIComponent(state.emailSubject)}&body=${encodeURIComponent(state.emailBody)}`
    : undefined;

  return (
    <div className="card stack">
      <div>
        <h2 style={{ marginBottom: 8 }}>{labels.title}</h2>
        <p className="muted">{labels.intro}</p>
      </div>

      <div className="row">
        <span className="badge">{statusText}</span>
        {invitation?.createdAt ? <span className="muted">{labels.generated}: {new Date(invitation.createdAt).toLocaleString(locale === 'es' ? 'es-MX' : 'en-US')}</span> : null}
        {invitation?.expiresAt ? <span className="muted">{labels.expires}: {new Date(invitation.expiresAt).toLocaleString(locale === 'es' ? 'es-MX' : 'en-US')}</span> : null}
      </div>

      <form action={action} className="row">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="clientId" value={clientId} />
        <button className="button secondary" type="submit" disabled={pending}>{pending ? '...' : labels.regenerate}</button>
      </form>

      {state.error ? <p className="error-text">{state.error}</p> : null}
      {state.success ? <p className="success-text">{state.success}</p> : null}

      {state.inviteUrl ? (
        <div className="stack invite-box">
          <strong>{labels.invitationReady}</strong>
          <label className="stack">
            <span>{labels.copyLink}</span>
            <textarea className="input" readOnly rows={3} value={state.inviteUrl} />
          </label>
          <label className="stack">
            <span>{labels.emailSubject}</span>
            <input className="input" readOnly value={state.emailSubject ?? ''} />
          </label>
          <label className="stack">
            <span>{labels.emailBody}</span>
            <textarea className="input" readOnly rows={10} value={state.emailBody ?? ''} />
          </label>
          {mailtoHref ? <a className="button" href={mailtoHref}>{labels.mailto}</a> : null}
        </div>
      ) : null}
    </div>
  );
}
