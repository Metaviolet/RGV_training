import { AppSidebar } from '@/components/layout/app-sidebar';
import { LanguageSwitcher } from '@/components/layout/language-switcher';
import { AppLocale } from '@/i18n/routing';
import { requireRole } from '@/lib/auth/queries';

export default async function ClientLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = localeParam as AppLocale;
  await requireRole(locale, 'client');

  return (
    <div className="sidebar-layout">
      <AppSidebar locale={locale} role="client" />
      <main className="main stack">
        <div className="space-between">
          <span className="badge">Client view</span>
          <LanguageSwitcher />
        </div>
        {children}
      </main>
    </div>
  );
}
