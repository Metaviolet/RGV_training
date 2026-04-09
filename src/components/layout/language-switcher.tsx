"use client";

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('common');

  return (
    <select
      aria-label="Language"
      className="select"
      style={{ maxWidth: 160 }}
      value={locale}
      onChange={(event) => router.replace(pathname, { locale: event.target.value as 'en' | 'es' })}
    >
      <option value="es">{t('spanish')}</option>
      <option value="en">{t('english')}</option>
    </select>
  );
}
