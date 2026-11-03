import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import localFont from "next/font/local";
import type { ReactNode } from "react";

import { CookieConsent } from "@/components/CookieConsent";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { AUTHOR, KEYWORDS, SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, siteUrl } from "@/lib/site";

import { ANALYTICS_SCRIPT } from "@/lib/analytics-script";

import "./globals.css";

// Fraunces, trimmed to the soft display cut the headings use (scripts/make-fonts.py).
const display = localFont({
  src: [
    { path: "../fonts/fraunces-display.woff2", style: "normal" },
    { path: "../fonts/fraunces-display-italic.woff2", style: "italic" },
  ],
  weight: "400 700",
  variable: "--font-display",
  display: "swap",
});
const body = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: { default: SITE_TITLE, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  keywords: KEYWORDS,
  applicationName: SITE_NAME,
  authors: [{ name: AUTHOR }],
  creator: AUTHOR,
  category: "lifestyle",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
    locale: "en_IN",
  },
  twitter: { card: "summary_large_image", title: SITE_TITLE, description: SITE_DESCRIPTION },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#f8f7ff",
  colorScheme: "only light",
  width: "device-width",
  initialScale: 1,
};

// Runs before first paint. Scroll scenes are laid out only for visitors who
// have not asked for reduced motion; everyone else gets the plain page.
const MOTION_SCRIPT = `if(!matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.dataset.motion="on"`;

// Also runs first: moves birth details out of a shared link's address before
// any analytics tag can read it, including a link pasted while already on the
// page, which does not reload it. Must match STORE_KEY in lib/query.ts.
const STRIP_DETAILS = `(function(){function s(){if(location.hash.includes("date=")){try{sessionStorage.setItem("tithi-birth",location.hash.slice(1))}catch(e){}history.replaceState(null,"",location.pathname+location.search)}}s();addEventListener("hashchange",s)})()`;

// In this order: the address must be clean before any tag can read it.
const HEAD_SCRIPT = [STRIP_DETAILS, MOTION_SCRIPT, ...(process.env.NODE_ENV === "production" ? [ANALYTICS_SCRIPT] : [])].join(";");

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: HEAD_SCRIPT }} />
        <link rel="alternate" type="application/rss+xml" title="Tithi Vidya Blog" href="/blog/feed.xml" />
      </head>
      <body>
        <a className="skipLink" href="#main">
          Skip to main content
        </a>
        <SiteHeader />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter />
        <CookieConsent />
      </body>
    </html>
  );
}
