/** Tile-grid map of Indian states/UTs (one square each, roughly where it sits), shaded by count. No borders drawn on purpose. */
const TILES: [code: string, name: string, col: number, row: number][] = [
  ["JK", "Jammu and Kashmir", 2, 0], ["LA", "Ladakh", 3, 0],
  ["PB", "Punjab", 1, 1], ["CH", "Chandigarh", 2, 1], ["HP", "Himachal Pradesh", 3, 1],
  ["RJ", "Rajasthan", 1, 2], ["HR", "Haryana", 2, 2], ["DL", "Delhi", 3, 2], ["UK", "Uttarakhand", 4, 2], ["SK", "Sikkim", 5, 2], ["AR", "Arunachal Pradesh", 7, 2],
  ["GJ", "Gujarat", 1, 3], ["MP", "Madhya Pradesh", 2, 3], ["UP", "Uttar Pradesh", 3, 3], ["BR", "Bihar", 4, 3], ["WB", "West Bengal", 5, 3], ["AS", "Assam", 6, 3], ["NL", "Nagaland", 7, 3],
  ["DN", "Dadra and Nagar Haveli and Daman and Diu", 0, 4], ["MH", "Maharashtra", 1, 4], ["CG", "Chhattisgarh", 2, 4], ["JH", "Jharkhand", 4, 4], ["ML", "Meghalaya", 6, 4], ["MN", "Manipur", 7, 4],
  ["GA", "Goa", 0, 5], ["TG", "Telangana", 2, 5], ["OD", "Odisha", 4, 5], ["TR", "Tripura", 6, 5], ["MZ", "Mizoram", 7, 5],
  ["KA", "Karnataka", 1, 6], ["AP", "Andhra Pradesh", 2, 6],
  ["KL", "Kerala", 1, 7], ["TN", "Tamil Nadu", 2, 7], ["PY", "Puducherry", 3, 7],
  ["LD", "Lakshadweep", 0, 8], ["AN", "Andaman and Nicobar", 5, 8],
];
const RGB = "42,120,214"; // #2a78d6, the admin charts' blue

export function IndiaHeatMap({ counts }: { counts: Map<string, number> }) {
  const max = Math.max(1, ...counts.values());
  return (
    <div className="flex flex-wrap items-end gap-4">
      <div role="img" aria-label="Sign-ups by Indian state, darker is more. Exact numbers are in the table." className="grid w-full max-w-sm grid-cols-8 gap-1">
        {TILES.map(([code, name, col, row]) => {
          const n = counts.get(name) ?? 0;
          const a = n ? 0.15 + (0.85 * n) / max : 0; // a non-zero state always shows some colour
          return (
            <div
              key={code}
              title={`${name}: ${n}`}
              style={{ gridColumn: col + 1, gridRow: row + 1, backgroundColor: n ? `rgba(${RGB},${a})` : undefined }}
              className={`flex aspect-square items-center justify-center rounded text-[10px] font-semibold sm:text-xs ${n ? (a > 0.55 ? "text-white" : "text-slate-800") : "bg-slate-100 text-slate-400"}`}
            >
              {code}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span>0</span>
        <span className="h-2 w-24 rounded" style={{ background: `linear-gradient(to right, rgba(${RGB},0.15), rgba(${RGB},1))` }} />
        <span>{max}</span>
      </div>
    </div>
  );
}
