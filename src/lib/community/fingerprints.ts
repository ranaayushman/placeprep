import "server-only";
import { and, eq, notInArray, sql } from "drizzle-orm";
import { db, questionFingerprints } from "@/db";
import { generate, TOPIC_BY_ID, TOPICS } from "@/lib/questions";
import { bloodPuzzleRefs } from "@/lib/questions/reasoning";
import { COMMUNITY_SECTIONS, MATCH_FLOOR, OPTIONS_WEIGHT, SHARED_STEM_MIN, STEM_WEIGHT } from "./config";
import { normOptions, normStem } from "./normalize";

/**
 * Refs of every fixed-bank item we compare against: the verbal banks, data sufficiency, the
 * hand-written blood-relation puzzles and the technical bank. Generated topics (math, pseudocode,
 * puzzles, syllogisms…) are unlimited templates, so they are not fingerprinted.
 */
export function bankRefs() {
  const sections: readonly string[] = COMMUNITY_SECTIONS;
  const banks = TOPICS.filter((t) => t.poolSize && sections.includes(t.section)).flatMap((t) => Array.from({ length: t.poolSize! }, (_, i) => `${t.id}:${i}`));
  return [...banks, ...bloodPuzzleRefs()];
}

/** Idempotent: upserts every bank fingerprint and removes bank refs that no longer exist. */
export async function seedBankFingerprints() {
  const rows = bankRefs().map((ref) => {
    const q = generate(ref);
    const topic = ref.split(":")[0];
    return { ref, section: TOPIC_BY_ID.get(topic)!.section, topic, normStem: normStem(q.prompt, q.code), normOptions: normOptions(q.options), source: "BANK" as const };
  });
  await db.transaction(async (tx) => {
    for (let i = 0; i < rows.length; i += 200) {
      await tx
        .insert(questionFingerprints)
        .values(rows.slice(i, i + 200))
        .onConflictDoUpdate({
          target: questionFingerprints.ref,
          set: { section: sql`excluded.section`, topic: sql`excluded.topic`, normStem: sql`excluded.norm_stem`, normOptions: sql`excluded.norm_options` },
        });
    }
    await tx.delete(questionFingerprints).where(and(eq(questionFingerprints.source, "BANK"), notInArray(questionFingerprints.ref, rows.map((r) => r.ref))));
  });
  return rows.length;
}

export type Match = { ref: string; score: number; stemScore: number; optionsScore: number; normStem: string; normOptions: string };

/**
 * Top 5 matches in the same section, by trigram similarity:
 *   score = 0.7 · sim(stem) + 0.3 · sim(options),
 * except where the candidate's stem is an instruction line shared by ≥ 3 bank questions
 * ("Choose the grammatically correct sentence."): then the content is in the options, so
 * score = sim(options).
 *
 * Runs synchronously in the submit action (~ms for a few hundred rows). To move it off the request
 * later: insert the submission as PENDING_REVIEW, enqueue its id, and let a worker run this query and
 * update status + submission_matches.
 */
export async function findMatches(input: { section: string; normStem: string; normOptions: string; excludeRef?: string }): Promise<Match[]> {
  return db.transaction(async (tx) => {
    // Transaction-local threshold for the % operator (set_limit() is per session, which a
    // transaction pooler does not keep between transactions).
    await tx.execute(sql`SELECT set_config('pg_trgm.similarity_threshold', ${String(MATCH_FLOOR)}, true)`);
    const rows = await tx.execute<Match>(sql`
      WITH shared_stems AS (
        SELECT norm_stem FROM question_fingerprints WHERE source = 'BANK' GROUP BY norm_stem HAVING count(*) >= ${SHARED_STEM_MIN}
      ), scored AS (
        SELECT f.ref, f.norm_stem, f.norm_options,
               extensions.similarity(f.norm_stem, ${input.normStem}) AS stem_score,
               extensions.similarity(f.norm_options, ${input.normOptions}) AS options_score,
               f.norm_stem IN (SELECT norm_stem FROM shared_stems) AS shared_stem
        FROM question_fingerprints f
        WHERE f.section = ${input.section}
          AND f.ref <> ${input.excludeRef ?? ""}
          AND (f.norm_stem OPERATOR(extensions.%) ${input.normStem} OR f.norm_options OPERATOR(extensions.%) ${input.normOptions})
      )
      SELECT ref, norm_stem AS "normStem", norm_options AS "normOptions",
             stem_score AS "stemScore", options_score AS "optionsScore",
             CASE WHEN shared_stem THEN options_score
                  ELSE ${STEM_WEIGHT} * stem_score + ${OPTIONS_WEIGHT} * options_score END AS score
      FROM scored
      ORDER BY score DESC
      LIMIT 5`);
    return rows.map((r) => ({ ...r, score: Number(r.score), stemScore: Number(r.stemScore), optionsScore: Number(r.optionsScore) }));
  });
}
