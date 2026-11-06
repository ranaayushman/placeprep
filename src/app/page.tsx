import Link from "next/link";
import { Logo } from "@/components/Logo";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { INFOSYS_SE_PATTERN, MAX_VIOLATIONS, PRACTICE_TARGETS } from "@/lib/exam/pattern";
import { SECTION_LABELS, TOPICS, topicsFor } from "@/lib/questions";

const TRAPS = [
  {
    test: "The clock runs per section, not for the whole test.",
    train: "Every mock uses the real sectional timers. When a section's time is up, it ends, finished or not.",
  },
  {
    test: "Submitted means gone. No going back.",
    train: "Once you move on, the section locks, so you learn to decide when to cut your losses.",
  },
  {
    test: "Leave the tab and you get flagged.",
    train: `Mocks run in full-screen with copy-paste blocked, and leaving the tab or window counts as a warning. ${MAX_VIOLATIONS} warnings and the test submits itself, so you get used to it before drive day.`,
  },
  {
    test: "Most people practise what they're already good at.",
    train: "Per-topic mastery and speed show you the weak, heavily-weighted topics and tell you to drill those first.",
  },
];

/** Decorative proctored-exam window for the hero (hidden from screen readers; the page text says the same). */
function ExamWindow() {
  // Question palette states: a = answered, m = marked for review, c = current, blank = not visited.
  const palette = "aaamaac" + "        ";
  return (
    <div aria-hidden className="relative mx-auto w-full max-w-lg">
      <div className="overflow-hidden rounded-xl border-2 border-white/15 bg-surface text-deep shadow-lg shadow-brand/20">
        {/* Locked-down browser bar */}
        <div className="flex items-center gap-3 bg-deep px-4 py-2.5 font-mono text-[11px] text-white/70">
          <span className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-danger" />
            <span className="h-2.5 w-2.5 rounded-full bg-sun" />
            <span className="h-2.5 w-2.5 rounded-full bg-success" />
          </span>
          <span className="flex-1 truncate rounded bg-white/10 px-2 py-0.5">🔒 Full-screen · Proctored · Copy-paste off</span>
        </div>
        <div className="flex items-center justify-between border-b border-deep/10 px-4 py-3">
          <div>
            <p className="text-xs font-semibold tracking-wider uppercase text-muted">SECTION 1 OF 6</p>
            <p className="font-semibold">Reasoning Ability</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold tracking-wider uppercase text-muted">TIME LEFT</p>
            <p className="font-mono text-xl font-bold text-danger tabular-nums">04:12</p>
          </div>
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-4 p-4">
          <div>
            <p className="font-mono text-xs text-muted">Q7 of 15</p>
            <p className="mt-1 text-sm font-medium">All pens are books. Some books are tables. Which conclusion definitely follows?</p>
            <div className="mt-3 space-y-1.5 text-sm">
              {["Some pens are tables", "All books are pens", "Some books are pens", "No table is a pen"].map((o, i) => (
                <div key={o} className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 ${i === 2 ? "border-brand bg-brand-soft" : "border-deep/15"}`}>
                  <span className={`h-3.5 w-3.5 rounded-full border-2 ${i === 2 ? "border-deep bg-deep" : "border-deep/40"}`} />
                  {o}
                </div>
              ))}
            </div>
          </div>
          <div className="w-28 space-y-3">
            {/* Camera self-view */}
            <div className="relative flex aspect-[4/3] items-end justify-center overflow-hidden rounded-md bg-deep">
              <span className="absolute top-1.5 left-1.5 flex items-center gap-1 font-mono text-[9px] text-white/80">
                <span className="h-1.5 w-1.5 rounded-full bg-success" /> CAM
              </span>
              <span className="mb-[-14px] h-14 w-14 rounded-full bg-white/25" />
              <span className="absolute top-[38%] h-7 w-7 rounded-full bg-white/35" />
            </div>
            <div className="grid grid-cols-5 gap-1">
              {palette.split("").map((st, i) => (
                <span
                  key={i}
                  className={`flex h-5 items-center justify-center rounded-2xl font-mono text-[9px] ${
                    st === "a" ? "bg-success text-white" : st === "m" ? "bg-sun" : st === "c" ? "border-2 border-deep" : "bg-deep/10 text-muted"
                  }`}
                >
                  {i + 1}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Proctoring warning toast */}
      <div className="absolute -bottom-12 -left-3 flex max-w-[16rem] -rotate-2 items-start gap-2 rounded-lg bg-danger px-3 py-2 text-white shadow-lg shadow-brand/20 sm:-left-8">
        <span className="font-bold">!</span>
        <p className="text-xs leading-snug">
          <span className="font-semibold">Tab switch detected.</span> Warning 1 of {MAX_VIOLATIONS}. The test submits itself at {MAX_VIOLATIONS}.
        </p>
      </div>
    </div>
  );
}

export default async function Home() {
  if (await getCurrentUser()) redirect("/dashboard");
  const totalQ = INFOSYS_SE_PATTERN.reduce((s, p) => s + p.questions, 0);
  const totalMin = INFOSYS_SE_PATTERN.reduce((s, p) => s + p.minutes, 0);
  const mcq = INFOSYS_SE_PATTERN.filter((p) => p.section !== "writing");
  const secPerQ = (p: (typeof mcq)[number]) => Math.round((p.minutes * 60) / p.questions);
  const tightest = mcq.reduce((a, b) => (secPerQ(b) < secPerQ(a) ? b : a));
  const targets = Object.values(PRACTICE_TARGETS).map((t) => Math.round(t * 100));
  const ticker = [`${totalQ} questions`, `${totalMin} minutes`, `${INFOSYS_SE_PATTERN.length} sectional timers`, "0 negative marking", `${TOPICS.length} topics`];

  return (
    <div className="min-h-screen bg-canvas text-deep selection:bg-brand-soft">
      <header className="sticky top-0 z-20 border-b border-deep/10 bg-canvas/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Logo />
          <nav className="flex items-center gap-1 text-sm font-medium">
            <a href="#test" className="hidden px-3 py-2 text-muted hover:text-deep sm:block">The test</a>
            <Link href="/login" className="px-3 py-2 text-muted hover:text-deep">Log in</Link>
            <Link href="/register" className="rounded-lg bg-brand-dark px-4 py-2 font-semibold text-white hover:bg-deep">Sign up free</Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="bg-deep text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-16 px-4 pt-14 pb-24 lg:grid-cols-[1.1fr_1fr] lg:pt-20">
          <div>
            <h1 className="text-5xl leading-[1.02] font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
              Walk into the test like it&apos;s your{" "}
              <span className="text-sun">
                fifth attempt.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-pretty text-white/70">
              Knowing the formulas isn&apos;t enough. The test checks whether you can do {mcq[0].questions} reasoning
              questions in {mcq[0].minutes} minutes, in full-screen, with the clock running and no going back. So practise
              in exactly that environment, until drive day feels like a repeat.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-5">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-sun px-6 py-3 font-semibold text-deep shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sun"
              >
                Take your first mock <span aria-hidden>→</span>
              </Link>
              <a href="#test" className="font-medium text-white/80 underline decoration-sun decoration-2 underline-offset-4 hover:text-white">
                What&apos;s in the test?
              </a>
            </div>
            <p className="mt-5 text-sm text-white/60">Free. No card. Takes 30 seconds to sign up.</p>
          </div>
          <ExamWindow />
        </div>
        </section>

        {/* Ticker */}
        <div className="border-y border-deep/10 bg-brand-dark text-white">
          <ul className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4 py-4 text-sm font-semibold tracking-wide uppercase">
            {ticker.map((t, i) => (
              <li key={t} className="flex items-center gap-6">
                {i > 0 && <span aria-hidden className="hidden text-white/50 sm:inline">✱</span>}
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* What the test does vs how we train */}
        <section className="mx-auto max-w-6xl px-4 py-24">
          <h2 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Prepared students still get filtered out. Here&apos;s why.
          </h2>
          <ol className="mt-14 grid gap-x-12 gap-y-12 md:grid-cols-2">
            {TRAPS.map((t, i) => (
              <li key={t.test} className="grid grid-cols-[auto_1fr] gap-x-5">
                <span className="text-5xl leading-none font-semibold text-brand">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="text-xs font-semibold tracking-wider uppercase text-danger">THE TEST</p>
                  <h3 className="mt-1 text-xl font-semibold">{t.test}</h3>
                  <p className="mt-4 text-xs font-semibold tracking-wider uppercase text-success">HOW YOU TRAIN HERE</p>
                  <p className="mt-1 leading-relaxed text-muted">{t.train}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-14 max-w-2xl border-l-4 border-brand pl-5 text-lg text-muted">
            And you won&apos;t run out of questions. Practice questions are generated fresh every time, and each one shows the
            answer and a worked explanation as soon as you lock it in.
          </p>
        </section>

        {/* The test */}
        <section id="test" className="scroll-mt-20 border-y border-deep/10 bg-canvas-deep">
          <div className="mx-auto max-w-6xl px-4 py-24">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold tracking-wider uppercase text-danger">THE TEST, SECTION BY SECTION</p>
                <h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Know your pace before you log in.</h2>
                <p className="mt-4 max-w-2xl text-muted">
                  This is the most commonly reported pattern for recent SE drives. Infosys changes details between drives,
                  so confirm with your placement cell.
                </p>
              </div>
              <aside className="w-full max-w-xs -rotate-2 self-start rounded-xl bg-sun p-5 text-deep shadow-lg shadow-brand/20 lg:self-auto">
                <p className="text-xs font-semibold tracking-wider uppercase">SENIOR&apos;S TIP</p>
                <p className="mt-1 text-xl leading-snug font-semibold">No negative marking. Never leave a question unanswered.</p>
              </aside>
            </div>

            <ol className="mt-12 divide-y-2 divide-deep/15 border-y border-deep/10 bg-surface">
              {INFOSYS_SE_PATTERN.map((s, i) => {
                const isWriting = s.section === "writing";
                const pace = isWriting ? null : secPerQ(s);
                return (
                  <li key={s.section} className="grid gap-3 px-5 py-6 md:grid-cols-[3rem_1.3fr_auto_2fr] md:items-baseline md:gap-6">
                    <span className="font-mono text-sm text-muted">{String(i + 1).padStart(2, "0")}</span>
                    <h3 className="text-2xl font-semibold">{SECTION_LABELS[s.section]}</h3>
                    <div className="font-mono text-sm">
                      <span>{isWriting ? "1 essay" : `${s.questions} Q`} · {s.minutes} min</span>
                      {pace && (
                        <span className={`ml-3 ${s === tightest ? "font-bold text-danger" : "text-muted"}`}>
                          ≈{pace}s/Q{s === tightest ? " · tightest" : ""}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted">{topicsFor(s.section).map((t) => t.label).join(" · ")}</p>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        {/* Prep plan */}
        <section className="mx-auto max-w-6xl px-4 py-24">
          <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">The plan is boring. It works.</h2>
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { k: "Day 1", t: "Take one full mock, cold.", b: "It'll feel bad. That's fine: now you have a real number, not a guess." },
              { k: "Every day", t: "Fix what the report says.", b: "Drill the topics it points at, and retry the questions you got wrong." },
              {
                k: "Before the drive",
                t: "Mock again until every section clears.",
                b: `Each section has a practice target of ${Math.min(...targets)}–${Math.max(...targets)}% correct. Clear them all, then take the real one.`,
              },
            ].map((s) => (
              <li key={s.k} className="rounded-2xl border border-deep/10 bg-surface p-6">
                <p className="text-xs font-semibold tracking-wider uppercase text-danger uppercase">{s.k}</p>
                <h3 className="mt-3 text-xl font-semibold">{s.t}</h3>
                <p className="mt-2 leading-relaxed text-muted">{s.b}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Closing */}
        <section className="px-4 pb-24">
          <div className="mx-auto max-w-6xl rounded-2xl bg-deep px-6 py-16 text-center text-white sm:px-12">
            <h2 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Placement season won&apos;t wait. <span className="text-sun">Start tonight.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/70">One mock tonight gives you a baseline. A week of practice shows you a trend.</p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-5">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-sun px-6 py-3 font-semibold text-deep shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sun"
              >
                Create your free account <span aria-hidden>→</span>
              </Link>
              <Link href="/login" className="font-medium text-white/80 underline decoration-sun decoration-2 underline-offset-4 hover:text-white">
                I already have one
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-deep/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-muted sm:flex-row">
          <Logo />
          <p>Built for students sitting the Infosys SE drive. Independent, not affiliated with Infosys.</p>
        </div>
      </footer>
    </div>
  );
}
