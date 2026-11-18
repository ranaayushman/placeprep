import Link from "next/link";
import { Logo } from "./Logo";
import { CookieSettingsButton } from "./CookieConsent";

/** Footer links for every page; the public footer below and the signed-in AppShell footer both use them. */
export function FooterLinks({ className }: { className: string }) {
  return (
    <nav aria-label="Footer" className={className}>
      <Link href="/faq" className="hover:text-deep">FAQs</Link>
      <Link href="/privacy" className="hover:text-deep">Privacy Policy</Link>
      <Link href="/terms" className="hover:text-deep">Terms &amp; Conditions</Link>
      <Link href="/cookies" className="hover:text-deep">Cookie Policy</Link>
      <CookieSettingsButton className="text-muted underline decoration-brand/50 underline-offset-4 hover:text-deep" />
    </nav>
  );
}

/** Footer of the public pages: home, FAQs and the legal pages. */
export function SiteFooter() {
  return (
    <footer className="border-t border-deep/10 bg-canvas/60">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <Logo />
            <p className="max-w-sm text-sm text-muted">Free aptitude and MCQ practice for every placement-bound student. No subscription, no catch.</p>
          </div>
          <FooterLinks className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-muted" />
        </div>
        <div className="mt-8 space-y-2 border-t border-deep/10 pt-6 text-xs text-muted/80">
          <p>Independent educational preparation platform. Not affiliated with, endorsed by, or sponsored by Infosys, Deloitte, Cognizant or any other company mentioned.</p>
          <p>© {new Date().getFullYear()} PlacePrep · Free placement aptitude practice</p>
        </div>
      </div>
    </footer>
  );
}
