import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { CoachPlanForm } from '@/components/coach/plan-form';
import { AppLocale } from '@/i18n/routing';
import { requireRole } from '@/lib/auth/queries';
import { emptyCoachPlanFormValues } from '@/types/app';
import { getCoachClientSummary } from '@/lib/plans/queries';

export default async function NewPlanPage({ params }: { params: Promise<{ locale: AppLocale; clientId: string }> }) {
  const { locale, clientId } = await params;
  const profile = await requireRole(locale, 'coach');
  const client = await getCoachClientSummary(profile.id, clientId);
  if (!client) notFound();

  const t = await getTranslations('coach');
  const common = await getTranslations('common');

  return (
    <CoachPlanForm
      locale={locale}
      initialValues={{ ...emptyCoachPlanFormValues, clientId }}
      labels={{
        title: t('newPlanForClient', { name: client.fullName }),
        subtitle: t('newPlanIntro'),
        save: common('save'),
        planTitle: t('planTitle'),
        planType: t('planType'),
        planGoal: t('planGoal'),
        startDate: t('planStartDate'),
        endDate: t('planEndDate'),
        status: t('planStatus'),
        notes: t('planNotes'),
        training: t('planType_training'),
        nutrition: t('planType_nutrition'),
        combined: t('planType_combined'),
        draft: t('planStatus_draft'),
        active: t('planStatus_active'),
        completed: t('planStatus_completed'),
        archived: t('planStatus_archived'),
        schedule: t('planSchedule'),
        dayLabel: t('planDayLabel'),
        workout: t('planWorkout'),
        meal: t('planMeal'),
        restDay: t('planRestDay'),
        noDays: t('planNoDays')
      }}
    />
  );
}
