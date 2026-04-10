import { getTranslations } from 'next-intl/server';
import { MetricCard } from '@/components/shared/metric-card';
import { AppLocale } from '@/i18n/routing';
import { requireRole } from '@/lib/auth/queries';
import { getCoachDashboardData } from '@/lib/data/dashboard';

export default async function CoachDashboardPage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params;
  const profile = await requireRole(locale, 'coach');
  const t = await getTranslations('coach');
  const dashboard = await getCoachDashboardData(profile.id);

  const metrics = [
    { label: t('activeClients'), value: String(dashboard.activeClients), hint: t('activeClientsHint') },
    { label: t('lowAdherence'), value: String(dashboard.lowAdherence), hint: t('lowAdherenceHint') },
    { label: t('plansExpiring'), value: String(dashboard.plansExpiring), hint: t('plansExpiringHint') }
  ];

  return (
    <div className="stack">
      <div>
        <h1 style={{ marginBottom: 8 }}>{t('welcome')}</h1>
        <p className="muted">{t('dashboardIntro')}</p>
      </div>

      <div className="grid grid-3">
        {metrics.map((metric) => <MetricCard key={metric.label} label={metric.label} value={metric.value} hint={metric.hint} />)}
      </div>

      <div className="card stack">
        <h2 style={{ margin: 0 }}>{t('recentCheckins')}</h2>
        <div className="stack">
          {dashboard.recentCheckins.length ? dashboard.recentCheckins.map((item) => (
            <div key={`${item.clientName}-${item.date}`} className="space-between list-row">
              <div>
                <strong>{item.clientName}</strong>
                <div className="muted">{item.date}</div>
              </div>
              <span className="badge">W: {item.workoutStatus} · M: {item.mealStatus}</span>
            </div>
          )) : <p className="muted">{t('emptyRecentCheckins')}</p>}
        </div>
      </div>
    </div>
  );
}
