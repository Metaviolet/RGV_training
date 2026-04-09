import { getTranslations } from 'next-intl/server';
import { LoginForm } from '@/components/auth/login-form';
import { LanguageSwitcher } from '@/components/layout/language-switcher';
import { AppLocale } from '@/i18n/routing';
import { redirectSignedInUser } from '@/lib/auth/queries';

export default async function LoginPage({ params, searchParams }: { params: Promise<{ locale: AppLocale }>; searchParams: Promise<{ invited?: string; email?: string }> }) {
  const { locale } = await params;
  const { invited, email } = await searchParams;
  await redirectSignedInUser(locale);

  const t = await getTranslations('auth');

  return (
    <div className="page-shell">
      <div className="container" style={{ maxWidth: 520 }}>
        <div className="space-between" style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0 }}>FitCoach</h1>
          <LanguageSwitcher />
        </div>

        <div className="card stack">
          <div>
            <h2>{t('loginTitle')}</h2>
            <p className="muted">{t('loginSubtitle')}</p>
          </div>
          {invited ? <p className="success-text">{t('invitationAccepted', {email: email ?? ''})}</p> : null}
          <LoginForm
            locale={locale}
            labels={{
              email: t('email'),
              password: t('password'),
              submit: t('submit')
            }}
          />
          <a className="muted" href={`/${locale}/forgot-password`}>{t('forgotPassword')}</a>
        </div>
      </div>
    </div>
  );
}
