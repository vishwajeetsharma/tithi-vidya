"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

import { chooseConsent, readConsent, settingsOpen, subscribe, type Consent } from "@/lib/consent";

import { Analytics } from "./Analytics";

const useConsent = () => useSyncExternalStore<Consent | "loading">(subscribe, readConsent, () => "loading");
const useSettingsOpen = () => useSyncExternalStore(subscribe, settingsOpen, () => false);

/**
 * Analytics and the pixel load by default, so ad landings on the home page are
 * measured, and stop if the visitor declines. The choice is asked on the finder
 * page, where birth details are entered.
 */
export function CookieConsent() {
  const consent = useConsent();
  const reopened = useSettingsOpen();
  const onFinder = usePathname() === "/find";

  return (
    <>
      {consent !== "denied" && consent !== "loading" && <Analytics />}
      {((consent === null && onFinder) || reopened) && (
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
