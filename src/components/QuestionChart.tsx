import type { Chart } from "@/lib/questions/types";

/**
 * DI charts as plain SVG, so they work in server and client components and need no library.
 * Values are printed on every mark: a DI question has to be answerable from the chart, and the
 * lighter series colours need visible labels anyway. A hidden table repeats the data for screen readers.
 */
// Validated categorical slots (colour-blind safe in this order); never cycled past the 5 a chart can use.
const COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4"];
const INK = "#52514e";
const GRID = "#e6e5e0";

const W = 560;
const H = 300;
const PAD = { top: 28, right: 16, bottom: 36, left: 44 };

/** A round axis step (1, 2, 2.5 or 5 × 10ⁿ) giving about 4 gridlines, and the axis top it implies. */
function niceScale(v: number) {
  const raw = (v * 1.1) / 4;
  const mag = 10 ** Math.floor(Math.log10(raw || 1));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw)!;
  return { step, max: Math.ceil((v * 1.1) / step) * step };
}

function Axes({ max, step, labels, x }: { max: number; step: number; labels: string[]; x: (i: number) => number }) {
  const ticks = Array.from({ length: Math.round(max / step) + 1 }, (_, i) => i * step);
  const y = (v: number) => PAD.top + (H - PAD.top - PAD.bottom) * (1 - v / max);
  return (
    <g fontSize="11" fill={INK}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke={t ? GRID : INK} strokeWidth={1} />
          <text x={PAD.left - 6} y={y(t) + 4} textAnchor="end">{t}</text>
        </g>
      ))}
      {labels.map((l, i) => (
        <text key={l} x={x(i)} y={H - PAD.bottom + 18} textAnchor="middle">{l}</text>
      ))}
    </g>
  );
}

function Legend({ series }: { series: Chart["series"] }) {
  if (series.length < 2) return null;
  return (
    <ul className="mb-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
      {series.map((s, i) => (
        <li key={s.name} className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COLORS[i] }} aria-hidden />
          {s.name}
        </li>
      ))}
    </ul>
  );
}

function BarOrLine({ chart }: { chart: Chart }) {
  const { max, step } = niceScale(Math.max(...chart.series.flatMap((s) => s.values)));
  const plotW = W - PAD.left - PAD.right;
  const band = plotW / chart.labels.length;
  const cx = (i: number) => PAD.left + band * (i + 0.5);
  const y = (v: number) => PAD.top + (H - PAD.top - PAD.bottom) * (1 - v / max);
  const base = y(0);
  const n = chart.series.length;
  const barW = Math.min(28, (band * 0.7) / n);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-xl" aria-hidden>
      <Axes max={max} step={step} labels={chart.labels} x={cx} />
      {chart.kind === "bar"
        ? chart.series.map((s, si) =>
            s.values.map((v, i) => {
              // 2px gap between neighbouring bars; top corners rounded, bottom flat on the baseline.
              const x = cx(i) - (n * barW) / 2 + si * barW + 1;
              const w = barW - 2;
              const top = y(v);
              const r = Math.min(4, w / 2, base - top);
              return (
                <g key={`${si}-${i}`}>
                  <path d={`M${x},${base} V${top + r} Q${x},${top} ${x + r},${top} H${x + w - r} Q${x + w},${top} ${x + w},${top + r} V${base} Z`} fill={COLORS[si]} />
                  <text x={x + w / 2} y={top - 4} textAnchor="middle" fontSize="10" fill={INK}>{v}</text>
                </g>
              );
            }),
          )
        : chart.series.map((s, si) => (
            <g key={si}>
              <polyline points={s.values.map((v, i) => `${cx(i)},${y(v)}`).join(" ")} fill="none" stroke={COLORS[si]} strokeWidth={2} />
              {s.values.map((v, i) => (
                <g key={i}>
                  <circle cx={cx(i)} cy={y(v)} r={4} fill={COLORS[si]} stroke="#fff" strokeWidth={2} />
                  {/* Line charts have at most 2 series: the higher point is labelled above, the lower below. */}
                  <text x={cx(i)} y={v >= Math.max(...chart.series.map((o) => o.values[i])) && !(si === 1 && chart.series[0].values[i] === v) ? y(v) - 8 : y(v) + 16} textAnchor="middle" fontSize="10" fill={INK}>{v}</text>
                </g>
              ))}
            </g>
          ))}
    </svg>
  );
}

function Pie({ chart }: { chart: Chart }) {
  const values = chart.series[0].values;
  const total = values.reduce((a, b) => a + b, 0);
  const [cx, cy, rad] = [130, 130, 110];
  let angle = -Math.PI / 2;
  const slices = values.map((v, i) => {
    const a0 = angle;
    angle += (v / total) * Math.PI * 2;
    const [x0, y0, x1, y1] = [cx + rad * Math.cos(a0), cy + rad * Math.sin(a0), cx + rad * Math.cos(angle), cy + rad * Math.sin(angle)];
    return <path key={i} d={`M${cx},${cy} L${x0},${y0} A${rad},${rad} 0 ${angle - a0 > Math.PI ? 1 : 0} 1 ${x1},${y1} Z`} fill={COLORS[i]} stroke="#fff" strokeWidth={2} />;
  });
  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg viewBox="0 0 260 260" className="w-52" aria-hidden>{slices}</svg>
      <ul className="space-y-1.5 text-sm text-slate-700">
        {chart.labels.map((l, i) => (
          <li key={l} className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: COLORS[i] }} aria-hidden />
            <span>{l}</span>
            <span className="font-semibold tabular-nums">{values[i]}{chart.unit ?? ""}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function QuestionChart({ chart }: { chart: Chart }) {
  return (
    <figure className="rounded-lg border border-slate-200 bg-[#fcfcfb] p-3">
      <figcaption className="mb-1 text-sm font-semibold text-slate-800">
        {chart.title}
        {chart.unit && chart.kind !== "pie" && <span className="font-normal text-slate-500"> ({chart.unit})</span>}
      </figcaption>
      {chart.kind === "pie" ? <Pie chart={chart} /> : (<><Legend series={chart.series} /><BarOrLine chart={chart} /></>)}
      <table className="sr-only">
        <caption>{chart.title}</caption>
        <thead>
          <tr><th>{chart.kind === "pie" ? "Part" : "Label"}</th>{chart.series.map((s) => <th key={s.name}>{s.name}</th>)}</tr>
        </thead>
        <tbody>
          {chart.labels.map((l, i) => (
            <tr key={l}><td>{l}</td>{chart.series.map((s) => <td key={s.name}>{s.values[i]}{chart.unit === "%" ? "%" : ""}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
