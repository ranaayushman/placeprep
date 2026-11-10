import { SubmitButton } from "@/components/SubmitButton";
import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db, users } from "@/db";
import { requireUser } from "@/lib/auth";
import { PasswordForm } from "./PasswordForm";
import { DeletionForm } from "./DeletionForm";
import { cancelDeletionAction } from "./actions";
import { deletionDue, DELETION_DUE_DAYS, myDeletionRequest } from "@/lib/deletion-requests";
import { fmtDate } from "@/components/admin/when";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const user = await requireUser();
  const [[row], request] = await Promise.all([db.select({ hash: users.passwordHash }).from(users).where(eq(users.id, user.id)), myDeletionRequest(user.id)]);
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
      <div id="delete" className="card space-y-4 border-red-200">
        <h2 className="font-semibold text-red-800">Delete my account</h2>
        {request ? (
          <>
            <p className="text-sm text-slate-700">
              You asked for deletion on {fmtDate(request.createdAt)}. We&apos;ll delete your account and all its data by <b>{fmtDate(deletionDue(request.createdAt))}</b>. You can keep using PlacePrep until then.
            </p>
            <form action={cancelDeletionAction}>
              <SubmitButton className="btn-secondary">Cancel my request</SubmitButton>
            </form>
          </>
        ) : (
          <>
            <p className="text-sm text-slate-600">We delete your account and everything linked to it within {DELETION_DUE_DAYS} days of your request.</p>
            <DeletionForm />
          </>
        )}
      </div>
    </div>
  );
}
