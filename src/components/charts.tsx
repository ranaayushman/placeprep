/** Tiny dependency-free SVG/CSS charts. */

export function ProgressBar({ value, target, label }: { value: number | null; target?: number; label?: string }) {
  const pct = value == null ? 0 : Math.round(value * 100);
  const color = value == null ? "bg-slate-200" : target != null && value < target ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="relative h-2.5 w-full rounded-full bg-slate-100" aria-label={label} title={label}>
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      {target != null && (
        <div className="absolute -top-1 h-4.5 w-0.5 bg-slate-700" style={{ left: `${Math.round(target * 100)}%` }} title={`Target ${Math.round(target * 100)}%`} />
      )}
    </div>
  );
}

export function LineChart({ points, height = 180 }: { points: { label: string; value: number }[]; height?: number }) {
  if (points.length === 0) return null;
  const w = 600;
  const pad = 32;
  const xs = (i: number) => (points.length === 1 ? w / 2 : pad + (i * (w - 2 * pad)) / (points.length - 1));
  const ys = (v: number) => height - pad - v * (height - 2 * pad);
  const path = points.map((p, i) => `${i ? "L" : "M"}${xs(i)},${ys(p.value)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" role="img" aria-label="Score trend">
      {[0, 0.25, 0.5, 0.75, 1].map((g) => (
        <g key={g}>
          <line x1={pad} x2={w - pad} y1={ys(g)} y2={ys(g)} className="stroke-slate-200" strokeDasharray="3 3" />
          <text x={4} y={ys(g) + 4} className="fill-slate-400 text-[10px]">{g * 100}%</text>
        </g>
      ))}
      <path d={path} fill="none" className="stroke-indigo-600" strokeWidth={2.5} />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={xs(i)} cy={ys(p.value)} r={4} className="fill-indigo-600" />
          <text x={xs(i)} y={ys(p.value) - 10} textAnchor="middle" className="fill-slate-700 text-[11px] font-semibold">{Math.round(p.value * 100)}%</text>
          <text x={xs(i)} y={height - 8} textAnchor="middle" className="fill-slate-400 text-[10px]">{p.label}</text>
        </g>
      ))}
    </svg>
  );
}

export const pct = (v: number | null) => (v == null ? "—" : `${Math.round(v * 100)}%`);
