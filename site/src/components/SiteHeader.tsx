"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { inLang, splitPath } from "@/i18n/config";
import { dictionary } from "@/i18n/dictionaries";
import { litPath } from "@/lib/moon";

import { LanguageMenu } from "./LanguageMenu";

const START = 30; // a thin crescent at the top of the page

/** The logo's moon runs through its phases as you read down the page. */
export function SiteHeader() {
  const pathname = usePathname();
  // On a translated page (/hi/...), the bar speaks that language. The blog and
  // the home page exist in it; pages that are not translated yet stay in English.
  const { lang } = splitPath(pathname);
  const t = dictionary(lang).nav;
  const LINKS = [
    { href: inLang(lang, "/blog"), label: t.blog },
    { href: "/how-it-works", label: t.how },
  ];
  const lit = useRef<SVGPathElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    if (document.documentElement.dataset.motion !== "on") return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const room = document.documentElement.scrollHeight - window.innerHeight;
      const progress = room > 0 ? Math.min(window.scrollY / room, 1) : 0;
      lit.current?.setAttribute("d", litPath(START + progress * 300));
    };
    const onScroll = () => {
      frame ||= requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [pathname]);

  // The phone menu closes on Escape or a tap anywhere else. Escape puts focus
  // back on the Menu button, so keyboard users don't lose their place.
  useEffect(() => {
    if (!menu) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenu(false);
      menuButton.current?.focus();
    };
    const onPointer = (event: PointerEvent) => !bar.current?.contains(event.target as Node) && setMenu(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [menu]);

  const current = (href: string) => (pathname === href || pathname.startsWith(`${href}/`) ? "page" : undefined);

  return (
    <header className="siteHeader" lang={lang}>
      <div className="siteHeaderBar" ref={bar}>
        <Link className="logo" href={inLang(lang, "/")} aria-label={t.home}>
          <svg width="30" height="30" viewBox="-52 -52 104 104" aria-hidden="true">
            <defs>
              <linearGradient id="logoNight" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#2758ec" />
                <stop offset="1" stopColor="#8f35e8" />
              </linearGradient>
            </defs>
            <circle r="50" fill="url(#logoNight)" />
            <path ref={lit} d={litPath(START)} fill="#fff" />
          </svg>
          <span className="logoWord">Tithi Vidya</span>
        </Link>
        <nav className="siteNav" aria-label={t.main}>
          <div className="siteNavLinks">
            {LINKS.map((link) => (
              <Link key={link.href} className="siteNavLink" href={link.href} aria-current={current(link.href)}>
                {link.label}
              </Link>
            ))}
          </div>
          <LanguageMenu variant="header" />
          <Link className="btn btnPrimary siteNavCta" href="/find" aria-current={current("/find")}>
            {t.find}
          </Link>
          <button
            ref={menuButton}
            className="siteMenuButton"
            type="button"
            aria-expanded={menu}
            aria-controls="site-menu"
            aria-label={t.menu}
            onClick={() => setMenu((open) => !open)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              {menu ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 8h16M4 16h16" />}
            </svg>
          </button>
        </nav>
        {menu && (
          <div id="site-menu" className="siteMenu">
            {LINKS.map((link) => (
              <Link key={link.href} className="siteMenuLink" href={link.href} aria-current={current(link.href)} onClick={() => setMenu(false)}>
                {link.label}
              </Link>
            ))}
            <LanguageMenu variant="menu" />
          </div>
        )}
      </div>
    </header>
  );
}
