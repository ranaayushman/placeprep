import "server-only";
import { unstable_cache } from "next/cache";
import { desc } from "drizzle-orm";
import { announcements, db } from "@/db";

export const ANNOUNCEMENTS_TAG = "announcements";

export type Announcement = { id: string; title: string; body: string; createdAt: number };

/** Latest updates for the navbar bell. Cached until an admin posts or deletes one (revalidateTag). */
export const latestAnnouncements = unstable_cache(
  async (): Promise<Announcement[]> => {
    const rows = await db.select().from(announcements).orderBy(desc(announcements.createdAt)).limit(10);
    return rows.map((a) => ({ id: a.id, title: a.title, body: a.body, createdAt: a.createdAt.getTime() }));
  },
  [ANNOUNCEMENTS_TAG],
  { tags: [ANNOUNCEMENTS_TAG] },
);
