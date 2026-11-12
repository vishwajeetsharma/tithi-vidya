import Link from "next/link";

import { LanguageMenu } from "@/components/LanguageMenu";
import { inLang, LANGS, TRANSLATED, type Lang } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

import s from "./blog.module.css";

/**
 * "Read this in: हिन्दी · मराठी · More languages", under an article's heading.
 * The links to our own translations are plain links, so search engines follow
 * them from one language to the next. "More languages" opens the full menu.
 */
export function ReadIn({
  lang,
  slug,
  translations,
  t,
  more,
}: {
  lang: Lang;
  slug: string;
  translations: Partial<Record<string, unknown>> | undefined;
  t: Dictionary["post"];
  more: string;
}) {
  const others = (["en", ...TRANSLATED] as Lang[]).filter((code) => code !== lang && (code === "en" || translations?.[code]));
  return (
    <div className={s.readIn}>
      <span>{t.readIn}</span>
      {others.map((code) => (
        <Link key={code} className={s.readInLink} href={inLang(code, `/blog/${slug}`)} hrefLang={code} lang={code}>
          {LANGS[code].name}
        </Link>
      ))}
      <LanguageMenu variant="inline" label={more} />
    </div>
  );
}
