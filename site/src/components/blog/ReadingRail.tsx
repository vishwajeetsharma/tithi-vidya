"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { litPath } from "@/lib/moon";

import s from "./blog.module.css";
import { PreferredSource } from "./PreferredSource";
import { ShareButtons } from "./ShareButtons";

/**
 * The left rail on wide screens: a moon that fills as you read, share links,
 * the Google preferred source button, and a way to the finder. Smaller screens
 * get the share links and button after the article instead.
 */
export function ReadingRail({ url, title }: { url: string; title: string }) {
  const lit = useRef<SVGPathElement>(null);
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const body = document.querySelector("[data-article-body]");
    if (!body) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const box = body.getBoundingClientRect();
      const read = Math.min(Math.max((window.innerHeight - box.top) / box.height, 0), 1);
      // New moon at the start, full moon at the end.
      lit.current?.setAttribute("d", litPath(8 + read * 172));
      setPercent(Math.round(read * 100));
    };
    const onScroll = () => {
      frame ||= requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className={s.railSticky}>
      <div className={s.progress}>
        <svg width="56" height="56" viewBox="-52 -52 104 104" aria-hidden="true">
          <circle r="50" fill="#3a2fb0" />
          <path ref={lit} d={litPath(8)} fill="#f4f1ff" />
          <circle r="50" fill="none" stroke="#7a6cf0" strokeWidth="2" />
        </svg>
        <p>
          <strong>{percent >= 100 ? "Finished" : `${percent}% read`}</strong>
          <span>The moon fills as you read</span>
        </p>
      </div>

      <div className={s.railBlock}>
        <p className={s.railLabel}>Share this article</p>
        <ShareButtons url={url} title={title} />
      </div>

      <PreferredSource compact />

      <div className={`${s.railBlock} ${s.railCta}`}>
        <p className={s.railLabel}>Your moon birthday</p>
        <p>Find your tithi and its dates for the next 100 years.</p>
        <Link className={s.railButton} href="/find">
          Find my tithi
        </Link>
      </div>
    </div>
  );
}
