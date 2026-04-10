import { AppSidebar } from '@/components/layout/app-sidebar';
import { LanguageSwitcher } from '@/components/layout/language-switcher';
import { AppLocale } from '@/i18n/routing';
import { requireRole } from '@/lib/auth/queries';

export default async function CoachLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = localeParam as AppLocale;
  await requireRole(locale, 'coach');

  return (
    <div className="sidebar-layout">
      <AppSidebar locale={locale} role="coach" />
      <main className="main stack">
        <div className="space-between">
          <span className="badge">Coach view</span>
          <LanguageSwitcher />
        </div>
        {children}
      </main>
    </div>
  );
}
