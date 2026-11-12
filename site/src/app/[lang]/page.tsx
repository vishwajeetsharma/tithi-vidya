import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LanguagePosts } from "@/components/blog/LanguagePosts";
import { inLang, isTranslated, LANGS, TRANSLATED } from "@/i18n/config";
import { dictionary } from "@/i18n/dictionaries";
import { pageMetadata } from "@/lib/site";

// A language's front page: /hi, /mr. Made again every 10 minutes, so an
// article joins it soon after it goes live (as on the English blog page).
export const revalidate = 600;

type Params = { params: Promise<{ lang: string }> };

/** The front page in every language, for hreflang and the language menu. */
const everywhere = (path: string) => ({ en: path, "x-default": path, ...Object.fromEntries(TRANSLATED.map((code) => [code, inLang(code, path)])) });

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { lang } = await params;
  if (!isTranslated(lang)) return {};
  const t = dictionary(lang).home;
  return pageMetadata({ title: t.title, description: t.lead, path: inLang(lang, "/"), languages: everywhere("/"), locale: LANGS[lang].og });
}

export default async function LanguageHome({ params }: Params) {
  const { lang } = await params;
  if (!isTranslated(lang)) notFound();
  return <LanguagePosts lang={lang} home />;
}
