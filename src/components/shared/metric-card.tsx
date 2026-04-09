import { DashboardMetric } from '@/types/app';

export function MetricCard({ label, value, hint }: DashboardMetric) {
  return (
    <div className="card stack">
      <span className="muted">{label}</span>
      <strong style={{ fontSize: 28 }}>{value}</strong>
      {hint ? <span className="muted">{hint}</span> : null}
    </div>
  );
}
