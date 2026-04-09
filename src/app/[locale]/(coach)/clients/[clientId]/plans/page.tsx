import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { AppLocale } from '@/i18n/routing';
import { requireRole } from '@/lib/auth/queries';
import { getCoachClientSummary, getCoachPlansForClient } from '@/lib/plans/queries';
import { Link } from '@/i18n/navigation';

export default async function ClientPlansPage({ params }: { params: Promise<{ locale: AppLocale; clientId: string }> }) {
  const { locale, clientId } = await params;
  const profile = await requireRole(locale, 'coach');
  const client = await getCoachClientSummary(profile.id, clientId);
  if (!client) notFound();

  const t = await getTranslations('coach');
  const plans = await getCoachPlansForClient(profile.id, clientId);

  return (
    <div className="stack">
      <div className="space-between">
        <div>
          <h1 style={{ marginBottom: 8 }}>{t('plansForClient', { name: client.fullName })}</h1>
          <p className="muted">{t('plansIntro')}</p>
        </div>
        <Link className="button" href={`/coach/clients/${clientId}/plans/new`} locale={locale}>{t('newPlan')}</Link>
      </div>

      <div className="card stack">
        {plans.length ? plans.map((plan) => (
          <div key={plan.id} className="space-between list-row">
            <div>
              <strong>{plan.title}</strong>
              <div className="muted">{t(`planType_${plan.type}`)}</div>
              <div className="muted">{plan.start_date} → {plan.end_date}</div>
            </div>
            <div className="stack" style={{ alignItems: 'flex-end' }}>
              <span className="badge">{t(`planStatus_${plan.status}`)}</span>
              <span className="muted">v{plan.version}</span>
              <Link className="button secondary" href={`/coach/clients/${clientId}/plans/${plan.id}/edit`} locale={locale}>{t('editPlan')}</Link>
            </div>
          </div>
        )) : <p className="muted">{t('emptyPlans')}</p>}
      </div>
    </div>
  );
}
