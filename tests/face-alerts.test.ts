import { describe, expect, it } from "vitest";
import { createAlertTracker } from "@/components/exam/useFaceProctor";

describe("face alert tracker", () => {
  const run = (pattern: boolean[], grace = 2000, stepMs = 500) => {
    const fired: string[] = [];
    const t = createAlertTracker((type) => fired.push(type));
    pattern.forEach((bad, i) => t.step("gaze-away", bad, grace, i * stepMs));
    return fired.length;
  };
  const away = (ms: number) => Array(ms / 500).fill(true);
  const ok = (ms: number) => Array(ms / 500).fill(false);

  it("ignores glances shorter than the grace time", () => {
    expect(run([...away(1500), ...ok(1000), ...away(1500)])).toBe(0);
  });
  it("a long look away is one alert, not one every few seconds", () => {
    expect(run(away(30_000))).toBe(1);
  });
  it("a short return to normal does not re-arm it", () => {
    expect(run([...away(5000), ...ok(1000), ...away(5000)])).toBe(1);
  });
  it("a new episode after returning to normal is a new alert", () => {
    expect(run([...away(5000), ...ok(3000), ...away(5000)])).toBe(2);
  });
});
