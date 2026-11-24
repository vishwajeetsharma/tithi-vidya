"use client";

import { useEffect } from "react";

// A reload of the page someone arrived on doesn't count again. Later articles,
// opened with a link, are new pages in the same visit, so they do count.
let arrived = true;

/**
 * Counts one view of an article (app/api/views). It sends only the post's
 * slug: no cookie, and nothing is kept in the browser. A tab opened in the
 * background counts once it's looked at. The live site only, and never while
 * signed in to Backstage.
 */
export function ViewCounter({ slug }: { slug: string }) {
  useEffect(() => {
    const navigation = performance.getEntriesByType?.("navigation")[0] as PerformanceNavigationTiming | undefined;
    const reloaded = arrived && navigation?.type === "reload";
    arrived = false;
    if (reloaded) return;

    const send = () => {
      if (navigator.sendBeacon?.("/api/views", slug)) return;
      fetch("/api/views", { method: "POST", body: slug, keepalive: true }).catch(() => undefined);
    };
    if (document.visibilityState === "visible") {
      send();
      return;
    }
    const shown = () => {
      if (document.visibilityState !== "visible") return;
      document.removeEventListener("visibilitychange", shown);
      send();
    };
    document.addEventListener("visibilitychange", shown);
    return () => document.removeEventListener("visibilitychange", shown);
  }, [slug]);
  return null;
}
