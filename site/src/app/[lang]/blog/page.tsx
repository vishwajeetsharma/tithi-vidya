import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LanguagePosts } from "@/components/blog/LanguagePosts";
import { inLang, isTranslated, LANGS, TRANSLATED } from "@/i18n/config";
import { dictionary } from "@/i18n/dictionaries";
import { pageMetadata } from "@/lib/site";

// A language's list of articles: /hi/blog, /mr/blog. Made again every 10 minutes.
export const revalidate = 600;

type Params = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { lang } = await params;
  if (!isTranslated(lang)) return {};
  const d = dictionary(lang);
  const languages = { en: "/blog", "x-default": "/blog", ...Object.fromEntries(TRANSLATED.map((code) => [code, inLang(code, "/blog")])) };
  return pageMetadata({ title: `${d.post.blog}: ${d.home.title}`, description: d.home.lead, path: inLang(lang, "/blog"), languages, locale: LANGS[lang].og });
}

export default async function LanguageBlog({ params }: Params) {
  const { lang } = await params;
  if (!isTranslated(lang)) notFound();
  return <LanguagePosts lang={lang} home={false} />;
}
