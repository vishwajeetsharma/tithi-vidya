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
