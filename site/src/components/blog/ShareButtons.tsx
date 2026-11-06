"use client";

import { useState, useSyncExternalStore } from "react";

import s from "./blog.module.css";

// Whether the device has a share sheet never changes, so there is nothing to subscribe to.
const never = () => () => {};
const canShare = () => typeof navigator.share === "function";
const notWhileBuilding = () => false;

/**
 * Share links for an article. Plain links, so no third-party script loads.
 * On phones the device's own share sheet comes first, which reaches every app.
 */
export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const native = useSyncExternalStore(never, canShare, notWhileBuilding);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  };

  const share = async () => {
    try {
      await navigator.share({ title, url });
    } catch {
      // Closing the share sheet is not an error worth showing.
    }
  };

  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const links = [
    { name: "WhatsApp", href: `https://wa.me/?text=${t}%20${u}` },
    { name: "X", href: `https://x.com/intent/tweet?text=${t}&url=${u}` },
    { name: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { name: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { name: "Telegram", href: `https://t.me/share/url?url=${u}&text=${t}` },
  ];

  return (
    <>
      <ul className={s.shareList}>
        {native && (
          <li className={s.shareWide}>
            <button className={`${s.shareLink} ${s.shareNative}`} type="button" onClick={() => void share()}>
              <ShareIcon />
              Share
            </button>
          </li>
        )}
        {links.map((link) => (
          <li key={link.name}>
            <a className={s.shareLink} href={link.href} target="_blank" rel="noopener noreferrer" aria-label={`Share on ${link.name} (opens in a new tab)`}>
              {link.name}
            </a>
          </li>
        ))}
        <li>
          <button className={s.shareLink} type="button" onClick={() => void copy()}>
            {copied ? "Link copied" : "Copy link"}
          </button>
        </li>
      </ul>
      <span className="visuallyHidden" role="status">
        {copied ? "Link copied" : ""}
      </span>
    </>
  );
}

function ShareIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v12M7.5 7.5 12 3l4.5 4.5M5 12v6.5A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5V12" />
    </svg>
  );
}
