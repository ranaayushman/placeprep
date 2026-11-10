import "server-only";
import { asc, eq, sql } from "drizzle-orm";
import { db, deletionRequests, users } from "@/db";

/** The Privacy Policy promises deletion within this many days of a request. */
export const DELETION_DUE_DAYS = 30;
export const deletionDue = (requestedAt: Date) => new Date(requestedAt.getTime() + DELETION_DUE_DAYS * 86_400_000);

export async function requestDeletion(userId: string, reason: string | null) {
  await db.insert(deletionRequests).values({ userId, reason: reason?.trim().slice(0, 500) || null }).onConflictDoNothing();
}
export async function cancelDeletionRequest(userId: string) {
  await db.delete(deletionRequests).where(eq(deletionRequests.userId, userId));
}
export async function myDeletionRequest(userId: string) {
  return (await db.select().from(deletionRequests).where(eq(deletionRequests.userId, userId)))[0] ?? null;
}

/** Open requests, oldest (closest to the deadline) first. */
export async function pendingDeletions() {
  return db
    .select({ userId: deletionRequests.userId, reason: deletionRequests.reason, createdAt: deletionRequests.createdAt, name: users.name, email: users.email, role: users.role })
    .from(deletionRequests)
    .innerJoin(users, eq(users.id, deletionRequests.userId))
    .orderBy(asc(deletionRequests.createdAt));
}
export const pendingDeletionCount = async () => (await db.select({ n: sql<number>`count(*)::int` }).from(deletionRequests))[0].n;
