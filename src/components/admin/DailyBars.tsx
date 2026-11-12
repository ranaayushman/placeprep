/** One-series daily bar chart (plain SVG, server-rendered). Hover a day for its exact value. */
const W = 640;
const H = 180;
const PAD = { top: 12, right: 8, bottom: 24, left: 32 };
const COLOR = "#2a78d6"; // first validated categorical slot, same as QuestionChart
const INK = "#52514e";
const GRID = "#e6e5e0";

/** A round axis top and step (1, 2 or 5 × 10ⁿ) giving at most 4 gridlines. */
function scale(v: number) {
  const raw = Math.max(v, 1) / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = Math.max(1, [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= raw)!);
  return { step, max: Math.ceil(Math.max(v, 1) / step) * step };
}

const short = (day: string) => new Date(`${day}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });

export function DailyBars({ data, label, unit }: { data: { day: string; n: number }[]; label: string; unit: string }) {
  const { max, step } = scale(Math.max(...data.map((d) => d.n)));
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const band = plotW / data.length;
  const barW = Math.max(2, band - 2); // 2px gap between bars
  const y = (v: number) => PAD.top + plotH * (1 - v / max);
  const ticks = Array.from({ length: max / step + 1 }, (_, i) => i * step);
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={label}>
        <g fontSize="11" fill={INK}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke={t ? GRID : INK} />
              <text x={PAD.left - 6} y={y(t) + 4} textAnchor="end">{t}</text>
            </g>
          ))}
          {data.map((d, i) =>
            i % 7 === (data.length - 1) % 7 ? (
              <text key={d.day} x={PAD.left + band * (i + 0.5)} y={H - 6} textAnchor="middle">{short(d.day)}</text>
            ) : null,
          )}
        </g>
        {data.map((d, i) => {
          const x = PAD.left + band * i + (band - barW) / 2;
          const h = plotH * (d.n / max);
          const r = Math.min(4, barW / 2, h);
          return (
            <g key={d.day}>
              {d.n > 0 && (
                // Rounded top, square bottom on the baseline.
                <path
                  d={`M${x},${y(0)} V${y(d.n) + r} Q${x},${y(d.n)} ${x + r},${y(d.n)} H${x + barW - r} Q${x + barW},${y(d.n)} ${x + barW},${y(d.n) + r} V${y(0)} Z`}
                  fill={COLOR}
                />
              )}
              {/* Full-height hit area so thin and zero bars still show their value on hover. */}
              <rect x={PAD.left + band * i} y={PAD.top} width={band} height={plotH} fill="transparent">
                <title>{`${short(d.day)}: ${d.n} ${unit}`}</title>
              </rect>
            </g>
          );
        })}
      </svg>
      <table className="sr-only">
        <caption>{label}</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.day}><th>{d.day}</th><td>{d.n}</td></tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
