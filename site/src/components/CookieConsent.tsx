"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

import { chooseConsent, readConsent, settingsOpen, subscribe, type Consent } from "@/lib/consent";

const useConsent = () => useSyncExternalStore<Consent | "loading">(subscribe, readConsent, () => "loading");
const useSettingsOpen = () => useSyncExternalStore(subscribe, settingsOpen, () => false);

/**
 * The cookie choice, asked on the finder page where birth details are entered.
 * The tags themselves are in the page head (lib/analytics-script.ts).
 */
export function CookieConsent() {
  const consent = useConsent();
  const reopened = useSettingsOpen();
  const onFinder = usePathname() === "/find";

  return (
    <>
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
