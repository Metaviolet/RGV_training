import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { CoachPlanForm } from '@/components/coach/plan-form';
import { AppLocale } from '@/i18n/routing';
import { requireRole } from '@/lib/auth/queries';
import { getCoachClientSummary, getCoachPlanFormData } from '@/lib/plans/queries';

export default async function EditPlanPage({ params }: { params: Promise<{ locale: AppLocale; clientId: string; planId: string }> }) {
  const { locale, clientId, planId } = await params;
  const profile = await requireRole(locale, 'coach');
  const [client, plan] = await Promise.all([
    getCoachClientSummary(profile.id, clientId),
    getCoachPlanFormData(profile.id, clientId, planId)
  ]);

  if (!client || !plan) notFound();

  const t = await getTranslations('coach');
  const common = await getTranslations('common');

  return (
    <CoachPlanForm
      locale={locale}
      initialValues={plan}
      labels={{
        title: t('editPlanForClient', { name: client.fullName }),
        subtitle: t('editPlanIntro'),
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
