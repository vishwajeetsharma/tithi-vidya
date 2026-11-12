"use client";

import { useState } from "react";

import type { Announcement } from "@/lib/push";

import s from "./backstage.module.css";

/** Waits for a new service worker to take over, so the preview is drawn by the newest public/sw.js. */
function activated(worker: ServiceWorker | null): Promise<void> {
  if (!worker || worker.state === "activated") return Promise.resolve();
  return new Promise((resolve) => {
    worker.addEventListener("statechange", () => worker.state === "activated" && resolve());
    setTimeout(resolve, 4000);
  });
}

/**
 * "Show on this device": asks this browser's service worker to draw the post's
 * notification, exactly as a subscriber's phone would. Nothing is sent to
 * anyone else, and no server is involved.
 */
export function PushPreview({ payload }: { payload: Announcement }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function show() {
    if (!("serviceWorker" in navigator) || !("Notification" in window)) {
      return setNote("This browser can't show notifications.");
    }
    setBusy(true);
    try {
      const permission = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
      if (permission !== "granted") {
        return setNote("Notifications are blocked for this site. Allow them in the browser's site settings, then try again.");
      }
      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await registration.update().catch(() => undefined);
      await activated(registration.installing ?? registration.waiting);
      const ready = await navigator.serviceWorker.ready;
      // Its own tag, so it never replaces the real notification for this post.
      ready.active?.postMessage({ type: "preview", payload: { ...payload, tag: `preview-${payload.tag}` } });
      setNote("Shown on this device. Look at your notifications.");
    } catch {
      setNote("That didn't work. Reload the page and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={s.pushTry}>
      <button className="btn btnGhost" type="button" onClick={show} disabled={busy}>
        Show on this device
      </button>
      <p role="status">{note}</p>
    </div>
  );
}
