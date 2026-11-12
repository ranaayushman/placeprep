"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { requireAdmin, requireStaff } from "@/lib/auth";
import { addMockAccess, deleteDraft, MAX_MOCK_SECTIONS, MockExamError, removeMockAccess, saveDraft, setPublished } from "@/lib/exam/exams";

export type MockFormState = { error?: string; values?: Record<string, string> } | undefined;

const back = (id: string, msg: string) => {
  revalidatePath("/admin/mocks");
  redirect(`/admin/mocks/${encodeURIComponent(id)}?msg=${encodeURIComponent(msg)}`);
};

/** Create (no id) or edit a draft. Admins and moderators. */
export async function saveMockAction(_: MockFormState, form: FormData): Promise<MockFormState> {
  const user = await requireStaff();
  const values = Object.fromEntries([...form.entries()].map(([k, x]) => [k, String(x)]));
  // Rows with no section chosen are left empty on purpose.
  const pattern = Array.from({ length: MAX_MOCK_SECTIONS }, (_, i) => ({ section: values[`section${i}`], questions: values[`questions${i}`], minutes: values[`minutes${i}`] })).filter((r) => r.section);
  let id: string;
  try {
    ({ id } = await saveDraft(user.id, values.id || null, { company: values.company ?? "", name: values.name ?? "", short: values.short ?? "", note: values.note, level: (values.level as never) || undefined, restricted: values.restricted === "on", pattern: pattern as never }));
  } catch (e) {
    if (e instanceof ZodError) return { error: e.issues[0].message, values };
    if (e instanceof MockExamError) return { error: e.message, values };
    throw e;
  }
  back(id, values.id ? "Draft saved." : "Draft created. An admin publishes it for students.");
}

export async function publishMockAction(form: FormData) {
  const admin = await requireAdmin();
  const id = String(form.get("id") ?? "");
  const publish = form.get("publish") === "on";
  try {
    await setPublished(admin.id, id, publish);
  } catch (e) {
    if (e instanceof MockExamError) back(id, e.message);
    throw e;
  }
  revalidatePath("/", "layout");
  back(id, publish ? "Published. Students can take it now." : "Unpublished. Students can no longer start it.");
}

/** Admins only: grant an email access to a restricted mock. */
export async function addAccessAction(form: FormData) {
  const admin = await requireAdmin();
  const id = String(form.get("id") ?? "");
  const email = String(form.get("email") ?? "");
  let added: string;
  try {
    added = await addMockAccess(id, email, admin.id);
  } catch (e) {
    if (e instanceof MockExamError) back(id, e.message);
    throw e;
  }
  back(id, `Added ${added} to the allowlist.`);
}

/** Admins only: revoke an email's access to a restricted mock. */
export async function removeAccessAction(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id") ?? "");
  const email = String(form.get("email") ?? "");
  await removeMockAccess(id, email);
  back(id, `Removed ${email.trim().toLowerCase()} from the allowlist.`);
}

export async function deleteMockAction(form: FormData) {
  await requireStaff();
  const id = String(form.get("id") ?? "");
  try {
    await deleteDraft(id);
  } catch (e) {
    if (e instanceof MockExamError) back(id, e.message);
    throw e;
  }
  revalidatePath("/admin/mocks");
  redirect(`/admin/mocks?msg=${encodeURIComponent("Draft deleted.")}`);
}
