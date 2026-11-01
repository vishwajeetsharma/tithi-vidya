"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { litPath } from "@/lib/moon";

const START = 30; // a thin crescent at the top of the page

/** The logo's moon runs through its phases as you read down the page. */
export function SiteHeader() {
  const pathname = usePathname();
  const lit = useRef<SVGPathElement>(null);

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

  return (
    <header className="siteHeader">
      <div className="siteHeaderBar">
        <Link className="logo" href="/" aria-label="Tithi Vidya home">
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
        <nav className="siteNav" aria-label="Main">
          <Link className="siteNavLink" href="/how-it-works" aria-current={pathname === "/how-it-works" ? "page" : undefined}>
            How it works
          </Link>
          <Link className="btn btnPrimary siteNavCta" href="/find" aria-current={pathname === "/find" ? "page" : undefined}>
            Find my tithi
          </Link>
        </nav>
      </div>
    </header>
  );
}
