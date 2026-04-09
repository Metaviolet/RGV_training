import { getTranslations } from 'next-intl/server';
import { AppLocale } from '@/i18n/routing';
import { requireRole } from '@/lib/auth/queries';
import { getCoachClients } from '@/lib/data/dashboard';
import { Link } from '@/i18n/navigation';

export default async function ClientsPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: AppLocale }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  const { q } = await searchParams;
  const profile = await requireRole(locale, 'coach');
  const t = await getTranslations('coach');
  const clients = await getCoachClients(profile.id, q);

  return (
    <div className="stack">
      <div className="space-between">
        <div>
          <h1 style={{ marginBottom: 8 }}>{t('clients')}</h1>
          <p className="muted">{t('clientsIntro')}</p>
        </div>
        <Link className="button" href="/coach/clients/new" locale={locale}>{t('newClient')}</Link>
      </div>

      <div className="card stack">
        <form>
          <input className="input" name="q" defaultValue={q ?? ''} placeholder={t('searchClients')} />
        </form>
        <div className="stack">
          {clients.length ? clients.map((client) => (
            <div key={client.id} className="space-between list-row">
              <div>
                <strong>{client.full_name}</strong>
                <div className="muted">{client.email}</div>
                <div className="muted">{client.goal_summary ?? t('noGoalYet')}</div>
              </div>
              <div className="stack" style={{ alignItems: 'flex-end' }}>
                <span className="badge">{client.active ? t('active') : t('inactive')}</span>
                <span className="muted">{client.current_weight_kg ? `${client.current_weight_kg} kg` : t('noWeight')}</span>
                <div className="row" style={{ justifyContent: 'flex-end' }}>
                  <Link className="button secondary" href={`/coach/clients/${client.id}/plans`} locale={locale}>{t('managePlans')}</Link>
                  <Link className="button secondary" href={`/coach/clients/${client.id}/edit`} locale={locale}>{t('editClient')}</Link>
                </div>
              </div>
            </div>
          )) : <p className="muted">{t('emptyClients')}</p>}
        </div>
      </div>
    </div>
  );
}
