import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { PRACTICE_TARGETS } from "@/lib/exam/pattern";
import { SECTION_LABELS, TOPICS, topicsFor, type SectionId } from "@/lib/questions";

const MCQ_SECTIONS: SectionId[] = ["reasoning", "math", "verbal", "pseudocode", "puzzle"];
const TOPIC_SECTION = new Map(TOPICS.map((t) => [t.id, t.section]));

export interface TopicStat {
  id: string;
  label: string;
  section: SectionId;
  weight: number;
  attempted: number;
  correct: number;
  /** Plain accuracy over answered questions. */
  accuracy: number | null;
  /**
   * Recency-weighted, smoothed estimate of how likely you are to get the next one right.
   * Newer answers count more (decay 0.85 per older answer) and a weak prior of 50% keeps a
   * single lucky/unlucky answer from dominating.
   */
  mastery: number;
  avgSec: number | null;
  targetSec: number;
}

/**
 * Answers that count toward analytics: answered MCQs from submitted tests, plus practice sets
 * (which are graded instantly). Everything below is aggregated in SQL so the cost doesn't grow
 * with how much a student has practised.
 */
const countsFilter = (userId: string) => sql`
  a.user_id = ${userId}
  AND q.answer_index >= 0
  AND q.chosen_index IS NOT NULL
  AND (a.status = 'SUBMITTED' OR a.mode = 'PRACTICE')`;

export async function getTopicStats(userId: string): Promise<TopicStat[]> {
  const [agg, recent] = await Promise.all([
    db.execute<{ topic: string; attempted: number; correct: number; avg_ms: number | null }>(sql`
      SELECT q.topic AS topic,
             COUNT(*) AS attempted,
             SUM(CASE WHEN q.chosen_index = q.answer_index THEN 1 ELSE 0 END) AS correct,
             AVG(CASE WHEN q.time_spent_ms > 0 THEN q.time_spent_ms END) AS avg_ms
      FROM attempt_questions q JOIN attempts a ON a.id = q.attempt_id
      WHERE ${countsFilter(userId)}
      GROUP BY q.topic`),
    // The 40 most recent answers per topic, for the recency-weighted mastery estimate.
    db.execute<{ topic: string; ok: number; rn: number }>(sql`
      SELECT topic, ok, rn FROM (
        SELECT q.topic AS topic,
               CASE WHEN q.chosen_index = q.answer_index THEN 1 ELSE 0 END AS ok,
               ROW_NUMBER() OVER (PARTITION BY q.topic ORDER BY q.answered_at DESC) AS rn
        FROM attempt_questions q JOIN attempts a ON a.id = q.attempt_id
        WHERE ${countsFilter(userId)}
      ) t WHERE rn <= 40`),
  ]);
  return topicStats(agg, recent);
}

/** Pure function (easy to unit-test): combines SQL aggregates into per-topic stats. */
export function topicStats(
  agg: { topic: string; attempted: number; correct: number; avg_ms: number | null }[],
  recent: { topic: string; ok: number; rn: number }[],
): TopicStat[] {
  const aggBy = new Map(agg.map((a) => [a.topic, a]));
  return TOPICS.filter((t) => t.section !== "writing").map((t) => {
    const a = aggBy.get(t.id);
    let num = 1; // prior: 1 correct out of 2
    let den = 2;
    for (const r of recent) {
      if (r.topic !== t.id) continue;
      const w = 0.85 ** (r.rn - 1);
      num += w * r.ok;
      den += w;
    }
    const attempted = Number(a?.attempted ?? 0);
    const correct = Number(a?.correct ?? 0);
    return {
      id: t.id,
      label: t.label,
      section: t.section,
      weight: t.weight,
      attempted,
      correct,
      accuracy: attempted ? correct / attempted : null,
      mastery: num / den,
      avgSec: a?.avg_ms ? a.avg_ms / 1000 : null,
      targetSec: t.targetSec,
    };
  });
}

