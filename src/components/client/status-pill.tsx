export function StatusPill({ status }: { status: string }) {
  const className = status === 'completed'
    ? 'status-pill status-completed'
    : status === 'skipped'
      ? 'status-pill status-skipped'
      : status === 'changed'
        ? 'status-pill status-changed'
        : 'status-pill status-neutral';

  return <span className={className}>{status.replace('_', ' ')}</span>;
}
