"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { litPath } from "@/lib/moon";

import s from "./blog.module.css";

/**
 * The left rail on wide screens: a moon that fills as you read, share links,
 * and a way to the finder. Share links are plain links; no third-party script
 * is loaded.
 */
export function ReadingRail({ url, title }: { url: string; title: string }) {
  const lit = useRef<SVGPathElement>(null);
  const [percent, setPercent] = useState(0);
  const [copied, setCopied] = useState(false);

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

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  };

  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const shares = [
    { name: "WhatsApp", href: `https://wa.me/?text=${t}%20${u}` },
    { name: "X", href: `https://x.com/intent/tweet?text=${t}&url=${u}` },
    { name: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { name: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
  ];

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
        <ul className={s.shareList}>
          {shares.map((share) => (
            <li key={share.name}>
              <a className={s.shareLink} href={share.href} target="_blank" rel="noopener noreferrer" aria-label={`Share on ${share.name} (opens in a new tab)`}>
                {share.name}
              </a>
            </li>
          ))}
          <li>
            <button className={s.shareLink} type="button" onClick={() => void copy()}>
              {copied ? "Link copied" : "Copy link"}
            </button>
          </li>
        </ul>
      </div>

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
