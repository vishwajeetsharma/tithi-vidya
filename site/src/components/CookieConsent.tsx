"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type FormEvent } from "react";

import {
  ACCEPT_ALL,
  DECLINE_ALL,
  carryOverOldChoice,
  closeSettings,
  effectiveChoice,
  loadRegion,
  readChoice,
  readRegion,
  saveChoice,
  settingsOpen,
  subscribe,
  type Choice,
  type Region,
} from "@/lib/consent";

/** If the visitor hasn't scrolled by then, show the box anyway. */
const ASK_AFTER_MS = 5000;

// What the server draws: nothing, since only the browser knows the choice.
const ON_SERVER: Choice = { ...DECLINE_ALL };

const useChoice = () => useSyncExternalStore<Choice | null>(subscribe, readChoice, () => ON_SERVER);
const useRegion = () => useSyncExternalStore<Region | null>(subscribe, readRegion, () => null);
const useSettingsOpen = () => useSyncExternalStore(subscribe, settingsOpen, () => false);

/** True while the visitor is typing, so the box never pops up over a field in use. */
const typing = () => document.activeElement instanceof HTMLElement && document.activeElement.matches("input, textarea, select, [contenteditable='true']");

/** What the box says first: in Europe it asks, elsewhere it tells, and from Cookie settings it offers the choices. */
const WORDS = {
  ask: { title: "Cookies for visit counts and ad measurement?", line: "Only if you say yes." },
  notice: { title: "We use cookies to count visits and measure our ads.", line: "You can turn them off." },
  settings: { title: "Cookie settings.", line: "Choose what to allow." },
};

/**
 * The cookie box, on every page. In Europe nothing that sets analytics or ad
 * cookies runs until the visitor accepts; elsewhere they run, and the box is a
 * notice with a way to turn them off (lib/consent.ts). It waits for the first
 * scroll, or a few seconds, so the page itself comes first.
 */
export function CookieConsent() {
  const choice = useChoice();
  const region = useRegion();
  const reopened = useSettingsOpen();
  const [due, setDue] = useState(false);
  const [choosing, setChoosing] = useState(false);
  const box = useRef<HTMLElement>(null);
  const titleId = useId();
  const undecided = choice === null;

  useEffect(carryOverOldChoice, []);

  // Until the visitor chooses, the box needs to know which rules apply.
  useEffect(() => {
    if (undecided) loadRegion();
  }, [undecided]);

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

  // "Customize" disappears once pressed, so move focus to the first choice.
  useEffect(() => {
    if (choosing) box.current?.querySelector("input")?.focus();
  }, [choosing]);

  if (!reopened && !(undecided && due && region)) return null;

  const detailed = choosing || reopened;
  const words = reopened && !undecided ? WORDS.settings : region === "open" ? WORDS.notice : WORDS.ask;
  // Outside Europe the boxes start ticked, since those tags are already on.
  const current = effectiveChoice(choice, region);
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
          {words.title}
        </strong>{" "}
        {words.line} <Link href="/privacy#cookies">Privacy Policy</Link>
      </p>

      {detailed && (
        // Keyed by the choice in force, so the boxes show it each time this opens.
        <form key={JSON.stringify(current)} className="cookieChoices" onSubmit={saveChosen}>
          <label className="cookieOption">
            <input type="checkbox" name="analytics" defaultChecked={current.analytics} />
            <span>
              <strong>Visit counts.</strong> Google Analytics counts visits, and Microsoft Clarity shows how pages are used. Both get no birth
              details.
            </span>
          </label>
          <label className="cookieOption">
            <input type="checkbox" name="ads" defaultChecked={current.ads} />
            <span>
              <strong>Ad measurement.</strong> The Meta Pixel shows us whether our Facebook and Instagram ads bring visitors, and lets us show
              those ads to people who visited.
            </span>
          </label>
          <p className="cookieNote">
            Google&apos;s ads aren&apos;t part of this choice. You can turn off personalised ads in Google&apos;s{" "}
            <a href="https://myadcenter.google.com/" target="_blank" rel="noopener noreferrer">
              My Ad Center
            </a>
            .
          </p>
          <button className="cookieButton cookieSave" type="submit">
            Save my choices
          </button>
        </form>
      )}

      <div className={detailed ? "cookieActions" : region === "open" ? "cookieActions cookieActionsFirst cookieActionsNotice" : "cookieActions cookieActionsFirst"}>
        {!detailed && (
          <button className="cookieMore" type="button" onClick={() => setChoosing(true)}>
            {region === "open" ? "Settings" : "Customize"}
          </button>
        )}
        {(detailed || region !== "open") && (
          <button className="cookieButton" type="button" onClick={() => choose(DECLINE_ALL)}>
            {detailed ? "Decline all" : "Decline"}
          </button>
        )}
        <button className="cookieButton" type="button" onClick={() => choose(ACCEPT_ALL)}>
          {detailed ? "Accept all" : region === "open" ? "OK" : "Accept"}
        </button>
      </div>
    </section>
  );
}
