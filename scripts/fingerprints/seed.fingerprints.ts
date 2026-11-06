// Seeds / refreshes question_fingerprints for every fixed-bank question (idempotent).
// Run after deploying a change to the question banks: npm run db:seed-fingerprints
import { it } from "vitest";
import { seedBankFingerprints } from "@/lib/community/fingerprints";

it("seeds bank fingerprints", async () => {
  console.log(`[placeprep] ${await seedBankFingerprints()} bank fingerprints up to date`);
}, 120_000);
