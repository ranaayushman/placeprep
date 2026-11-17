// Builds src/lib/geo/india-ip.json (IP range -> Indian state) from the free DB-IP "IP to City Lite" CSV (CC BY 4.0).
// Download the month's file from https://db-ip.com/db/download/ip-to-city-lite, then:
//   node scripts/geo/build-india-ip.mjs dbip-city-lite-YYYY-MM.csv.gz
import { createReadStream, writeFileSync } from "node:fs";
import { createGunzip } from "node:zlib";
import { createInterface } from "node:readline";
import { isIPv4 } from "node:net";

const file = process.argv[2];
if (!file) throw new Error("usage: node scripts/geo/build-india-ip.mjs <dbip-city-lite.csv.gz>");

const toBig = (ip) => {
  if (isIPv4(ip)) return BigInt(ip.split(".").reduce((a, o) => a * 256 + Number(o), 0));
  const [head, tail = ""] = ip.split("::");
  const h = head ? head.split(":") : [], t = tail ? tail.split(":") : [];
  const parts = ip.includes("::") ? [...h, ...Array(8 - h.length - t.length).fill("0"), ...t] : h;
  return parts.reduce((a, p) => (a << 16n) | BigInt(parseInt(p || "0", 16)), 0n);
};

const states = [];
const out = { v4: [], v6: [] };
const last = { v4: null, v6: null };
const rl = createInterface({ input: createReadStream(file).pipe(createGunzip()) });
for await (const line of rl) {
  const m = line.match(/^([^,]+),([^,]+),[^,]*,IN,("[^"]*"|[^,]*),/);
  if (!m) continue;
  const state = m[3].replace(/"/g, "");
  if (!state) continue;
  let s = states.indexOf(state);
  if (s < 0) s = states.push(state) - 1;
  const fam = isIPv4(m[1]) ? "v4" : "v6";
  const [a, b] = [toBig(m[1]), toBig(m[2])];
  const prev = last[fam];
  if (prev && prev[2] === s && prev[1] + 1n === a) prev[1] = b; // merge adjacent ranges of one state
  else out[fam].push((last[fam] = [a, b, s]));
}
const enc = { v4: (n) => Number(n), v6: (n) => n.toString(16) };
const json = { source: "IP Geolocation by DB-IP (https://db-ip.com), CC BY 4.0", states };
for (const fam of ["v4", "v6"]) json[fam] = out[fam].flatMap(([a, b, s]) => [enc[fam](a), enc[fam](b), s]);
writeFileSync(new URL("../../src/lib/geo/india-ip.json", import.meta.url), JSON.stringify(json));
console.log(`${states.length} states, ${out.v4.length} IPv4 + ${out.v6.length} IPv6 ranges`);
