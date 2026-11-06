import Link from "next/link";

/**
 * Symbol from public/placeprep-logo-compact.svg, inline so it stays crisp and can switch to the
 * reversed colours of public/placeprep-icon.svg on dark backgrounds. Wordmark is live Inter text.
 */
export function Logo({ href = "/", className = "", onDark = false }: { href?: string; className?: string; onDark?: boolean }) {
  const c = onDark
    ? { p: "#F5F4EC", arrow: "#153D3B", lines: "#C6DC75", cap: "#C6DC75", dot: "#F5F4EC" }
    : { p: "#153D3B", arrow: "#F5F4EC", lines: "#39877A", cap: "#153D3B", dot: "#C6DC75" };
  return (
    <Link href={href} aria-label="PlacePrep home" className={`flex items-center gap-2 ${className}`}>
      <svg viewBox="0 -20 415 385" className="h-8 w-auto" aria-hidden>
        <path d="M92 330V128c0-42 27-69 69-69h125c79 0 124 45 124 119s-45 119-124 119H205v33c0 17-12 29-29 29h-55c-17 0-29-12-29-29Z" fill={c.p} />
        <path d="M202 139h92v-39l88 69-88 69v-39h-92z" fill={c.arrow} />
        <path d="M18 166h55M5 215h55" fill="none" stroke={c.lines} strokeWidth="20" strokeLinecap="round" />
        <path d="M82 27 216 -15 350 27 216 69Z" fill={c.cap} />
        <path d="M112 39v37c69 33 138 33 207 0V39" fill={c.cap} />
        <path d="M350 27v61" stroke={c.cap} strokeWidth="7" strokeLinecap="round" />
        <circle cx="350" cy="96" r="8" fill={c.dot} />
      </svg>
      <span className={`text-xl font-extrabold tracking-tight ${onDark ? "text-white" : "text-deep"}`}>
        Place<span className={onDark ? "text-sun" : "text-brand"}>Prep</span>
      </span>
    </Link>
  );
}
