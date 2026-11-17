import "server-only";
import { readFile } from "node:fs/promises";
import { isIPv4, isIPv6 } from "node:net";
import path from "node:path";

type Table = { states: string[]; v4: number[]; v6: (string | number)[] };
let table: { states: string[]; v4: number[]; v6: { a: bigint; b: bigint; s: number }[] } | null = null;

/** Loaded on first use: ~5 MB, only the admin panel needs it. Rebuild monthly with scripts/geo/build-india-ip.mjs. */
async function load() {
  if (table) return table;
  // Read, not imported: tsc would type-check 5 MB of JSON. next.config.ts traces it into the standalone build.
  const raw = JSON.parse(await readFile(path.join(process.cwd(), "src/lib/geo/india-ip.json"), "utf8")) as Table;
  const v6 = [];
  for (let i = 0; i < raw.v6.length; i += 3) v6.push({ a: BigInt(`0x${raw.v6[i]}`), b: BigInt(`0x${raw.v6[i + 1]}`), s: Number(raw.v6[i + 2]) });
  return (table = { states: raw.states, v4: raw.v4, v6 });
}

function v6ToBig(ip: string) {
  const [head, tail = ""] = ip.split("::");
  const h = head ? head.split(":") : [];
  const t = tail ? tail.split(":") : [];
  const parts = ip.includes("::") ? [...h, ...Array(8 - h.length - t.length).fill("0"), ...t] : h;
  return parts.reduce((acc, p) => (acc << 16n) | BigInt(parseInt(p || "0", 16)), 0n);
}

/** Indian state/UT for an IP, or null (foreign, private, unknown). State-level only: city guesses are unreliable on mobile networks. */
export async function indianStateOf(ip: string | null): Promise<string | null> {
  if (!ip) return null;
  const t = await load();
  const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i)?.[1];
  const v4 = mapped ?? (isIPv4(ip) ? ip : null);
  if (v4) {
    const n = v4.split(".").reduce((a, o) => a * 256 + Number(o), 0);
    let lo = 0, hi = t.v4.length / 3 - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (n < t.v4[mid * 3]) hi = mid - 1;
      else if (n > t.v4[mid * 3 + 1]) lo = mid + 1;
      else return t.states[t.v4[mid * 3 + 2]];
    }
    return null;
  }
  if (!isIPv6(ip)) return null;
  const n = v6ToBig(ip.split("%")[0]);
  let lo = 0, hi = t.v6.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (n < t.v6[mid].a) hi = mid - 1;
    else if (n > t.v6[mid].b) lo = mid + 1;
    else return t.states[t.v6[mid].s];
  }
  return null;
}
