import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { AuthLinks } from "@/components/AuthLinks";
import { CookieSettingsButton } from "@/components/CookieConsent";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Read the PlacePrep Privacy Policy. Discover how we protect your personal information, assessment records, and camera privacy during practice.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPolicyPage() {
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
        {/* Title */}
        <div className="border-b border-deep/10 pb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 font-mono text-xs font-semibold text-brand-dark">
            <span>🔒 STUDENT DATA PROTECTION</span>
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-deep sm:text-5xl">Privacy Policy</h1>
          <p className="mt-3 text-base text-muted">
            Last updated: November 2026 · Committed to transparency, student data protection, and 100% free access.
          </p>
        </div>

        {/* Core Guarantee Callout */}
        <div className="mt-8 rounded-2xl border border-brand/20 bg-brand-soft/40 p-6 sm:p-8">
          <h2 className="text-xl font-bold text-deep">Our Core Privacy Commitment</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            PlacePrep was built by developers who believe placement preparation should be accessible to all students without financial strain or predatory practices.
            We treat your personal data with utmost respect:
          </p>
          <ul className="mt-4 grid gap-2.5 text-sm text-slate-700 sm:grid-cols-2">
            <li className="flex items-center gap-2">
              <span className="text-brand font-bold">✓</span> No selling of student emails or profiles
            </li>
            <li className="flex items-center gap-2">
              <span className="text-brand font-bold">✓</span> No sale of student data for advertising
            </li>
            <li className="flex items-center gap-2">
              <span className="text-brand font-bold">✓</span> Camera feeds never leave your browser
            </li>
            <li className="flex items-center gap-2">
              <span className="text-brand font-bold">✓</span> Full account deletion upon request
            </li>
          </ul>
        </div>

        {/* Detailed Sections */}
        <div className="mt-12 space-y-12 text-slate-800">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-deep">1. Who We Are</h2>
            <p className="leading-relaxed text-slate-700">
              PlacePrep (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), operated by Ayushman Rana, runs{" "}
              <Link href="/" className="font-medium text-brand underline">
                placeprep.me
              </Link>
              , an independent, open placement aptitude practice platform designed for college and university students.
              Grievance contact for privacy and data protection:{" "}
              <a href="mailto:support@placeprep.me" className="font-medium text-brand underline">
                support@placeprep.me
              </a>
              .
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-deep">2. Information We Collect</h2>
            <p className="leading-relaxed text-slate-700">
              We collect only the minimum information necessary to provide an authentic, rewarding mock examination experience:
            </p>
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="font-semibold text-deep">A. Account Credentials &amp; Profile</h3>
                <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                  When you sign up, we collect your full name, email address, and a secure bcrypt-hashed password (or your verified Google email and display name if you authenticate via Google OAuth). During onboarding, you may optionally share your college name, graduation year, and degree branch to personalise your dashboard. If you tick &ldquo;Email me placement tips&rdquo; during onboarding, we also record when you gave that consent.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="font-semibold text-deep">B. Assessment Attempts &amp; Analytics Data</h3>
                <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                  When you complete mock exams and topic drills, we store your question selections, time spent per question, marked reviews, sectional scores, and topic mastery history. This data powers your personal recommendations dashboard so you know exactly which weak areas to drill. If you send optional feedback after a test, we store what you write with your account and that test, and use it to improve PlacePrep.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="font-semibold text-deep">C. Community Question Submissions</h3>
                <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                  If you contribute original practice questions via our Community module, we store the question text, options, answer key, explanation, and an author identifier to manage moderation and report queues. Other students only see your first name and last initial.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="font-semibold text-deep">D. Audit &amp; Security Logs</h3>
                <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                  We log login timestamps, IP addresses, your browser and device details (user agent), request rates, proctoring warnings for each attempt, and when you were last active, to protect students against brute-force attacks, session hijacking, and server abuse. Administrators can view your activity and assessment data to run the platform and investigate misuse. Moderators, who review community questions, see only those questions, the reports on them, and the name of whoever wrote or reported them.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Camera & Face Proctoring Policy (CRITICAL) */}
          <section className="space-y-4 rounded-2xl border-2 border-brand/40 bg-surface p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-brand-dark font-bold">
                📷
              </span>
              <h2 className="text-2xl font-bold text-deep">3. Camera &amp; AI Proctoring Privacy Guarantee</h2>
            </div>
            <p className="leading-relaxed text-slate-700">
              In Full Mock Exam mode, PlacePrep provides a proctoring simulation environment designed to mimic real corporate online assessments (such as Mettl, Wheebox, or Talview).
            </p>
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
              <h4 className="font-semibold text-deep">Zero Server-Side Media Processing</h4>
              <p className="mt-1 text-sm text-slate-700 leading-relaxed">
                When you grant camera access for face and gaze tracking:
              </p>
              <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-slate-700">
                <li>
                  <strong>100% Client-Side Execution:</strong> All video frames are processed locally inside your web browser using WebAssembly via Google MediaPipe FaceMesh.
                </li>
                <li>
                  <strong>Never Streamed or Uploaded:</strong> No camera recordings, screenshots, photos, audio tracks, or facial biometric models are ever sent to PlacePrep servers or any third-party infrastructure.
                </li>
                <li>
                  <strong>Volatile Memory Only:</strong> Video frames exist in temporary GPU/RAM memory for landmark estimation and are immediately discarded on the next render frame.
                </li>
                <li>
                  <strong>What Reaches Our Server:</strong> Only high-level event counters (e.g. &ldquo;no face detected for &gt; 5 seconds&rdquo;, &ldquo;multiple faces&rdquo;, or &ldquo;tab switch&rdquo;) are sent to your attempt log. Camera events are shown to you as camera alerts and never end a test. Full-screen exits and tab switches are different: they count as warnings, and reaching the limit submits the test automatically (see our Terms). Camera proctoring is optional and can be switched off before each mock.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-deep">4. How We Use Your Information</h2>
            <p className="leading-relaxed text-slate-700">
              We process personal and test data strictly for the following purposes:
            </p>
            <ul className="list-inside list-disc space-y-2 text-sm text-slate-700">
              <li>Providing and managing your user account and authentication sessions.</li>
              <li>Scoring tests and showing your scores and topic breakdowns.</li>
              <li>Sending occasional placement tips and product news by email, only if you opted in. Every email has an unsubscribe link.</li>
              <li>Generating recommendations to help you focus on your lowest-accuracy topics.</li>
              <li>Enforcing test integrity rules during simulated mock exams.</li>
              <li>Detecting platform abuse, automated bots, and unauthorized access attempts.</li>
              <li>Keeping the free platform available, including displaying limited advertising in designated non-exam areas if we introduce ads in the future.</li>
            </ul>
          </section>

          {/* Section 5: Cookies & Storage */}
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-deep">5. Cookies &amp; Local Storage</h2>
            <p className="leading-relaxed text-slate-700">
              PlacePrep currently uses three cookies: one that keeps you signed in, one that secures Google sign-in while it is in progress, and one that remembers your cookie consent choice. Your browser&apos;s local storage also remembers which product updates you have already seen.
              We do not currently run advertising cookies or personalized ad tracking. If advertising is introduced, we will identify the provider and cookie purposes, request any required consent before setting non-essential advertising cookies, and provide a way to withdraw that consent. For an itemized list of all cookies and to customize your choices, please review our{" "}
              <Link href="/cookies" className="font-medium text-brand underline">
                Cookie Policy
              </Link>
              .
            </p>
          </section>

          {/* Section 6: Data Storage & Infrastructure */}
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-deep">6. Infrastructure &amp; Third-Party Services</h2>
            <p className="leading-relaxed text-slate-700">
              We rely on trusted, industry-standard infrastructure providers to host PlacePrep securely:
            </p>
            <ul className="list-inside list-disc space-y-2 text-sm text-slate-700">
              <li>
                <strong>Supabase (PostgreSQL):</strong> Used as our managed database backend. Access is controlled by our application, which only lets each student read and write their own attempts; Row Level Security blocks Supabase&apos;s public data API entirely.
              </li>
              <li>
                <strong>jsDelivr (CDN):</strong> Serves the face-tracking files your browser downloads when camera proctoring is on. Like any website, it sees your IP address when serving those files; it never receives any camera images.
              </li>
              <li>
                <strong>Google Identity Services:</strong> Used optionally if you choose to authenticate with Google.
              </li>
              <li>
                <strong>Brevo:</strong> Sends our marketing emails. Only students who opted in are shared with Brevo, and only their first name and email address.
              </li>
              <li>
                <strong>Advertising providers (future):</strong> We may use a carefully selected advertising provider in limited, non-exam areas to help fund free access. No advertising provider will receive camera frames, face landmarks, answers, or assessment records. The provider and its data practices will be disclosed before activation.
              </li>
              <li>
                <strong>Vercel:</strong> Hosts the website and serves it over encrypted HTTPS (TLS) with HSTS security headers.
              </li>
            </ul>
          </section>

          {/* Section 7: User Rights */}
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-deep">7. Your Rights &amp; Choices</h2>
            <p className="leading-relaxed text-slate-700">
              Regardless of your geographic location (including under India&apos;s Digital Personal Data Protection Act and international privacy frameworks like GDPR), you possess the following rights regarding your data:
            </p>
            <ul className="list-inside list-disc space-y-2 text-sm text-slate-700">
              <li>
                <strong>Right to Access:</strong> You can view all your past mock exams, practice sets, and analytics directly from your dashboard.
              </li>
              <li>
                <strong>Right to Correction:</strong> Email us at support@placeprep.me and we will correct your profile details.
              </li>
              <li>
                <strong>Right to Deletion:</strong> You may request the permanent deletion of your user account, attempt logs, and personal information by emailing us at{" "}
                <a href="mailto:support@placeprep.me" className="font-medium text-brand underline">
                  support@placeprep.me
                </a>
                . We act on deletion requests within 30 days. Deleting your account removes your attempts, activity logs and community submissions. We keep your data while your account is in use; if you don&apos;t sign in for 5 years, your account and its data are deleted automatically.
              </li>
              <li>
                <strong>Right to Withdraw Consent:</strong> You can manage or revoke cookie preferences anytime via our{" "}
                <CookieSettingsButton className="font-semibold text-brand underline">
                  Cookie Settings
                </CookieSettingsButton>
                .
              </li>
            </ul>
          </section>

          {/* Section 8: Changes & Contact */}
          <section className="space-y-3 border-t border-deep/10 pt-8">
            <h2 className="text-2xl font-bold text-deep">8. Changes to This Policy &amp; Contact</h2>
            <p className="leading-relaxed text-slate-700">
              We may update this Privacy Policy from time to time to reflect platform improvements or regulatory changes. Any updates will be published on this page with a revised &ldquo;Last Updated&rdquo; date.
            </p>
            <p className="leading-relaxed text-slate-700">
              For any questions, concerns, or requests regarding this Privacy Policy, please email our team at{" "}
              <a href="mailto:support@placeprep.me" className="font-medium text-brand underline">
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
            <Link href="/privacy" className="font-semibold text-deep">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-deep">
              Terms of Service
            </Link>
            <Link href="/cookies" className="hover:text-deep">
              Cookie Policy
            </Link>
            <CookieSettingsButton />
          </div>
        </div>
      </footer>
    </div>
  );
}
