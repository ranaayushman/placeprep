import "server-only";
import { and, eq, inArray, notInArray, sql } from "drizzle-orm";
import { attemptQuestions, attempts, communityQuestions, db, users } from "@/db";
import type { Question, SectionId } from "@/lib/questions";

export const COMMUNITY_PREFIX = "community:";
export const isCommunityRef = (ref: string) => ref.startsWith(COMMUNITY_PREFIX);

/** "Asha Rao" → "Asha R." — never the full name or email of a contributor. */
export function publicName(name: string) {
  const [first, ...rest] = name.trim().split(/\s+/);
  const last = rest.at(-1);
  return last ? `${first} ${last[0].toUpperCase()}.` : first;
}

export type ServedCommunity = { topic: string; section: SectionId; question: Question };

/**
 * Published community questions by id, as engine Questions. Options keep their submitted order (no
 * shuffle), so a stored chosen_index always means the same option — the answer-statistics check needs that.
 */
export async function loadPublished(ids: string[]): Promise<Map<string, ServedCommunity>> {
  if (!ids.length) return new Map();
  const rows = await db
    .select({ q: communityQuestions, author: users.name })
    .from(communityQuestions)
    .innerJoin(users, eq(users.id, communityQuestions.authorId))
    .where(and(inArray(communityQuestions.id, ids), eq(communityQuestions.status, "PUBLISHED")));
  return new Map(
    rows.map(({ q, author }) => [
      q.id,
      {
        topic: q.topic,
        section: q.section as SectionId,
        question: {
          kind: "mcq",
          prompt: q.stem,
          code: q.code ?? undefined,
          options: q.options,
          answer: q.answerIndex,
          explanation: q.explanation,
          community: { id: q.id, author: publicName(author) },
        },
      },
    ]),
  );
}

/** Up to `max` published community questions in `topic` this user has not been given before, random order. */
export async function freshCommunityIds(userId: string, topic: string, max: number) {
  if (max <= 0) return [];
  const seen = db
    .select({ ref: attemptQuestions.ref })
    .from(attemptQuestions)
    .innerJoin(attempts, eq(attempts.id, attemptQuestions.attemptId))
    .where(and(eq(attempts.userId, userId), eq(attemptQuestions.topic, topic)));
  const rows = await db
    .select({ id: communityQuestions.id })
    .from(communityQuestions)
    .where(
      and(
        eq(communityQuestions.topic, topic),
        eq(communityQuestions.status, "PUBLISHED"),
        notInArray(sql`${COMMUNITY_PREFIX} || ${communityQuestions.id}`, seen),
      ),
    )
    .orderBy(sql`random()`)
    .limit(max);
  return rows.map((r) => r.id);
}