/** Questions answered per local day for the last `days` days (IST by default). */
export async function activityByDay(userId: string, days = 14, tzOffsetMin = 330) {
  const since = Date.now() - days * 86_400_000;
  const rows = await db.execute<{ day: string; n: number }>(sql`
    SELECT to_char(to_timestamp(q.answered_at / 1000 + ${tzOffsetMin * 60}) AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day, COUNT(*) AS n
    FROM attempt_questions q JOIN attempts a ON a.id = q.attempt_id
    WHERE a.user_id = ${userId} AND q.answered_at >= ${since}
    GROUP BY day`);
  const by = new Map(rows.map((r) => [r.day, Number(r.n)]));
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(Date.now() + tzOffsetMin * 60_000 - (days - 1 - i) * 86_400_000).toISOString().slice(0, 10);
    return { day: d, n: by.get(d) ?? 0 };
  });
}

export function sectionStats(stats: TopicStat[]) {
  return MCQ_SECTIONS.map((section) => {
    const ts = stats.filter((s) => s.section === section);
    const attempted = ts.reduce((a, t) => a + t.attempted, 0);
    const correct = ts.reduce((a, t) => a + t.correct, 0);
    const totalW = ts.reduce((a, t) => a + t.weight, 0);
    // Readiness: mastery weighted by how often each topic appears in the paper.
    const readiness = ts.reduce((a, t) => a + t.mastery * t.weight, 0) / totalW;
    return {
      section,
      label: SECTION_LABELS[section],
      attempted,
      correct,
      accuracy: attempted ? correct / attempted : null,
      readiness,
      target: PRACTICE_TARGETS[section] ?? 0.6,
      coverage: ts.filter((t) => t.attempted > 0).length / ts.length,
    };
  });
}

export async function mockHistory(userId: string) {
  // One grouped query instead of one query per mock.
  const rows = await db.execute<{
    id: string; title: string; submitted_at: number; score: number; max_score: number; violations: number; auto_submitted: boolean;
    section: string; correct: number; total: number;
  }>(sql`
    SELECT a.id, a.title, a.submitted_at, a.score, a.max_score, a.violations, a.auto_submitted,
           q.section AS section,
           SUM(CASE WHEN q.is_correct THEN 1 ELSE 0 END) AS correct,
           COUNT(*) AS total
    FROM attempts a JOIN attempt_questions q ON q.attempt_id = a.id AND q.answer_index >= 0
    WHERE a.user_id = ${userId} AND a.mode = 'MOCK' AND a.status = 'SUBMITTED'
    GROUP BY a.id, q.section
    ORDER BY a.submitted_at ASC`);
  const byId = new Map<string, MockSummary>();
  for (const r of rows) {
    let m = byId.get(r.id);
    if (!m) {
      m = {
        id: r.id, title: r.title, submittedAt: new Date(Number(r.submitted_at)), score: Number(r.score ?? 0), maxScore: Number(r.max_score ?? 0),
        violations: Number(r.violations), autoSubmitted: !!r.auto_submitted,
        bySection: Object.fromEntries(MCQ_SECTIONS.map((s) => [s, { correct: 0, total: 0 }])) as MockSummary["bySection"],
      };
      byId.set(r.id, m);
    }
    m.bySection[r.section as SectionId] = { correct: Number(r.correct), total: Number(r.total) };
  }
  return [...byId.values()];
}

export interface MockSummary {
  id: string;
  title: string;
  submittedAt: Date;
  score: number;
  maxScore: number;
  violations: number;
  autoSubmitted: boolean;
  bySection: Record<SectionId, { correct: number; total: number }>;
}

export interface Recommendation {
  kind: "topic" | "mock" | "mistakes" | "speed" | "section";
  title: string;
  reason: string;
  topicId?: string;
  /** For section-level advice: the weakest topics in that section, practised together. */
  topicIds?: string[];
  priority: number;
}

/**
 * Personal recommendations. Rule-based and explainable on purpose: every suggestion says *why*,
 * so you can judge it instead of trusting a black box.
 *
 * priority(topic) = (exam weight within section) × (1 − mastery) × (confidence boost when barely practised)
 */
