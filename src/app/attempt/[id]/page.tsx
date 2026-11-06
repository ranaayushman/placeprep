import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { attempts, db } from "@/db";
import { requireUser } from "@/lib/auth";
import { ExamRunner } from "@/components/exam/ExamRunner";

export default async function AttemptPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const [attempt] = await db
    .select({ status: attempts.status })
    .from(attempts)
    .where(and(eq(attempts.id, id), eq(attempts.userId, user.id)));
  if (!attempt) notFound();
  if (attempt.status === "SUBMITTED") redirect(`/results/${id}`);
  return <ExamRunner attemptId={id} />;
}
