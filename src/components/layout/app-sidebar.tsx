import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { AppLocale } from '@/i18n/routing';
import { UserRole } from '@/types/app';
import { SignOutButton } from './sign-out-button';

export async function AppSidebar({ locale, role }: { locale: AppLocale; role: UserRole }) {
  const t = await getTranslations('nav');
  const common = await getTranslations('common');

  return (
    <aside className="sidebar stack">
      <div>
        <h2 style={{ margin: 0 }}>FitCoach</h2>
        <p className="muted" style={{ marginTop: 8 }}>
          {role === 'coach' ? 'Coach workspace' : 'Client workspace'}
        </p>
      </div>

      <nav className="stack">
        {role === 'coach' ? (
          <>
            <Link href="/coach/dashboard" locale={locale}>{t('coachDashboard')}</Link>
            <Link href="/coach/clients" locale={locale}>{t('clients')}</Link>
            <Link href="/coach/reports" locale={locale}>{t('reports')}</Link>
            <span className="muted" style={{ fontSize: 12 }}>{t('plansHint')}</span>
          </>
        ) : (
          <>
            <Link href="/client/dashboard" locale={locale}>{t('clientDashboard')}</Link>
            <Link href="/client/today" locale={locale}>{t('today')}</Link>
          </>
        )}
        <Link href="/profile" locale={locale}>{common('profile')}</Link>
      </nav>

      <div style={{ marginTop: 'auto' }}>
        <SignOutButton locale={locale} label={common('logout')} />
      </div>
    </aside>
  );
}
