"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type FormEvent } from "react";

import {
  ACCEPT_ALL,
  DECLINE_ALL,
  carryOverOldChoice,
  closeSettings,
  readChoice,
  saveChoice,
  settingsOpen,
  subscribe,
  type Choice,
} from "@/lib/consent";

/** If the visitor hasn't scrolled by then, ask anyway. */
const ASK_AFTER_MS = 5000;

// What the server draws: nothing, since only the browser knows the choice.
const ON_SERVER: Choice = { ...DECLINE_ALL };

const useChoice = () => useSyncExternalStore<Choice | null>(subscribe, readChoice, () => ON_SERVER);
const useSettingsOpen = () => useSyncExternalStore(subscribe, settingsOpen, () => false);

/** True while the visitor is typing, so the box never pops up over a field in use. */
const typing = () => document.activeElement instanceof HTMLElement && document.activeElement.matches("input, textarea, select, [contenteditable='true']");

/**
 * The cookie box, on every page. Nothing that sets analytics or ad cookies
 * runs until the visitor accepts (lib/analytics-script.ts). It waits for the
 * first scroll, or a few seconds, so the page itself comes first.
 */
export function CookieConsent() {
  const choice = useChoice();
  const reopened = useSettingsOpen();
  const [due, setDue] = useState(false);
  const [choosing, setChoosing] = useState(false);
  const box = useRef<HTMLElement>(null);
  const titleId = useId();
  const undecided = choice === null;

  useEffect(carryOverOldChoice, []);

  useEffect(() => {
    if (!undecided || due) return;
    let waiting = true;
    let held = false;
    const ask = () => {
      if (!waiting) return;
      // Typing in a field: wait until they leave it.
      if (typing()) {
        held = true;
        return;
      }
      waiting = false;
      setDue(true);
    };
    // After focus moves, so tabbing to the next field still counts as typing.
    const left = () => {
      if (held) setTimeout(ask, 0);
    };
    const timer = setTimeout(ask, ASK_AFTER_MS);
    addEventListener("scroll", ask, { passive: true });
    document.addEventListener("focusout", left);
    return () => {
      waiting = false;
      clearTimeout(timer);
      removeEventListener("scroll", ask);
      document.removeEventListener("focusout", left);
    };
  }, [undecided, due]);

  // Opened from Cookie settings: take keyboard focus there.
  useEffect(() => {
    if (reopened) box.current?.focus();
  }, [reopened]);

  // "Choose what to allow" disappears once pressed, so move focus to the first choice.
  useEffect(() => {
    if (choosing) box.current?.querySelector("input")?.focus();
  }, [choosing]);

  if (!reopened && !(undecided && due)) return null;

  const detailed = choosing || reopened;
  const current = choice ?? DECLINE_ALL;
  const choose = (next: Choice) => {
    setChoosing(false);
    saveChoice(next);
  };
  const saveChosen = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    choose({ analytics: form.has("analytics"), ads: form.has("ads") });
  };

  return (
    <section ref={box} className="cookieBar" aria-labelledby={titleId} tabIndex={-1}>
      {reopened && (
        <button className="cookieClose" type="button" aria-label="Close cookie settings" onClick={closeSettings}>
          ×
        </button>
      )}
      <p>
        <strong id={titleId} className="cookieTitle">
          Can we use cookies?
        </strong>{" "}
        They let us count visits with Google Analytics, and show and measure ads with Google and Meta. Nothing loads unless you say yes, and your
        birth details are never shared. <Link href="/privacy#cookies">Privacy Policy</Link>
      </p>

      {detailed && (
        // Keyed by the saved choice, so the boxes show it each time this opens.
        <form key={JSON.stringify(current)} className="cookieChoices" onSubmit={saveChosen}>
          <label className="cookieOption">
            <input type="checkbox" name="analytics" defaultChecked={current.analytics} />
            <span>
              <strong>Visit counts.</strong> Google Analytics shows us which pages people open.
            </span>
          </label>
          <label className="cookieOption">
            <input type="checkbox" name="ads" defaultChecked={current.ads} />
            <span>
              <strong>Ads.</strong> Google ads that can be based on your visits, and the Meta Pixel, which measures our Facebook and Instagram ads.
            </span>
          </label>
          <button className="cookieButton cookieSave" type="submit">
            Save my choices
          </button>
        </form>
      )}

      <div className="cookieActions">
        <button className="cookieButton" type="button" onClick={() => choose(DECLINE_ALL)}>
          {detailed ? "Decline all" : "Decline"}
        </button>
        <button className="cookieButton" type="button" onClick={() => choose(ACCEPT_ALL)}>
          {detailed ? "Accept all" : "Accept"}
        </button>
      </div>

      {!detailed && (
        <button className="cookieMore" type="button" onClick={() => setChoosing(true)}>
          Choose what to allow
        </button>
      )}
    </section>
  );
}
