export const SITE_NAME = "Tithi Vidya";
export const AUTHOR = "Vishwajeet Sharma";
export const CREDIT = "Built using Claude Opus 5.5 by Vishwajeet Sharma";
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

/** The public address. Vercel provides it at build time; NEXT_PUBLIC_SITE_URL overrides it. */
export function siteUrl(): URL {
  const host =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL ??
    "localhost:3000";
  return new URL(host.startsWith("http") ? host : `${host.startsWith("localhost") ? "http" : "https"}://${host}`);
}
