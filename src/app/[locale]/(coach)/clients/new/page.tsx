import { getTranslations } from 'next-intl/server';
import { CoachClientForm } from '@/components/coach/client-form';
import { AppLocale } from '@/i18n/routing';
import { requireRole } from '@/lib/auth/queries';
import { emptyCoachClientFormValues } from '@/types/app';

export default async function NewClientPage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params;
  await requireRole(locale, 'coach');
  const t = await getTranslations('coach');
  const common = await getTranslations('common');

  return (
    <CoachClientForm
      locale={locale}
      mode="create"
      initialValues={emptyCoachClientFormValues}
      labels={{
        title: t('newClient'),
        subtitle: t('newClientIntro'),
        save: common('save'),
        fullName: t('clientFullName'),
        email: t('clientEmail'),
        phone: t('clientPhone'),
        language: t('clientLanguage'),
        dateOfBirth: t('clientDateOfBirth'),
        sex: t('clientSex'),
        heightCm: t('clientHeightCm'),
        startingWeightKg: t('clientStartingWeightKg'),
        currentWeightKg: t('clientCurrentWeightKg'),
        goalSummary: t('clientGoalSummary'),
        medicalNotes: t('clientMedicalNotes'),
        preferredContactMethod: t('clientPreferredContactMethod'),
        emergencyContactName: t('clientEmergencyContactName'),
        emergencyContactPhone: t('clientEmergencyContactPhone'),
        active: t('clientIsActive'),
        accountNote: t('newClientAccountNote'),
        english: common('english'),
        spanish: common('spanish'),
        female: t('female'),
        male: t('male'),
        other: t('other'),
        preferNotToSay: t('preferNotToSay'),
        whatsapp: t('whatsapp'),
        emailMethod: t('emailMethod')
      }}
    />
  );
}
