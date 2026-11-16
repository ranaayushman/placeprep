"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

const AUTOPLAY_MS = 7000;

/**
 * Horizontal carousel of featured exam cards. Native scroll-snap (so touch swipe works), arrow and dot
 * controls, and auto-advance that pauses on hover, keyboard focus, a hidden tab, or prefers-reduced-motion.
 */
export function ExamCarousel({ slides, labels }: { slides: ReactNode[]; labels: string[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const many = slides.length > 1;

  const go = useCallback((i: number) => {
    const el = track.current;
    if (!el) return;
    const n = el.children.length;
    const next = ((i % n) + n) % n;
    el.scrollTo({ left: (el.children[next] as HTMLElement).offsetLeft - el.offsetLeft, behavior: "smooth" });
  }, []);

  // Which slide is mostly in view.
  useEffect(() => {
    const el = track.current;
    if (!el || !many) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(Number((e.target as HTMLElement).dataset.i))),
      { root: el, threshold: 0.6 },
    );
    [...el.children].forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, [many, slides.length]);

  useEffect(() => {
    if (!many || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => !document.hidden && go(active + 1), AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [many, paused, active, go]);

  const arrow = "absolute top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-xl text-deep shadow-md transition hover:bg-sun sm:flex";

  return (
    <div
      className="relative"
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured mock exams"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div ref={track} className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {slides.map((s, i) => (
          <div key={i} data-i={i} className="w-full shrink-0 snap-start" role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${slides.length}: ${labels[i]}`}>
            {s}
          </div>
        ))}
      </div>
      {many && (
        <>
          <button type="button" onClick={() => go(active - 1)} aria-label="Previous featured exam" className={`${arrow} -left-3`}>‹</button>
          <button type="button" onClick={() => go(active + 1)} aria-label="Next featured exam" className={`${arrow} -right-3`}>›</button>
          <div className="mt-3 flex justify-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => go(i)}
                aria-label={`Show ${labels[i]}`}
                aria-current={i === active}
                className={`h-2 rounded-full transition-all ${i === active ? "w-6 bg-deep" : "w-2 bg-deep/25 hover:bg-deep/50"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
