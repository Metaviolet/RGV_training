import { getTranslations } from 'next-intl/server';
import { MetricCard } from '@/components/shared/metric-card';
import { LineChart } from '@/components/charts/line-chart';
import { AppLocale } from '@/i18n/routing';
import { requireRole } from '@/lib/auth/queries';
import { getClientDashboardData } from '@/lib/data/dashboard';

export default async function ClientDashboardPage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params;
  const profile = await requireRole(locale, 'client');
  const t = await getTranslations('client');
  const dashboard = await getClientDashboardData(profile.id);

  return (
    <div className="stack">
      <div>
        <h1 style={{ marginBottom: 8 }}>{t('welcome')}</h1>
        <p className="muted">{t('dashboardIntro')}</p>
      </div>

      <div className="grid grid-3">
        <MetricCard label={t('currentStreak')} value={`${dashboard.currentStreak} ${t('days')}`} hint={t('streakHint')} />
        <MetricCard label={t('weeklyAdherence')} value={`${dashboard.weeklyAdherence}%`} hint={t('weeklyAdherenceHint')} />
        <MetricCard label={t('todayPlan')} value={String(dashboard.todayPlanCount)} hint={t('todayPlanHint')} />
      </div>

      <div className="grid grid-2">
        <div className="card stack">
          <div className="space-between">
            <div>
              <h2 style={{ margin: 0 }}>{t('todayPlan')}</h2>
              <p className="muted" style={{ margin: '6px 0 0' }}>{dashboard.activePlanTitle ?? t('noActivePlan')}</p>
            </div>
            {dashboard.todayCheckinSaved ? <span className="badge">{t('checkinSaved')}</span> : null}
          </div>
          {dashboard.dayLabel ? <span className="badge">{dashboard.dayLabel}</span> : null}
          <div>
            <strong>{t('workout')}</strong>
            <p className="muted">{dashboard.todayWorkout ?? t('noWorkoutToday')}</p>
          </div>
          <div>
            <strong>{t('nutrition')}</strong>
            <p className="muted">{dashboard.todayMeal ?? t('noMealToday')}</p>
          </div>
          <div className="row">
            <a className="button" href={`/${locale}/client/today`}>{t('openTodayCheckin')}</a>
          </div>
        </div>

        <div className="card stack">
          <div>
            <h2 style={{ margin: 0 }}>{t('adherenceTrend')}</h2>
            <p className="muted" style={{ margin: '6px 0 0' }}>{t('adherenceTrendHint')}</p>
          </div>
          <LineChart
            points={dashboard.adherenceTrend.map((item) => ({
              label: item.date.slice(5),
              value: item.adherence
            }))}
          />
        </div>
      </div>

      <div className="card stack">
        <h2 style={{ margin: 0 }}>{t('contactCoach')}</h2>
        <div className="row">
          {dashboard.coachWhatsApp ? <a className="button" href={`https://wa.me/${dashboard.coachWhatsApp.replace(/\D/g, '')}`} target="_blank">WhatsApp</a> : null}
          {dashboard.coachEmail ? <a className="button secondary" href={`mailto:${dashboard.coachEmail}`}>Email</a> : null}
          {!dashboard.coachWhatsApp && !dashboard.coachEmail ? <p className="muted">{t('noCoachContact')}</p> : null}
        </div>
      </div>
    </div>
  );
}
