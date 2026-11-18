import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { AuthLinks } from "@/components/AuthLinks";
import { SiteFooter } from "@/components/SiteFooter";
import { MAX_VIOLATIONS, LEFT_AFTER_MS } from "@/lib/exam/pattern";
import { MAX_SUBMISSIONS_PER_DAY, MIN_ANSWERED_TO_UPLOAD } from "@/lib/community/config";
import { DELETION_DUE_DAYS } from "@/lib/deletion-requests";
import { REFERRALS_TO_UNLOCK } from "@/lib/referral";

export const metadata: Metadata = {
  title: "FAQs",
  description:
    "Answers about PlacePrep: is it free, how mock tests and proctoring work, practising on your phone, code practice, community questions, your account and your data.",
  alternates: { canonical: "/faq" },
};

type Faq = { q: string; a: string; links?: { href: string; label: string }[] };
type Group = { title: string; items: Faq[] };

// Numbers come from the same constants the app enforces, so this page can't drift from the rules.
const leftMinutes = LEFT_AFTER_MS / 60_000;
const inviteCount = Math.max(...Object.values(REFERRALS_TO_UNLOCK));

const GROUPS: Group[] = [
  {
    title: "Getting started",
    items: [
      {
        q: "Is PlacePrep really free?",
        a: "Yes. Practice, mock tests, results and analytics are free, with no subscription. The site is supported by ads, which only load if you accept advertising cookies.",
        links: [{ href: "/cookies", label: "Cookie Policy" }],
      },
      {
        q: "Do I need an account?",
        a: "Yes. Your answers, history, analytics and unfinished tests are saved to your account. You can sign up with an email and password or with Google. You may be asked to confirm your email with a 6-digit code.",
      },
      {
        q: "Is PlacePrep affiliated with Infosys, Deloitte or Cognizant?",
        a: "No. PlacePrep is an independent practice platform. Our mock tests follow the exam patterns that students report publicly; they are not the companies' real papers.",
        links: [{ href: "/terms", label: "Terms & Conditions" }],
      },
    ],
  },
  {
    title: "Practice",
    items: [
      {
        q: "What's the difference between practice and a mock test?",
        a: "Practice is a short quiz on topics you pick (5 to 30 questions). You see the answer and explanation after each question, and you can time it at exam pace. A mock test is a full paper in a company's reported pattern, with sectional timers and exam rules, and you see the answers after you submit.",
      },
      {
        q: "Will I get the same questions again?",
        a: "Each new practice set or mock is built to avoid questions you've already seen. A question only repeats when a topic has no unseen questions left for you.",
      },
      {
        q: "Can I practise on my phone?",
        a: "Yes. Practice quizzes, results, analytics, code practice and your account all work on a phone. Only mock tests need a computer.",
      },
      {
        q: "What does \"Retry your mistakes\" do?",
        a: "It builds a new set from the questions you got wrong recently, so you can see them again and check the explanation.",
      },
    ],
  },
  {
    title: "Mock tests",
    items: [
      {
        q: "Which mock tests are available?",
        a: "Infosys Systems Engineer (a standard mock and a harder one), Deloitte NLA, and Cognizant GenC in Java and Python versions, plus harder \"Extreme\" versions of GenC. More companies are added over time.",
        links: [{ href: "/mock", label: "See all mocks" }],
      },
      {
        q: "Why can't I take a mock test on my phone?",
        a: "The real exam runs full screen on a computer, with a keyboard and optional camera checks, so mock tests are built the same way. On a phone or small tablet you'll see a notice instead. If a mock is already open, its timer keeps running, so continue it on a laptop or desktop.",
      },
      {
        q: "What happens if I leave full screen or switch tabs?",
        a: `Each time counts as a warning. At ${MAX_VIOLATIONS} warnings the test is submitted automatically. Copy, paste and right-click are disabled during a mock.`,
      },
      {
        q: "Is my camera recorded?",
        a: "No. Camera proctoring runs in your browser and checks whether your face is visible and where you look. Nothing is recorded or uploaded. Camera alerts appear on your result and never end the test. You can turn the camera checks off before you start; your result is then marked \"camera off\".",
        links: [{ href: "/privacy", label: "Privacy Policy" }],
      },
      {
        q: "What if I close the tab or my internet drops?",
        a: `The timer is kept on our server, so closing the tab doesn't pause it. A dropped connection doesn't submit your test. If you stay away for more than ${leftMinutes} minutes, the test is submitted and scored with the answers you saved.`,
      },
      {
        q: "Is there negative marking? Can I go back to a section?",
        a: "There is no negative marking, so attempt every question. Each section has its own timer, and once you submit or run out of time on a section you can't return to it.",
      },
      {
        q: "Why is a mock locked, or missing from my list?",
        a: `Some harder mocks unlock after ${inviteCount} friends join through your invite link and finish setting up their account. Other mocks are shared only with specific email addresses, so they appear only for those students.`,
      },
    ],
  },
  {
    title: "Code practice",
    items: [
      {
        q: "Where are Code and DSA in my menu?",
        a: "Code practice and the DSA track are switched on per account. If you don't see them in your menu, access hasn't been enabled for you yet.",
      },
      {
        q: "Which languages can I use?",
        a: "C++, Java and Python for coding problems, and SQL for SQL problems. You can run your code on your own test inputs before you submit. Hidden test cases are never shown, only whether your solution passed.",
      },
    ],
  },
  {
    title: "Community questions",
    items: [
      {
        q: "Can I contribute questions?",
        a: `Yes, once you've answered ${MIN_ANSWERED_TO_UPLOAD} practice questions, up to ${MAX_SUBMISSIONS_PER_DAY} a day. Every submission is checked for duplicates and reviewed by a moderator before it is published, and a question you wrote can't be approved by you.`,
        links: [{ href: "/community", label: "Community questions" }],
      },
      {
        q: "A question or its answer looks wrong. What do I do?",
        a: "Use \"Report a problem\" on the question once its answer is shown. Reports go to our review queue, and a community question that gets several open reports is hidden from practice until a moderator checks it.",
      },
    ],
  },
  {
    title: "Your account and data",
    items: [
      {
        q: "How do I delete my account?",
        a: `Open Account and choose Delete my account. We delete your account and its data within ${DELETION_DUE_DAYS} days, and you can keep using PlacePrep until then or cancel the request.`,
        links: [{ href: "/account", label: "Account settings" }],
      },
      {
        q: "I signed up with Google. Can I set a password?",
        a: "Google accounts sign in with Google and have no password to change. If you first signed up with a password and later use Google with the same email, the account switches to Google sign-in.",
      },
      {
        q: "What cookies do you use, and can I change my choice?",
        a: "Strictly necessary cookies keep you signed in. Preference, analytics and advertising cookies are optional and only used if you allow them. You can change your choice at any time from \"Cookie settings\" in the footer.",
        links: [{ href: "/cookies", label: "Cookie Policy" }],
      },
      {
        q: "I have a question that isn't here.",
        a: "Email support@placeprep.me and we'll get back to you.",
      },
    ],
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: GROUPS.flatMap((g) => g.items).map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function FaqPage() {
  return (
    <div className="min-h-dvh bg-canvas text-deep selection:bg-brand-soft">
      <script
        type="application/ld+json"
        // "<" is escaped so no answer text can close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <header className="sticky top-0 z-20 border-b border-deep/10 bg-canvas/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5">
          <Logo />
          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link href="/" className="hidden text-muted hover:text-deep sm:inline">
              Home
            </Link>
            <AuthLinks />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
        <div className="border-b border-deep/10 pb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 font-mono text-xs font-semibold text-brand-dark">
            <span aria-hidden>❓</span> FAQS
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">Frequently asked questions</h1>
          <p className="mt-3 text-base text-muted">Quick answers about practice, mock tests, code practice and your account.</p>
          <nav aria-label="Jump to a topic" className="mt-5 flex flex-wrap gap-2">
            {GROUPS.map((g) => (
              <a
                key={g.title}
                href={`#${slug(g.title)}`}
                className="rounded-full border border-deep/15 bg-white px-3 py-1.5 text-xs font-medium text-muted hover:border-brand hover:text-deep"
              >
                {g.title}
              </a>
            ))}
          </nav>
        </div>

        <div className="mt-10 space-y-10">
          {GROUPS.map((g) => (
            <section key={g.title} id={slug(g.title)} className="scroll-mt-24">
              <h2 className="text-xl font-bold sm:text-2xl">{g.title}</h2>
              <div className="mt-4 divide-y divide-deep/10 rounded-2xl border border-deep/10 bg-white">
                {g.items.map((f) => (
                  <details key={f.q} className="group px-4 py-1 sm:px-5">
                    <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 py-3 font-medium marker:hidden [&::-webkit-details-marker]:hidden">
                      <span>{f.q}</span>
                      <span aria-hidden className="shrink-0 text-xl text-brand transition group-open:rotate-45">+</span>
                    </summary>
                    <div className="pb-4 text-sm leading-relaxed text-slate-700 sm:text-[15px]">
                      <p>{f.a}</p>
                      {f.links && (
                        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                          {f.links.map((l) => (
                            <Link key={l.href} href={l.href} className="font-medium text-brand underline underline-offset-2 hover:text-brand-dark">
                              {l.label} →
                            </Link>
                          ))}
                        </p>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
