import { getTranslations } from 'next-intl/server';
import { TodayCheckinForm } from '@/components/client/today-checkin-form';
import { StatusPill } from '@/components/client/status-pill';
import { AppLocale } from '@/i18n/routing';
import { requireRole } from '@/lib/auth/queries';
import { getClientTodayData } from '@/lib/data/dashboard';

export default async function TodayPage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params;
  const profile = await requireRole(locale, 'client');
  const t = await getTranslations('client');
  const data = await getClientTodayData(profile.id);

  const whatsappLink = data.coachWhatsApp ? `https://wa.me/${data.coachWhatsApp.replace(/\D/g, '')}` : null;

  return (
    <div className="stack">
      <div>
        <h1 style={{ marginBottom: 8 }}>{t('todayCheckin')}</h1>
        <p className="muted">{t('todayCheckinIntro')}</p>
      </div>

      <div className="grid grid-2">
        <div className="card stack">
          <div className="space-between">
            <div>
              <h2 style={{ margin: 0 }}>{data.activePlanTitle ?? t('noActivePlan')}</h2>
              <p className="muted" style={{ margin: '6px 0 0' }}>{data.dayLabel ?? t('todayDateLabel', { date: data.todayDate })}</p>
            </div>
            {data.isRestDay ? <span className="badge">{t('restDay')}</span> : null}
          </div>
          <div>
            <strong>{t('workout')}</strong>
            <p className="muted">{data.workout ?? t('noWorkoutToday')}</p>
          </div>
          <div>
            <strong>{t('nutrition')}</strong>
            <p className="muted">{data.meal ?? t('noMealToday')}</p>
          </div>
          <div className="row">
            {whatsappLink ? <a className="button secondary" href={whatsappLink} target="_blank">WhatsApp</a> : null}
            {data.coachEmail ? <a className="button secondary" href={`mailto:${data.coachEmail}`}>Email</a> : null}
          </div>
        </div>

        <div className="card stack">
          <div className="space-between">
            <h2 style={{ margin: 0 }}>{t('recentWeek')}</h2>
            <span className="badge">{t('adherenceLabel')}: {data.summary.adherence}%</span>
          </div>
          <div className="stack">
            {data.recentWeek.map((item) => (
              <div key={item.date} className="space-between list-row">
                <div>
                  <strong>{item.date}</strong>
                  <div className="muted">{item.adherence}%</div>
                </div>
                <div className="row">
                  <StatusPill status={item.workoutStatus} />
                  <StatusPill status={item.mealStatus} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <TodayCheckinForm
        locale={locale}
        data={data}
        labels={{
          save: t('saveCheckin'),
          update: t('updateCheckin'),
          workoutStatus: t('workoutStatus'),
          mealStatus: t('mealStatus'),
          workoutNote: t('workoutNote'),
          mealNote: t('mealNote'),
          overallRating: t('overallRating'),
          completed: t('completed'),
          skipped: t('skipped'),
          changed: t('changed'),
          notApplicable: t('notApplicable'),
          saved: t('checkinSavedMessage'),
          noPlan: t('noPlanForCheckin'),
          noPlanHint: t('noPlanForCheckinHint'),
          notesHint: t('notesHint'),
          statusHint: t('statusHint'),
          summaryTitle: t('checkinSummary'),
          completedItems: t('completedItems'),
          skippedItems: t('skippedItems'),
          changedItems: t('changedItems'),
          trackedItems: t('trackedItems'),
          adherenceLabel: t('adherenceLabel'),
          savedAt: t('savedAt')
        }}
      />
    </div>
  );
}
