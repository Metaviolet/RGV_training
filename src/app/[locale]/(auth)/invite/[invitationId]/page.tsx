import { getTranslations } from 'next-intl/server';
import { InvitationPasswordForm } from '@/components/auth/invitation-password-form';
import { LanguageSwitcher } from '@/components/layout/language-switcher';
import { AppLocale } from '@/i18n/routing';
import { getInvitationForPage } from '@/lib/invitations/queries';

export default async function InvitationPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: AppLocale; invitationId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale, invitationId } = await params;
  const { token } = await searchParams;
  const t = await getTranslations('auth');

  if (!token) {
    return (
      <div className="page-shell">
        <div className="container" style={{ maxWidth: 560 }}>
          <div className="space-between" style={{ marginBottom: 24 }}>
            <h1 style={{ margin: 0 }}>FitCoach</h1>
            <LanguageSwitcher />
          </div>
          <div className="card stack">
            <h2>{t('invitationInvalidTitle')}</h2>
            <p className="muted">{t('invitationInvalidBody')}</p>
          </div>
        </div>
      </div>
    );
  }

  const invitation = await getInvitationForPage(invitationId, token);
  const invalid = !invitation || invitation.acceptedAt || invitation.revokedAt || invitation.isExpired;

  return (
    <div className="page-shell">
      <div className="container" style={{ maxWidth: 560 }}>
        <div className="space-between" style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0 }}>FitCoach</h1>
          <LanguageSwitcher />
        </div>

        <div className="card stack">
          {invalid ? (
            <>
              <h2>{t('invitationInvalidTitle')}</h2>
              <p className="muted">{t('invitationInvalidBody')}</p>
            </>
          ) : (
            <>
              <div>
                <h2>{t('invitationTitle')}</h2>
                <p className="muted">{t('invitationSubtitle', { name: invitation.clientName })}</p>
              </div>
              <InvitationPasswordForm
                locale={locale}
                invitationId={invitationId}
                token={token}
                labels={{
                  password: t('newPassword'),
                  confirmPassword: t('confirmPassword'),
                  submit: t('activateAccount')
                }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
