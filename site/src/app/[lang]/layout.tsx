import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { HtmlLang } from "@/components/HtmlLang";
import { isTranslated, LANGS, TRANSLATED } from "@/i18n/config";

// Pages in the site's translated languages live under /hi, /mr and so on
// (src/i18n/config.ts lists them). English pages stay where they are, at
// addresses with no prefix, so nothing about them changes.
//
// Any other first word in an address is not a language: a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return TRANSLATED.map((lang) => ({ lang }));
}

export default async function LanguageLayout({ children, params }: { children: ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isTranslated(lang)) notFound();
  const { dir } = LANGS[lang];
  return (
    // The site's one <html> element says "en". This marks everything inside as
    // the page's real language straight away, and the script and HtmlLang fix
    // <html> itself, before the page is drawn and when moving between pages.
    <div lang={lang} dir={dir}>
      <script dangerouslySetInnerHTML={{ __html: `document.documentElement.lang=${JSON.stringify(lang)};document.documentElement.dir=${JSON.stringify(dir)}` }} />
      <HtmlLang lang={lang} dir={dir} />
      {children}
    </div>
  );
}
