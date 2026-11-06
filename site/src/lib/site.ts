import type { Metadata } from "next";

export const SITE_NAME = "Tithi Vidya";
export const AUTHOR = "Vishwajeet Sharma";
export const CREDIT = "Built with belief and love by Vishwajeet Sharma";
export const REPO_URL = "https://github.com/vishwajeetsharma/tithi-vidya";
// The main address, as set in Vercel: tithividya.org redirects here.
export const SITE_ORIGIN = "https://www.tithividya.org";
export const CONTACT_EMAIL = "contact@tithividya.org";
/** Vishwajeet's own address, used only where he is credited as the maker. */
export const AUTHOR_EMAIL = "contact@thevishwa.in";
export const LINKEDIN_URL = "https://www.linkedin.com/in/vishwajeet21sharma/";
export const PORTFOLIO_URL = "https://www.thevishwa.in/";
/**
 * Google's "Preferred Sources" page for this site. A reader who adds it sees
 * more of the site in their own Top Stories and Discover. Google asks for the
 * bare domain here.
 */
export const GOOGLE_PREFERRED_SOURCE = `https://www.google.com/preferences/source?q=${new URL(SITE_ORIGIN).hostname.replace(/^www\./, "")}`;
export const GOOGLE_ANALYTICS_ID = "G-EH6CQB4WNP";
export const META_PIXEL_ID = "1817935669409933";
export const SITE_TITLE = "Tithi Vidya: Find Your Tithi Birthday by Date of Birth";
export const SITE_DESCRIPTION =
  "Find your tithi from your date, time and place of birth, and see your moon birthday for the next 100 years. Free, private and built on NASA JPL data.";
export const KEYWORDS = [
  "tithi",
  "tithi calculator",
  "tithi birthday",
  "janma tithi",
  "find tithi by date of birth",
  "hindu birthday calculator",
  "hindu calendar birthday",
  "panchang",
  "moon birthday",
  "lunar birthday",
];

/**
 * The public address, for canonical links, the sitemap and feeds. Every Vercel
 * build, previews included, points at the real site so search engines never
 * index a preview. Local builds use localhost. NEXT_PUBLIC_SITE_URL overrides both.
 */
export function siteUrl(): URL {
  const host = process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL ? SITE_ORIGIN : "localhost:3000");
  return new URL(host.startsWith("http") ? host : `${host.startsWith("localhost") ? "http" : "https"}://${host}`);
}

const SHARE_IMAGE = {
  url: "/opengraph-image.png",
  width: 1200,
  height: 630,
  alt: "Tithi Vidya: you have two birthdays. Find your tithi and your moon birthday for the next 100 years.",
};

/**
 * A page's title, description, canonical link and sharing tags, complete.
 * Next replaces the site-wide openGraph with a page's own instead of merging
 * them, so a page that set only some of it shared without an image, or with
 * the home page's title.
 */
export function pageMetadata({ title, description, path, type = "website" }: { title: string; description: string; path: string; type?: "website" | "article" }): Metadata {
  const full = `${title} | ${SITE_NAME}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type, siteName: SITE_NAME, locale: "en_IN", title: full, description, url: path, images: [SHARE_IMAGE] },
    twitter: { card: "summary_large_image", title: full, description, images: [SHARE_IMAGE.url] },
  };
}
