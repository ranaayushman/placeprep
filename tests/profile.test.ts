import { describe, expect, it } from "vitest";
import { passoutYears, profileSchema } from "@/lib/profile";

const base = { college: "PES University", degree: "B.E. / B.Tech", branch: "Computer Science (CSE)", passoutYear: String(new Date().getFullYear()), dreamCompany: "" };

describe("onboarding profile", () => {
  it("accepts a valid profile and turns an empty dream company into null", () => {
    const r = profileSchema.parse(base);
    expect(r.passoutYear).toBe(new Date().getFullYear());
    expect(r.dreamCompany).toBeNull();
  });

  it("rejects values outside the offered options", () => {
    expect(profileSchema.safeParse({ ...base, degree: "PhD" }).success).toBe(false);
    expect(profileSchema.safeParse({ ...base, branch: "" }).success).toBe(false);
    expect(profileSchema.safeParse({ ...base, passoutYear: "1999" }).success).toBe(false);
    expect(profileSchema.safeParse({ ...base, passoutYear: "" }).success).toBe(false);
    expect(profileSchema.safeParse({ ...base, college: " " }).success).toBe(false);
  });

  it("offers last year through four years ahead", () => {
    expect(passoutYears(new Date("2026-11-06"))).toEqual([2025, 2026, 2027, 2028, 2029, 2030]);
  });
});
