import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db, users } from "@/db";
import { requireUser } from "@/lib/auth";
import { PasswordForm } from "./PasswordForm";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const user = await requireUser();
  const [row] = await db.select({ hash: users.passwordHash }).from(users).where(eq(users.id, user.id));
  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-semibold">Account</h1>
      <div className="card space-y-1 text-sm">
        <p className="font-medium">{user.name}</p>
        <p className="text-slate-500">{user.email}</p>
      </div>
      <div className="card space-y-4">
        <h2 className="font-semibold">Password</h2>
        {row?.hash ? <PasswordForm /> : <p className="text-sm text-slate-600">You sign in with Google, so there&apos;s no PlacePrep password to change.</p>}
      </div>
    </div>
  );
}
