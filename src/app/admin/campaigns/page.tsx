import { SubmitButton } from "@/components/SubmitButton";
import { requireAdmin } from "@/lib/auth";
import { brevoEnabled, campaignOverview } from "@/lib/brevo";
import { fmtDateTime } from "@/components/admin/when";
import { sendCampaignAction } from "../actions";

export const dynamic = "force-dynamic";

const pct = (n = 0, of = 0) => (of ? `${Math.round((n / of) * 100)}%` : "—");

export default async function Campaigns({ searchParams }: { searchParams: Promise<{ msg?: string }> }) {
  await requireAdmin(); // the layout also lets moderators in
  const { msg } = await searchParams;
  if (!brevoEnabled()) {
    return <p className="text-slate-600">Set <code>BREVO_API_KEY</code> and <code>BREVO_LIST_ID</code> to send campaigns.</p>;
  }
  const data = await campaignOverview().catch((err: Error) => err);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Email campaigns</h1>
        <p className="text-sm text-slate-500">
          Sent through Brevo to students who opted in during onboarding.
          {!(data instanceof Error) && <> List “{data.list.name}”: <b>{data.list.totalSubscribers}</b> subscribers.</>}
        </p>
      </div>
      {msg && <div role="status" className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm text-indigo-900">{msg}</div>}
      {data instanceof Error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">Could not reach Brevo: {data.message}</div>}

      <form action={sendCampaignAction} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">New campaign</h2>
        <label className="block text-sm">
          <span className="font-medium">Subject</span>
          <input name="subject" required minLength={3} maxLength={150} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Message</span>
          <span className="block text-xs text-slate-500">Plain text. Leave a blank line between paragraphs. An unsubscribe link is added automatically.</span>
          <textarea name="body" required minLength={10} rows={10} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="confirm" required /> Send now to every subscriber. This can&apos;t be undone.
        </label>
        <SubmitButton className="btn-primary">Send campaign</SubmitButton>
      </form>

      {!(data instanceof Error) && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500">
              <tr><th className="px-4 py-3">Subject</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Sent</th><th className="px-4 py-3 text-right">Delivered</th><th className="px-4 py-3 text-right">Opened</th><th className="px-4 py-3 text-right">Clicked</th><th className="px-4 py-3 text-right">Unsubscribed</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.campaigns.map((c) => {
                const s = c.statistics?.globalStats ?? {};
                return (
                  <tr key={c.id}>
                    <td className="px-4 py-2.5 font-medium">{c.subject}</td>
                    <td className="px-4 py-2.5 text-slate-500">{c.status}</td>
                    <td className="px-4 py-2.5 text-slate-500">{c.sentDate ? fmtDateTime(new Date(c.sentDate)) : "—"}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{s.delivered ?? 0}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{pct(s.uniqueViews, s.delivered)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{pct(s.uniqueClicks, s.delivered)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{s.unsubscriptions ?? 0}</td>
                  </tr>
                );
              })}
              {data.campaigns.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No campaigns yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
