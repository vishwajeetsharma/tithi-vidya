import Link from "next/link";

import { CREDIT, SITE_NAME } from "@/lib/site";

import { CookieSettingsButton } from "./CookieSettingsButton";

export function SiteFooter() {
  return (
    <footer className="siteFooter">
      <div className="wrap siteFooterInner">
        <p className="siteFooterCredit display">{CREDIT}.</p>
        <div className="siteFooterRow">
          <p>{SITE_NAME}. Your details stay on your device.</p>
          <nav className="siteFooterLinks" aria-label="Footer">
            <Link href="/">Home</Link>
            <Link href="/find">Find my tithi</Link>
            <Link href="/blog">Blog</Link>
            <Link href="/how-it-works">How it works</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <CookieSettingsButton className="siteFooterButton" />
          </nav>
        </div>
      </div>
    </footer>
  );
}
