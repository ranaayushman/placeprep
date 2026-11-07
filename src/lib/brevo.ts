import "server-only";

const listId = () => Number(process.env.BREVO_LIST_ID);
export const brevoEnabled = () => !!process.env.BREVO_API_KEY && !!listId();

async function brevo<T = unknown>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(`https://api.brevo.com/v3/${path}`, {
    method: init?.method ?? "GET",
    headers: { "api-key": process.env.BREVO_API_KEY ?? "", "content-type": "application/json", accept: "application/json" },
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Brevo ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return (res.status === 204 ? undefined : await res.json()) as T;
}

/** Adds an opted-in student to the Brevo list. Best-effort: a Brevo outage must not break onboarding. */
export async function addToBrevo(email: string, name: string) {
  if (!brevoEnabled()) return;
  try {
    // updateEnabled: an existing contact is added to the list instead of failing as a duplicate.
    await brevo("contacts", { method: "POST", body: { email, attributes: { FIRSTNAME: name.split(" ")[0] }, listIds: [listId()], updateEnabled: true } });
  } catch (err) {
    console.error("[brevo] add contact failed:", err);
  }
}

export type Campaign = {
  id: number;
  name: string;
  subject: string;
  status: string;
  sentDate?: string;
  statistics?: { globalStats?: { sent?: number; delivered?: number; uniqueViews?: number; uniqueClicks?: number; unsubscriptions?: number } };
};

export async function campaignOverview() {
  const [list, { campaigns }] = await Promise.all([
    brevo<{ name: string; totalSubscribers: number }>(`contacts/lists/${listId()}`),
    brevo<{ campaigns?: Campaign[] }>("emailCampaigns?limit=20&sort=desc&statistics=globalStats"),
  ]);
  return { list, campaigns: campaigns ?? [] };
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Plain text → simple HTML email: blank lines become paragraphs, plus the unsubscribe link Brevo requires. */
export function toEmailHtml(body: string) {
  const paras = body.trim().split(/\n\s*\n/).map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`);
  return `<html><body style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#1e293b">${paras.join("")}<p style="font-size:12px;color:#94a3b8"><a href="{{ unsubscribe }}">Unsubscribe</a></p></body></html>`;
}

async function activeSender() {
  const { senders } = await brevo<{ senders: { name: string; email: string; active: boolean }[] }>("senders");
  const sender = senders.find((s) => s.active);
  if (!sender) throw new Error("No verified sender in Brevo. Add one under Senders, Domains & Dedicated IPs.");
  return sender;
}

/** One transactional email (e.g. a sign-up code) to one person. Throws if Brevo refuses it. */
export async function sendEmail(to: { email: string; name: string }, subject: string, html: string) {
  const sender = await activeSender();
  await brevo("smtp/email", { method: "POST", body: { sender: { name: sender.name, email: sender.email }, to: [to], subject, htmlContent: html } });
}

/** Creates a campaign for the whole list and sends it immediately. */
export async function sendCampaign(subject: string, body: string) {
  const sender = await activeSender();
  const { id } = await brevo<{ id: number }>("emailCampaigns", {
    method: "POST",
    body: {
      name: `${subject} (${new Date().toISOString().slice(0, 10)})`,
      subject,
      sender: { name: sender.name, email: sender.email },
      htmlContent: toEmailHtml(body),
      recipients: { listIds: [listId()] },
    },
  });
  await brevo(`emailCampaigns/${id}/sendNow`, { method: "POST" });
}
