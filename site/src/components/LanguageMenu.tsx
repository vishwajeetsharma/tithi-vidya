"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { googleTranslate, inLang, LANGS, MORE_LANGUAGES, splitPath, TRANSLATED, type Lang } from "@/i18n/config";
import { dictionary } from "@/i18n/dictionaries";

/**
 * Where this page lives in each of our own languages. Every page names its
 * translations in its <head> (hreflang links, which search engines read too),
 * so the menu reads them from there and never guesses an address.
 */
function translationsOfThisPage(): Partial<Record<string, string>> {
  const found: Partial<Record<string, string>> = {};
  for (const link of document.head.querySelectorAll<HTMLLinkElement>('link[rel="alternate"][hreflang]')) {
    if (link.hreflang !== "x-default") found[link.hreflang] = new URL(link.href).pathname;
  }
  return found;
}

function Globe() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.6 2.9 3.9 5.9 3.9 9s-1.3 6.1-3.9 9c-2.6-2.9-3.9-5.9-3.9-9s1.3-6.1 3.9-9Z" />
    </svg>
  );
}

/**
 * The language menu. Two kinds of language are in it (see src/i18n/config.ts):
 * our own translations, which are pages on this site, and every other
 * language, which opens this page in Google Translate.
 *
 * `variant` is where it sits: "header" is the globe in the top bar, "menu" a
 * row in the phone menu, and "inline" a text button inside an article.
 */
export function LanguageMenu({ variant = "header", label }: { variant?: "header" | "menu" | "inline"; label?: string }) {
  const { lang, path } = splitPath(usePathname());
  const t = dictionary(lang).language;
  const [open, setOpen] = useState(false);
  const [pages, setPages] = useState<Partial<Record<string, string>>>({});
  const box = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      setOpen(false);
      button.current?.focus();
    };
    const onPointer = (event: PointerEvent) => !box.current?.contains(event.target as Node) && setOpen(false);
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  function toggle() {
    if (!open) setPages(translationsOfThisPage());
    setOpen((was) => !was);
  }

  // Google translates from the English page: it is the original, so the result reads best.
  const english = pages.en ?? inLang("en", path);
  const ours: Lang[] = ["en", ...TRANSLATED];

  return (
    <div className={`langMenu langMenu-${variant}`} ref={box}>
      <button
        ref={button}
        className={variant === "header" ? "langButton" : variant === "menu" ? "siteMenuLink langRow" : "langInline"}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-label={variant === "header" ? `${t.button}: ${LANGS[lang].name}` : undefined}
        onClick={toggle}
      >
        <Globe />
        {variant === "header" ? <span lang={lang}>{LANGS[lang].name}</span> : <span>{label ?? `${t.button}: ${LANGS[lang].name}`}</span>}
      </button>
      {open && (
        <div id={id} className="langPanel" lang={lang}>
          <p className="langTitle">{t.title}</p>
          <p className="langGroup">{t.ours}</p>
          <ul className="langList">
            {ours.map((code) => {
              const here = code === lang;
              const page = here ? inLang(lang, path) : pages[code];
              return (
                <li key={code}>
                  {page ? (
                    <a className="langLink" href={page} hrefLang={code} lang={code} aria-current={here ? "page" : undefined}>
                      {LANGS[code].name}
                      {here && <small lang={lang}>{t.current}</small>}
                    </a>
                  ) : (
                    // Not translated by us yet: Google's version of this page, and a note saying so.
                    <a className="langLink" href={googleTranslate(english, code)} hrefLang={code} target="_blank" rel="noopener">
                      <span lang={code}>{LANGS[code].name}</span>
                      <small>{t.notYet} ↗</small>
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="langGroup">{t.more}</p>
          <ul className="langList langMore">
            {MORE_LANGUAGES.map(([code, name, englishName]) => (
              <li key={code}>
                <a className="langLink" href={googleTranslate(english, code)} hrefLang={code} lang={code} title={englishName} target="_blank" rel="noopener">
                  {name}
                </a>
              </li>
            ))}
          </ul>
          <p className="langNote">{t.moreNote}</p>
        </div>
      )}
    </div>
  );
}
