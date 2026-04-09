type Point = { label: string; value: number };

export function LineChart({ points, height = 180 }: { points: Point[]; height?: number }) {
  const width = 640;
  const padding = 24;
  const maxValue = Math.max(100, ...points.map((point) => point.value), 1);
  const stepX = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0;
  const polyline = points
    .map((point, index) => {
      const x = padding + index * stepX;
      const y = height - padding - (point.value / maxValue) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="chart-shell stack">
      <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg" role="img" aria-label="line chart">
        {[0, 25, 50, 75, 100].map((tick) => {
          const y = height - padding - (tick / maxValue) * (height - padding * 2);
          return <line key={tick} x1={padding} y1={y} x2={width - padding} y2={y} className="chart-grid-line" />;
        })}
        <polyline points={polyline} fill="none" className="chart-line" />
        {points.map((point, index) => {
          const x = padding + index * stepX;
          const y = height - padding - (point.value / maxValue) * (height - padding * 2);
          return <circle key={`${point.label}-${index}`} cx={x} cy={y} r={4} className="chart-point" />;
        })}
      </svg>
      <div className="chart-label-row">
        {points.map((point) => (
          <span key={point.label} className="chart-x-label">{point.label}</span>
        ))}
      </div>
    </div>
  );
}
