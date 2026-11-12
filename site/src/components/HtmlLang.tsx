"use client";

import { useEffect } from "react";

/**
 * Sets the page's language on <html> while a translated page is open, and
 * puts English back when the reader moves on. Screen readers and the browser
 * use it to pick a voice, a font and hyphenation.
 */
export function HtmlLang({ lang, dir }: { lang: string; dir: string }) {
  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = dir;
    return () => {
      root.lang = "en";
      root.dir = "ltr";
    };
  }, [lang, dir]);
  return null;
}
