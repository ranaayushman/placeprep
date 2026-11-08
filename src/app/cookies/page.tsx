import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { AuthLinks } from "@/components/AuthLinks";
import { CookieSettingsButton } from "@/components/CookieConsent";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "Learn how PlacePrep uses cookies to authenticate students, secure mock sessions, and keep placement practice 100% free.",
  alternates: { canonical: "/cookies" },
};

const COOKIE_INVENTORY = [
  {
    name: "sid",
    provider: "PlacePrep",
    category: "Strictly Necessary",
    purpose: "Stores a random sign-in token so you stay logged in while practising or taking timed mocks.",
    expiry: "30 days (or until logout)",
  },
  {
    name: "g_oauth",
    provider: "PlacePrep",
    category: "Strictly Necessary",
    purpose: "Temporary security token that protects the Google Sign-In redirect. Only set while you sign in with Google.",
    expiry: "10 minutes",
  },
  {
    name: "placeprep_cookie_consent",
    provider: "PlacePrep",
    category: "Strictly Necessary",
    purpose: "Records your cookie consent choices so we remember your preferences.",
    expiry: "1 year",
  },
  {
    name: "pp-updates-seen",
    provider: "PlacePrep",
    category: "Preferences & Functionality",
    purpose: "Local storage, not a cookie: remembers which product updates you have already seen, so the bell's dot hides.",
    expiry: "Until you clear site data",
  },
  {
    name: "Advertising cookies (future)",
    provider: "To be disclosed before activation",
    category: "Advertising",
    purpose: "Not currently active. If advertising is introduced, these would support limited ads in non-exam areas only after the required consent.",
    expiry: "To be disclosed before activation",
  },
];

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-canvas text-deep selection:bg-brand-soft">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-deep/10 bg-canvas/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5">
          <Logo />
          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link href="/" className="text-muted hover:text-deep">
              Home
            </Link>
            <AuthLinks />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
        {/* Title & Introduction */}
        <div className="border-b border-deep/10 pb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 font-mono text-xs font-semibold text-brand-dark">
            <span>🍪 TRANSPARENCY &amp; TRUST</span>
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-deep sm:text-5xl">Cookie Policy</h1>
          <p className="mt-3 text-base text-muted">
            Last updated: November 2026 · Effective immediately for all PlacePrep users.
          </p>
        </div>

        {/* Quick Summary Card */}
        <div className="mt-8 rounded-2xl border border-brand/20 bg-brand-soft/40 p-6 sm:p-8">
          <h2 className="text-xl font-bold text-deep">Summary for Students</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            PlacePrep is built to help students crack campus placement drives without paying predatory fees. We do{" "}
            <strong>not</strong> sell student data or use advertising cookies at present. If limited advertising is
            introduced in non-exam areas, the provider, cookie purposes, and consent choices will be disclosed before
            activation. We will not use advertising tools in a way that accesses camera feeds, answers, or assessment records.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <CookieSettingsButton className="inline-flex items-center gap-2 rounded-xl bg-brand-dark px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-deep">
              <span>Adjust Cookie Preferences</span> →
            </CookieSettingsButton>
            <Link
              href="/privacy"
              className="text-xs font-semibold text-deep underline decoration-brand decoration-2 underline-offset-4 hover:text-brand-dark"
            >
              Read full Privacy Policy
            </Link>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="mt-12 space-y-12 text-slate-800">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-deep">1. What Are Cookies?</h2>
            <p className="leading-relaxed text-slate-700">
              Cookies are small text files placed on your computer, tablet, or smartphone when you visit a website.
              They are widely used to make websites work efficiently, provide secure authentication, and remember your
              settings between page navigations.
            </p>
            <p className="leading-relaxed text-slate-700">
              In addition to standard HTTP cookies, modern web applications may also use browser technologies like{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">localStorage</code> and{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">sessionStorage</code> to store client-side
              state (such as active timers, answer drafts, or offline caches). For simplicity, this policy uses the term
              &ldquo;cookies&rdquo; to refer to all such client storage mechanisms.
            </p>
          </section>

          {/* Advertising note */}
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-deep">Advertising Cookies</h2>
            <p className="leading-relaxed text-slate-700">
              Advertising is not currently active on PlacePrep. We may add small advertising placements outside timed
              mock exams to help keep the platform free. Any non-essential advertising cookies or similar technologies
              will be disabled unless you provide the required consent, and you can withdraw that choice through{" "}
              <CookieSettingsButton className="font-medium text-brand underline">Cookie Settings</CookieSettingsButton>.
              Ads will never be shown inside an active mock question or used to access camera footage and face-check data.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-deep">2. Types of Cookies We Use</h2>
            <p className="leading-relaxed text-slate-700">
              We group the cookies used across PlacePrep into three straightforward categories:
            </p>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-surface p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-deep">Strictly Necessary</h3>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 uppercase">
                    Required
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                  Required for you to navigate PlacePrep, sign in with your email or Google account, and submit proctored mock assessments securely. Without these, the service cannot function.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-surface p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-deep">Preferences</h3>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 uppercase">
                    Optional
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                  Remembers small settings on your device, such as which product updates you have already seen.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-surface p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-deep">Performance</h3>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 uppercase">
                    Optional
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                  Not currently used. If we add performance measurement, it will be listed below and only run with your consent.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Inventory Table */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-deep">3. Detailed Cookie Inventory</h2>
            <p className="leading-relaxed text-slate-700">
              Here is a full, transparent breakdown of the specific cookies set by PlacePrep:
            </p>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-deep">
                  <tr>
                    <th className="px-4 py-3">Cookie Name</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Purpose</th>
                    <th className="px-4 py-3">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {COOKIE_INVENTORY.map((c) => (
                    <tr key={c.name} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-mono font-medium text-brand-dark">{c.name}</td>
                      <td className="px-4 py-3 font-medium text-slate-700">{c.category}</td>
                      <td className="px-4 py-3 text-slate-600 leading-normal">{c.purpose}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{c.expiry}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 4: What about Camera / Face Proctoring? */}
          <section className="space-y-3 rounded-2xl border border-deep/10 bg-canvas-deep p-6">
            <h2 className="text-xl font-bold text-deep">4. Camera, Proctoring, &amp; Biometrics</h2>
            <p className="leading-relaxed text-slate-700">
              Students often ask whether video frames or camera streams are saved via cookies or session storage.
            </p>
            <p className="leading-relaxed text-slate-700">
              <strong>The answer is strictly NO.</strong> When you take a mock assessment with optional face &amp; gaze proctoring:
            </p>
            <ul className="list-inside list-disc space-y-1.5 text-sm text-slate-700">
              <li>MediaPipe FaceMesh runs completely client-side in WebAssembly inside your browser.</li>
              <li>No video, audio, or facial landmark coordinates are ever stored in cookies or client storage.</li>
              <li>No media bytes leave your device or reach our database servers.</li>
              <li>Only numerical violation counters (e.g., tab switches or off-screen flags) are sent to record the attempt result.</li>
            </ul>
          </section>

          {/* Section 5: How to Control Cookies */}
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-deep">5. How You Can Control Cookies</h2>
            <p className="leading-relaxed text-slate-700">
              You maintain full control over the optional cookies stored by PlacePrep:
            </p>
            <ol className="list-inside list-decimal space-y-2 text-sm text-slate-700">
              <li>
                <strong>Using Our Settings:</strong> Click the{" "}
                <CookieSettingsButton className="font-semibold text-brand underline hover:text-brand-dark">
                  Cookie Settings
                </CookieSettingsButton>{" "}
                button at any time to open the preference dialog and enable or disable optional cookies.
              </li>
              <li>
                <strong>Using Your Web Browser:</strong> You can configure Chrome, Edge, Firefox, or Safari to block or alert you about cookies.
                Note that blocking strictly necessary cookies will prevent you from logging into PlacePrep.
              </li>
              <li>
                <strong>Clearing Cookies:</strong> You can clear your browser cookies anytime via your browser settings. Doing so will sign you out and display our cookie choice banner on your next visit.
              </li>
            </ol>
          </section>

          {/* Section 6: Contact */}
          <section className="space-y-3 border-t border-deep/10 pt-8">
            <h2 className="text-xl font-bold text-deep">6. Questions or Concerns?</h2>
            <p className="leading-relaxed text-slate-700">
              If you have any questions regarding our use of cookies or student data privacy, please check out our{" "}
              <Link href="/privacy" className="font-medium text-brand underline hover:text-brand-dark">
                Privacy Policy
              </Link>{" "}
              or contact us directly at{" "}
              <a href="mailto:support@placeprep.me" className="font-medium text-brand underline hover:text-brand-dark">
                support@placeprep.me
              </a>
              .
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-deep/10 bg-surface">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 py-8 text-xs text-muted sm:flex-row">
          <p>© {new Date().getFullYear()} PlacePrep. Free aptitude preparation for all students.</p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/privacy" className="hover:text-deep">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-deep">
              Terms of Service
            </Link>
            <Link href="/cookies" className="font-semibold text-deep">
              Cookie Policy
            </Link>
            <CookieSettingsButton />
          </div>
        </div>
      </footer>
    </div>
  );
}
