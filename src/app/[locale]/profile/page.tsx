import { getTranslations } from 'next-intl/server';
import { ProfileForm } from '@/components/profile/profile-form';
import { AppLocale } from '@/i18n/routing';
import { requireProfile } from '@/lib/auth/queries';

export default async function ProfilePage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params;
  const profile = await requireProfile(locale);
  const t = await getTranslations('profile');
  const common = await getTranslations('common');

  return (
    <div className="container" style={{ maxWidth: 900 }}>
      <ProfileForm
        profile={profile}
        locale={locale}
        saveLabel={common('save')}
        personalInfoLabel={t('personalInfo')}
        languageLabel={t('language')}
      />
    </div>
  );
}
