import { getTranslations } from 'next-intl/server';
import { BarChart } from '@/components/charts/bar-chart';
import { LineChart } from '@/components/charts/line-chart';
import { MetricCard } from '@/components/shared/metric-card';
import { AppLocale } from '@/i18n/routing';
import { requireRole } from '@/lib/auth/queries';
import { getCoachReportsData } from '@/lib/data/dashboard';

export default async function CoachReportsPage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params;
  const profile = await requireRole(locale, 'coach');
  const t = await getTranslations('coach');
  const data = await getCoachReportsData(profile.id);

  const avgAdherence = data.dailyAdherence.length
    ? Math.round(data.dailyAdherence.reduce((sum, item) => sum + item.adherence, 0) / data.dailyAdherence.length)
    : 0;

  const atRiskClients = data.clientSummaries.filter((item) => item.adherence < 70).length;
  const avgStreak = data.clientSummaries.length
    ? Math.round(data.clientSummaries.reduce((sum, item) => sum + item.currentStreak, 0) / data.clientSummaries.length)
    : 0;

  return (
    <div className="stack">
      <div>
        <h1 style={{ marginBottom: 8 }}>{t('reports')}</h1>
        <p className="muted">{t('reportsIntro')}</p>
      </div>

      <div className="grid grid-3">
        <MetricCard label={t('teamAdherence')} value={`${avgAdherence}%`} hint={t('teamAdherenceHint')} />
        <MetricCard label={t('atRiskClients')} value={String(atRiskClients)} hint={t('atRiskClientsHint')} />
        <MetricCard label={t('avgStreak')} value={String(avgStreak)} hint={t('avgStreakHint')} />
      </div>

      <div className="grid grid-2">
        <div className="card stack">
          <div>
            <h2 style={{ margin: 0 }}>{t('adherenceTrend')}</h2>
            <p className="muted" style={{ margin: '6px 0 0' }}>{t('adherenceTrendCoachHint')}</p>
          </div>
          <LineChart points={data.dailyAdherence.map((item) => ({ label: item.date.slice(5), value: item.adherence }))} />
        </div>

        <div className="card stack">
          <div>
            <h2 style={{ margin: 0 }}>{t('planStatusBreakdown')}</h2>
            <p className="muted" style={{ margin: '6px 0 0' }}>{t('planStatusBreakdownHint')}</p>
          </div>
          <BarChart
            items={data.statusBreakdown.map((item) => ({
              label: t(`planStatus_${item.label}` as any),
              value: item.count
            }))}
          />
        </div>
      </div>

      <div className="card stack">
        <div className="space-between">
          <h2 style={{ margin: 0 }}>{t('clientPerformance')}</h2>
          <span className="muted">{data.clientSummaries.length} {t('clientsLabel')}</span>
        </div>
        <div className="stack">
          {data.clientSummaries.length ? data.clientSummaries.map((item) => (
            <div key={item.clientId} className="space-between list-row">
              <div className="stack" style={{ gap: 4 }}>
                <strong>{item.clientName}</strong>
                <span className="muted">{item.activePlanTitle ?? t('noActivePlan')}</span>
              </div>
              <div className="report-metrics-row">
                <span className="badge">{t('weeklyAdherence')}: {item.adherence}%</span>
                <span className="badge">{t('currentStreak')}: {item.currentStreak}</span>
                <span className="badge">{t('missedItems')}: {item.missedItems}</span>
              </div>
            </div>
          )) : <p className="muted">{t('emptyReports')}</p>}
        </div>
      </div>
    </div>
  );
}
