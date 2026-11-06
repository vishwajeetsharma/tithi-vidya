"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import s from "./blog.module.css";

// Set in Vercel with the private key; the button hides until it is.
const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

type Support = "server" | "none" | "home-screen" | "yes";
type Status = "checking" | "off" | "on" | "blocked" | "working" | "error";

/** What the browser can do. It never changes while the page is open. */
function support(): Support {
  if (!PUBLIC_KEY) return "none";
  const apple = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const installed = matchMedia("(display-mode: standalone)").matches;
  // iPhone and iPad allow notifications only for sites added to the Home Screen.
  if (apple && !installed && !("PushManager" in window)) return "home-screen";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return "none";
  return "yes";
}
const never = () => () => {};
const notWhileBuilding = (): Support => "server";

/** The public key, as the bytes pushManager.subscribe wants. */
function keyBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const base64 = (base64url + "=".repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

async function currentSubscription() {
  const registration = await navigator.serviceWorker.getRegistration("/");
  return (await registration?.pushManager.getSubscription()) ?? null;
}

/**
 * "Get notified of new articles". The browser asks permission only after a
 * click, as browsers require. The subscription goes to /api/push, and
 * public/sw.js shows the notifications.
 */
export function NotifyButton({ card = false }: { card?: boolean }) {
  const can = useSyncExternalStore(never, support, notWhileBuilding);
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    if (can !== "yes") return;
    let live = true;
    currentSubscription()
      .then((subscription) => {
        if (!live) return;
        setStatus(subscription ? "on" : Notification.permission === "denied" ? "blocked" : "off");
      })
      .catch(() => live && setStatus("off"));
    return () => {
      live = false;
    };
  }, [can]);

  if (can === "server" || can === "none") return null;

  async function turnOn() {
    setStatus("working");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return setStatus(permission === "denied" ? "blocked" : "off");
      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(PUBLIC_KEY) });
      const response = await fetch("/api/push", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(subscription) });
      if (!response.ok) {
        await subscription.unsubscribe();
        return setStatus("error");
      }
      setStatus("on");
    } catch {
      setStatus("error");
    }
  }

  async function turnOff() {
    setStatus("working");
    try {
      const subscription = await currentSubscription();
      if (subscription) {
        await fetch("/api/push", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ endpoint: subscription.endpoint }) });
        await subscription.unsubscribe();
      }
      setStatus("off");
    } catch {
      setStatus("error");
    }
  }

  const message =
    can === "home-screen"
      ? "On iPhone and iPad, first add this site to your Home Screen: tap Share, then Add to Home Screen. Open it from there to turn on notifications."
      : status === "on"
        ? "Notifications are on. You'll hear when a new article comes out."
        : status === "blocked"
          ? "Notifications are blocked for this site. Allow them in your browser's settings to get new articles."
          : status === "error"
            ? "Sorry, that didn't work. Please try again."
            : card
              ? "One notification when a new article comes out. No account needed, and you can turn it off any time."
              : "";

  const button =
    can === "home-screen" || status === "blocked" ? null : status === "on" ? (
      <button type="button" className={`btn btnGhost ${s.notifyButton}`} onClick={() => void turnOff()}>
        <BellIcon off />
        Turn off notifications
      </button>
    ) : (
      <button type="button" className={`btn ${card ? "btnPrimary" : "btnGhost"} ${s.notifyButton}`} onClick={() => void turnOn()} disabled={status === "working" || status === "checking"}>
        <BellIcon />
        {status === "working" ? "One moment…" : "Get notified of new articles"}
      </button>
    );

  if (!card) {
    return (
      <div className={s.notifyInline}>
        {button}
        {message && (
          <p className={s.notifyNote} role="status">
            {message}
          </p>
        )}
      </div>
    );
  }
  return (
    <section className={s.notifyCard} aria-labelledby="notify-title">
      <h2 id="notify-title" className={s.railLabel}>
        New article alerts
      </h2>
      <p role="status">{message}</p>
      {button}
    </section>
  );
}

function BellIcon({ off = false }: { off?: boolean }) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9a6 6 0 1 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9M10 20a2.2 2.2 0 0 0 4 0" />
      {off && <path d="m4 4 16 16" />}
    </svg>
  );
}
