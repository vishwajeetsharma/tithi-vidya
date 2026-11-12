// The site's languages, in two kinds:
//
// 1. "Translated": languages with pages of their own, at /hi/..., /mr/...
//    People write and check these, so they read well, and they live on our
//    own addresses, so Google can list them for searches in that language.
//    Adding one is three steps: a line in languages.json, its words in
//    dictionaries.ts, and an index.<code>.md beside each post it covers.
//
// 2. "More": every other language, one tap away through Google Translate,
//    free and with nothing to maintain. Those pages are not ours, so Google
//    does not list them. When a language here starts bringing readers, it is
//    worth moving up to "translated".
//
// scripts/content.mjs reads the same languages.json to build translated posts.
import languages from "./languages.json";

/** Where the site is published. The Google Translate links need the real address, even on a test copy. */
const PUBLISHED = "https://www.tithividya.org";

export type TranslatedLang = keyof typeof languages.translated;
export type Lang = "en" | TranslatedLang;

type About = { name: string; english: string; dir: "ltr" | "rtl"; speech: string; og: string };

export const LANGS: Record<Lang, About> = {
  en: { name: "English", english: "English", dir: "ltr", speech: "en-IN", og: "en_IN" },
  ...(languages.translated as Record<TranslatedLang, About>),
};

/**
 * The switch for everything about languages. While it is false the site is
 * English only: no language menu, no "Read this in" line, no /hi or /mr pages
 * (they answer 404), and nothing about them in the sitemap or for search
 * engines. The translations themselves stay in the repository, so turning it
 * back on brings everything back. "Listen to this article" does not depend on it.
 */
export const LANGUAGES_ON = false;

export const TRANSLATED = (LANGUAGES_ON ? Object.keys(languages.translated) : []) as TranslatedLang[];

export const isTranslated = (value: string): value is TranslatedLang => LANGUAGES_ON && Object.hasOwn(languages.translated, value);

/** [Google's code, the language's own name, its English name]. */
export const MORE_LANGUAGES = languages.more as [code: string, name: string, english: string][];

/** A page's address in a language: ("hi", "/blog/x") gives "/hi/blog/x". English has no prefix. */
export const inLang = (lang: Lang, path: string): string => (lang === "en" ? path : `/${lang}${path === "/" ? "" : path}`);

/** The language an address is in, and the address without it: "/hi/blog/x" gives hi and "/blog/x". */
export function splitPath(pathname: string): { lang: Lang; path: string } {
  const [, first, ...rest] = pathname.split("/");
  if (first && isTranslated(first)) return { lang: first, path: `/${rest.join("/")}`.replace(/\/$/, "") || "/" };
  return { lang: "en", path: pathname || "/" };
}

/** This page, read through Google Translate in another language. `path` is the page's address on our site. */
export const googleTranslate = (path: string, to: string, from: Lang = "en"): string =>
  `https://translate.google.com/translate?sl=${from}&tl=${encodeURIComponent(to)}&u=${encodeURIComponent(PUBLISHED + path)}`;

/** Dates in the reader's language: "24 November 2026", "24 नवंबर 2026". */
export function dateFormatter(lang: Lang): (iso: string) => string {
  const format = new Intl.DateTimeFormat(lang === "en" ? "en-GB" : `${lang}-IN`, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC", numberingSystem: "latn" });
  return (iso) => format.format(new Date(`${iso}T00:00:00Z`));
}
