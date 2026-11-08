import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { AuthLinks } from "@/components/AuthLinks";
import { CookieSettingsButton } from "@/components/CookieConsent";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description: "Read the Terms and Conditions for PlacePrep. Understand user responsibilities, mock test rules, community contributions, and non-affiliation disclaimers.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
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
            <span>📜 RULES &amp; AGREEMENT</span>
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-deep sm:text-5xl">Terms and Conditions</h1>
          <p className="mt-3 text-base text-muted">
            Last updated: November 2026 · Please review these terms before using PlacePrep.
          </p>
        </div>

        {/* Highlight Box */}
        <div className="mt-8 rounded-2xl border border-brand/20 bg-brand-soft/40 p-6 sm:p-8">
          <h2 className="text-xl font-bold text-deep">Quick Overview</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            By creating an account, practising questions, or taking mock assessments on PlacePrep, you agree to these Terms.
            PlacePrep is an open, community-powered educational simulator provided free of charge to students.
          </p>
        </div>

        {/* Detailed Sections */}
        <div className="mt-12 space-y-12 text-slate-800">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-deep">1. Acceptance of Terms</h2>
            <p className="leading-relaxed text-slate-700">
              These Terms and Conditions (&ldquo;Terms&rdquo;) constitute a legally binding agreement between you
              (&ldquo;User&rdquo;, &ldquo;Student&rdquo;, or &ldquo;You&rdquo;) and PlacePrep (&ldquo;PlacePrep&rdquo;,
              &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), governing your access to and use of the{" "}
              <Link href="/" className="font-medium text-brand underline">
                placeprep.me
              </Link>{" "}
              website, including all assessments, analytics, and community question systems.
            </p>
            <p className="leading-relaxed text-slate-700">
              If you do not agree with any part of these Terms, you must immediately discontinue use of the platform.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-deep">2. Educational &amp; Free Service Nature</h2>
            <p className="leading-relaxed text-slate-700">
              PlacePrep is designed solely as an educational preparation and diagnostic aid for campus placement drives and aptitude examinations.
              Access to full mock tests, sectional drills, personal analytics, and community submissions is provided completely free of charge, with no subscription tiers or paywalls. To cover server costs we may show advertising outside exams or accept voluntary donations; donations are optional and never unlock features.
            </p>
          </section>

          {/* Section 3: User Accounts */}
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-deep">3. User Accounts &amp; Security</h2>
            <ul className="list-inside list-disc space-y-2 text-sm text-slate-700">
              <li>You must be at least 18 years old to create an account, and you must provide accurate information during registration.</li>
              <li>You are solely responsible for maintaining the confidentiality of your login credentials and session tokens.</li>
              <li>You agree not to share your account, sell access, or permit any third party to access the platform using your credentials.</li>
              <li>We reserve the right to suspend or terminate accounts that engage in fraudulent behavior, automated botting, or abuse of platform resources.</li>
            </ul>
          </section>

          {/* Section 4: Proctored Exam Rules */}
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-deep">4. Proctored Mock Exam Environment Rules</h2>
            <p className="leading-relaxed text-slate-700">
              To accurately recreate the pressure and time constraints of actual corporate hiring drives, our Full Mock mode incorporates simulated proctoring controls:
            </p>
            <ul className="list-inside list-disc space-y-2 text-sm text-slate-700">
              <li>
                <strong>Strict Timers:</strong> Sectional clocks run continuously. Once time expires, unfinished questions are submitted automatically.
              </li>
              <li>
                <strong>Leaving a Test:</strong> If you close or leave a mock test or practice set for more than 3 minutes, it is submitted and scored with the answers you had saved.
              </li>
              <li>
                <strong>Section Locking:</strong> In accordance with real drive patterns, once you submit a section, you cannot return to modify answers.
              </li>
              <li>
                <strong>Integrity Warnings:</strong> Leaving full-screen mode, switching browser tabs, blurring the window, or attempting to open developer tools is logged as a violation. Accumulating maximum allowed warnings triggers an automatic exam submission.
              </li>
              <li>
                <strong>Optional Local Camera Proctoring:</strong> Web browser camera access is used for on-device gaze and presence detection via MediaPipe FaceMesh. You can switch it off before each mock. Camera events (face not visible, looking away, another face) are counted as camera alerts shown on your result; they never end a test. You acknowledge that camera data is processed 100% locally in your browser and is never recorded or transmitted to our servers.
              </li>
            </ul>
          </section>

          {/* Section 5: Community Contributions */}
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-deep">5. Community Question Contributions</h2>
            <p className="leading-relaxed text-slate-700">
              PlacePrep allows eligible students to contribute placement practice questions. By submitting content through the Community module, you represent and warrant that:
            </p>
            <ul className="list-inside list-disc space-y-2 text-sm text-slate-700">
              <li>The questions, explanations, and code snippets are original, written in your own words, and in the style of placement tests, or derived from public educational concepts. You do not submit questions from an actual assessment you took, even from memory, because candidates are often bound to keep them confidential.</li>
              <li>You do not submit confidential proprietary assessment materials, leaked copyrighted question banks, or trade secrets belonging to any assessment vendor or corporate organization.</li>
              <li>You grant PlacePrep a perpetual, worldwide, irrevocable, royalty-free, non-exclusive license to use, display, format, distribute, and include your submitted question in our practice banks for the benefit of all students.</li>
              <li>PlacePrep administrators reserve the right to review, edit, reject, or remove any community submission that fails our similarity checks or quality guidelines.</li>
            </ul>
          </section>

          {/* Section 6: Non-Affiliation Disclaimer (CRITICAL) */}
          <section className="space-y-3 rounded-2xl border-2 border-brand/40 bg-surface p-6 sm:p-8">
            <h2 className="text-xl font-bold text-deep">6. Non-Affiliation &amp; Trademark Disclaimer</h2>
            <p className="leading-relaxed text-slate-700">
              <strong>PlacePrep is an independent educational platform.</strong>
            </p>
            <p className="leading-relaxed text-slate-700">
              PlacePrep is not affiliated with, sponsored by, endorsed by, or in any way associated with Infosys Limited, Deloitte Touche Tohmatsu Limited, or any other corporate entity, recruitment partner, or assessment vendor mentioned on this website.
            </p>
            <p className="leading-relaxed text-slate-700">
              All company names, trademarks, service marks, exam patterns, and brand identifiers referenced on PlacePrep are the property of their respective trademark owners and are used strictly for nominative, educational, and descriptive identification purposes.
            </p>
          </section>

          {/* Section 7: Prohibited Activities */}
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-deep">7. Prohibited Conduct</h2>
            <p className="leading-relaxed text-slate-700">
              When accessing PlacePrep, you agree NOT to:
            </p>
            <ul className="list-inside list-disc space-y-2 text-sm text-slate-700">
              <li>Use automated scripts, bots, spiders, or scrapers to extract question banks or user profiles.</li>
              <li>Attempt to circumvent, disable, or tamper with our rate limiters, session authentication, or API endpoints.</li>
              <li>Engage in any activity that burdens or impairs our infrastructure, including denial-of-service (DoS) attempts.</li>
              <li>Submit abusive, defamatory, plagiarized, offensive, or malicious content through the question submit or problem report features.</li>
            </ul>
          </section>

          {/* Section 8: Disclaimer of Warranties */}
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-deep">8. Disclaimer of Warranties</h2>
            <p className="leading-relaxed text-slate-700">
              The platform, its questions, explanations, formulas, and mock scoring algorithms are provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis without warranties of any kind, whether express or implied.
            </p>
            <p className="leading-relaxed text-slate-700">
              While we strive for accuracy, PlacePrep does not guarantee that practice questions will match exact future drive questions, nor do we guarantee employment offers, interview shortlists, or hiring outcomes from any company.
            </p>
          </section>

          {/* Section 9: Limitation of Liability */}
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-deep">9. Limitation of Liability</h2>
            <p className="leading-relaxed text-slate-700">
              To the fullest extent permitted by applicable law, PlacePrep, its contributors, and maintainers shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your access to or inability to use the platform.
            </p>
          </section>

          {/* Section 10: Governing Law */}
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-deep">10. Governing Law</h2>
            <p className="leading-relaxed text-slate-700">
              These Terms are governed by the laws of India. Any dispute arising from them or from your use of PlacePrep is subject to the exclusive jurisdiction of the courts at Dhanbad, Jharkhand.
            </p>
          </section>

          {/* Section 11: Modifications and Contact */}
          <section className="space-y-3 border-t border-deep/10 pt-8">
            <h2 className="text-2xl font-bold text-deep">11. Modifications &amp; Contact</h2>
            <p className="leading-relaxed text-slate-700">
              We reserve the right to revise these Terms at any time. Continued use of PlacePrep following the posting of revised Terms signifies your acceptance.
            </p>
            <p className="leading-relaxed text-slate-700">
              To report content on PlacePrep that infringes your rights or breaks these Terms, email us and we will respond within 15 days. If you have any questions concerning these Terms, please contact us at{" "}
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
            <Link href="/privacy" className="hover:text-deep">
              Privacy Policy
            </Link>
            <Link href="/terms" className="font-semibold text-deep">
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
