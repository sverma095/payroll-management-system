export function TrendChart({
  points
}: {
  points: { label: string; value: number }[];
}) {
  const max = Math.max(1, ...points.map((p) => p.value));
  const width = 560;
  const height = 140;
  const barGap = 14;
  const barWidth = (width - barGap * (points.length - 1)) / points.length;

  return (
    <svg viewBox={`0 0 ${width} ${height + 24}`} className="w-full h-auto" role="img" aria-label="Payroll cost trend, last six months">
      {points.map((p, i) => {
        const barHeight = Math.max(2, (p.value / max) * height);
        const x = i * (barWidth + barGap);
        const y = height - barHeight;
        const isLast = i === points.length - 1;
        return (
          <g key={p.label}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={4}
              fill={isLast ? "var(--accent-color, #2F5D50)" : "#E7EFEC"}
            />
            <text
              x={x + barWidth / 2}
              y={height + 16}
              textAnchor="middle"
              fontSize="10"
              fill="#6B6A63"
              fontFamily="var(--font-mono)"
            >
              {p.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
