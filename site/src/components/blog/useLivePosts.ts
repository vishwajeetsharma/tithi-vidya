"use client";

import { useEffect, useState } from "react";

import { isLive } from "@/lib/posts";

/** setTimeout can't wait longer than this (about 24 days). */
const LONGEST_WAIT = 2 ** 31 - 1;

/**
 * The posts that are out, by the visitor's clock. The first render uses the
 * build time, so it matches the HTML. The real clock takes over straight
 * after, and a post that goes live while the page is open appears then.
 */
export function useLivePosts<T extends { liveAt: string }>(posts: T[], builtAt: string): T[] {
  const [now, setNow] = useState(() => Date.parse(builtAt));
  const times = posts.map((post) => post.liveAt).join(" ");

  useEffect(() => {
    let timer: number | undefined;
    const tick = () => {
      const at = Date.now();
      setNow(at);
      const next = Math.min(...times.split(" ").map(Date.parse).filter((time) => time > at));
      if (next - at < LONGEST_WAIT) timer = window.setTimeout(tick, next - at + 500);
    };
    tick();
    return () => window.clearTimeout(timer);
  }, [times]);

  return posts.filter((post) => isLive(post, now));
}
