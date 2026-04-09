type BarItem = { label: string; value: number };

export function BarChart({ items }: { items: BarItem[] }) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="stack">
      {items.map((item) => (
        <div key={item.label} className="stack" style={{ gap: 6 }}>
          <div className="space-between" style={{ gap: 8 }}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
