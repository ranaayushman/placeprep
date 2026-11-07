import "server-only";
import { unstable_cache } from "next/cache";
import { desc } from "drizzle-orm";
import { announcements, db } from "@/db";

export const ANNOUNCEMENTS_TAG = "announcements";

export type Announcement = { id: string; title: string; body: string; createdAt: number };

/**
 * Latest updates for the navbar bell. Cached; posting or deleting refreshes it at once (revalidateTag),
 * and `revalidate: 60` catches posts made from another server (localhost vs. the live site share one DB).
 */
export const latestAnnouncements = unstable_cache(
  async (): Promise<Announcement[]> => {
    const rows = await db.select().from(announcements).orderBy(desc(announcements.createdAt)).limit(10);
    return rows.map((a) => ({ id: a.id, title: a.title, body: a.body, createdAt: a.createdAt.getTime() }));
  },
  [ANNOUNCEMENTS_TAG],
  { tags: [ANNOUNCEMENTS_TAG], revalidate: 60 },
);