export function recommend(
  stats: TopicStat[],
  history: MockSummary[],
  wrongCount: number,
): Recommendation[] {
  const recs: Recommendation[] = [];
  for (const section of MCQ_SECTIONS) {
    const ts = stats.filter((s) => s.section === section);
    const totalW = topicsFor(section).reduce((a, t) => a + t.weight, 0);
    for (const t of ts) {
      const share = t.weight / totalW;
      const unexplored = t.attempted < 3;
      const priority = share * (1 - t.mastery) * (unexplored ? 1.3 : 1);
      const reason = unexplored
        ? `Not practised enough yet (${t.attempted} answered). It is one of the ${t.weight >= 3 ? "most frequent" : "regular"} ${SECTION_LABELS[section]} topics.`
        : `Accuracy ${Math.round((t.accuracy ?? 0) * 100)}% over ${t.attempted} questions; recent form ${Math.round(t.mastery * 100)}%.`;
      recs.push({ kind: "topic", title: `Practise ${t.label}`, reason, topicId: t.id, priority });

      if (t.avgSec && t.attempted >= 5 && t.avgSec > t.targetSec * 1.4 && (t.accuracy ?? 0) >= 0.6) {
        recs.push({
          kind: "speed",
          title: `Speed up on ${t.label}`,
          reason: `You're accurate (${Math.round((t.accuracy ?? 0) * 100)}%) but take ${Math.round(t.avgSec)}s per question against a ${t.targetSec}s target. Do a timed set.`,
          topicId: t.id,
          priority: share * 0.5,
        });
      }
    }
  }

  const lastMock = history.at(-1);
  const daysSinceMock = lastMock ? (Date.now() - lastMock.submittedAt.getTime()) / 86_400_000 : Infinity;
  const practised = stats.reduce((a, t) => a + t.attempted, 0);
  if (!lastMock && practised >= 30) {
    recs.push({ kind: "mock", title: "Take your first full mock", reason: `You've answered ${practised} practice questions. A full mock shows how you hold up under sectional timers.`, priority: 0.5 });
  } else if (lastMock && daysSinceMock > 4) {
    recs.push({ kind: "mock", title: "Take another full mock", reason: `Your last mock was ${Math.floor(daysSinceMock)} days ago. Regular mocks build stamina for the 100+ minute paper.`, priority: 0.3 });
  } else if (!lastMock) {
    recs.push({ kind: "mock", title: "Try a diagnostic mock", reason: "A first mock — even unprepared — gives a baseline so recommendations can target your real weak spots.", priority: 0.2 });
  }

  if (lastMock) {
    const below = MCQ_SECTIONS.map((s) => ({ s, ...lastMock.bySection[s], target: PRACTICE_TARGETS[s] ?? 0.6 }))
      .filter((x) => x.total && x.correct / x.total < x.target)
      .sort((a, b) => a.correct / a.total - a.target - (b.correct / b.total - b.target))
      .slice(0, 2); // the two biggest gaps; topic-level advice covers the rest
    for (const { s, correct, total, target } of below) {
      const weakest = recs
        .filter((r) => r.kind === "topic" && TOPIC_SECTION.get(r.topicId!) === s)
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 3);
      recs.push({
        kind: "section",
        title: `${SECTION_LABELS[s]} is below target`,
        reason: `Last mock: ${correct}/${total} (${Math.round((correct / total) * 100)}%) vs a practice target of ${Math.round(target * 100)}%. Each section has its own cut-off. Start with: ${weakest.map((w) => w.title.replace("Practise ", "")).join(", ")}.`,
        topicIds: weakest.map((w) => w.topicId!),
        priority: 0.35 + (target - correct / total),
      });
    }
  }

  if (wrongCount >= 5) {
    recs.push({ kind: "mistakes", title: `Retry ${Math.min(wrongCount, 20)} recent mistakes`, reason: "Re-solving questions you got wrong is the fastest way to fix recurring errors.", priority: 0.25 });
  }

  return recs.sort((a, b) => b.priority - a.priority);
}
