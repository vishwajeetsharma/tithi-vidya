"use client";

import { useState } from "react";

import { RssIcon } from "@/components/Icons";

import s from "./blog.module.css";

/** Ways to follow the blog in a feed reader. Opening feed.xml itself only shows code in most browsers. */
export function FollowFeed({ feed }: { feed: string }) {
  const [copied, setCopied] = useState(false);
  const encoded = encodeURIComponent(feed);

  async function copy() {
    try {
      await navigator.clipboard.writeText(feed);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copy this address into your feed reader:", feed);
    }
  }

  return (
    <details className={s.follow}>
      <summary className="btn btnGhost">
        <RssIcon />
        Follow with RSS
      </summary>
      <div className={s.followPanel}>
        <p>Get new articles in your feed reader. Copy this address into it, or pick a reader.</p>
        <div className={s.followCopy}>
          <input className={s.field} value={feed} readOnly aria-label="Feed address" onFocus={(event) => event.currentTarget.select()} />
          <button type="button" className="btn btnPrimary" onClick={copy}>
            {copied ? "Copied" : "Copy"}
          </button>
          <span className="visuallyHidden" role="status">
            {copied ? "Feed address copied" : ""}
          </span>
        </div>
        <ul className={s.followReaders} aria-label="Feed readers">
          <li>
            <a href={`https://feedly.com/i/subscription/feed%2F${encoded}`} target="_blank" rel="noopener noreferrer">
              Feedly
            </a>
          </li>
          <li>
            <a href={`https://www.inoreader.com/?add_feed=${encoded}`} target="_blank" rel="noopener noreferrer">
              Inoreader
            </a>
          </li>
          <li>
            <a href={`feed:${feed}`}>Open in my reader app</a>
          </li>
        </ul>
      </div>
    </details>
  );
}
