"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

import { chooseConsent, readConsent, settingsOpen, subscribe, type Consent } from "@/lib/consent";

import { Analytics } from "./Analytics";

const useConsent = () => useSyncExternalStore<Consent | "loading">(subscribe, readConsent, () => "loading");
const useSettingsOpen = () => useSyncExternalStore(subscribe, settingsOpen, () => false);

/** A small cookie choice. Analytics and the pixel load only after Accept. */
export function CookieConsent() {
  const consent = useConsent();
  const reopened = useSettingsOpen();

  return (
    <>
      {consent === "granted" && <Analytics />}
      {(consent === null || reopened) && (
        <section className="cookieBar" aria-label="Cookie choice">
          <p>
            We use cookies to count visits and measure our ads. Your birth details are never included.{" "}
            <Link href="/privacy">Privacy Policy</Link>
          </p>
          <div className="cookieActions">
            <button className="cookieButton" type="button" onClick={() => chooseConsent("denied")}>
              Decline
            </button>
            <button className="cookieButton cookieAccept" type="button" onClick={() => chooseConsent("granted")}>
              Accept
            </button>
          </div>
        </section>
      )}
    </>
  );
}
