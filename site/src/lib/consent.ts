/**
 * The visitor's cookie choice, kept in this browser only. "analytics" is visit
 * counts (Google Analytics and Microsoft Clarity), and "ads" is ad measurement
 * (the Meta Pixel). Google's ads aren't part of it: they show for everyone.
 *
 * Before a choice, it depends on where the visitor is (lib/region.ts). In
 * Europe nothing that sets those cookies loads until the visitor says yes,
 * which is what the GDPR and the UK and Swiss rules ask for. Elsewhere they're
 * on until the visitor turns them off. The tags themselves are in
 * lib/analytics-script.ts, which reads the same keys with the same rules.
 */
export type Choice = { analytics: boolean; ads: boolean };

/** "strict" where tracking needs a yes first, "open" elsewhere. */
export type Region = "strict" | "open";

/** Where this tab keeps the answer from /api/region, so it's asked once a visit. */
export const REGION_KEY = "tithi-region";
/** Sent by the page head once it knows the region. */
export const REGION_EVENT = "tithi-region";

export const CONSENT_KEY = "tithi-consent";
/** Raise it when the box asks about something new: every earlier choice then expires and the box asks again. */
export const CONSENT_VERSION = 1;
/** A choice lasts a year, then the box asks again. */
export const CONSENT_DAYS = 365;

export const ACCEPT_ALL: Choice = { analytics: true, ads: true };
export const DECLINE_ALL: Choice = { analytics: false, ads: false };

/** The key the old opt-out box used, before AdSense. */
const OLD_KEY = "tithi-cookie-choice";

const DAY = 86_400_000;

declare global {
  interface Window {
    /**
     * Starts the tags a choice allows, and stops Google Analytics when it's
     * taken back. `pings` runs Analytics without cookies, before a choice in
     * Europe. Set by the page head on the live site only.
     */
    __tithiTags?: (choice: Choice & { pings?: boolean }) => void;
    /** The visitor's region, once the page head knows it. */
    __tithiRegion?: Region;
  }
}

/** A stored choice, or null when there is none, it's from an older box, or it's over a year old. */
export function parseChoice(raw: string | null, now: number): Choice | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    if (value?.v !== CONSENT_VERSION || typeof value.at !== "number" || now - value.at > CONSENT_DAYS * DAY) return null;
    return { analytics: value.analytics === true, ads: value.ads === true };
  } catch {
    return null;
  }
}

const listeners = new Set<() => void>();
let open = false;
// Where the choice lives when the browser blocks storage: this page only.
let memory: string | null = null;
let cache: { raw: string | null; choice: Choice | null } | undefined;

const notify = () => listeners.forEach((listener) => listener());

export function subscribe(listener: () => void) {
  // A choice made in another tab counts here too, and so does the region arriving.
  if (listeners.size === 0) {
    addEventListener("storage", notify);
    addEventListener(REGION_EVENT, notify);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      removeEventListener("storage", notify);
      removeEventListener(REGION_EVENT, notify);
    }
  };
}

const isRegion = (value: unknown): value is Region => value === "strict" || value === "open";

/** The visitor's region, or null until it's known. */
export function readRegion(): Region | null {
  if (isRegion(window.__tithiRegion)) return window.__tithiRegion;
  try {
    const kept = sessionStorage.getItem(REGION_KEY);
    if (isRegion(kept)) return kept;
  } catch {
    // Blocked storage: wait for the page head, or ask below.
  }
  return null;
}

/**
 * Asks /api/region, where the page head doesn't: in `npm run dev` and preview
 * deployments, which have no tags, so the box still works there. If the
 * question fails, the box asks first, as it does in Europe.
 */
export function loadRegion() {
  if (window.__tithiTags || readRegion()) return;
  fetch("/api/region")
    .then((response) => (response.ok ? (response.json() as Promise<{ strict?: boolean }>) : Promise.reject(response.status)))
    .then((answer): Region => (answer.strict === false ? "open" : "strict"))
    .catch((): Region => "strict")
    .then((region) => {
      window.__tithiRegion = region;
      try {
        sessionStorage.setItem(REGION_KEY, region);
      } catch {
        // Blocked storage: it's kept for this page.
      }
      notify();
    });
}

/** What's on for the visitor: their choice, or what their region starts with before one. */
export const effectiveChoice = (choice: Choice | null, region: Region | null): Choice => choice ?? (region === "open" ? ACCEPT_ALL : DECLINE_ALL);

/** The current choice, the same object until it changes, as useSyncExternalStore needs. */
export function readChoice(): Choice | null {
  let raw = memory;
  try {
    raw = localStorage.getItem(CONSENT_KEY) ?? memory;
  } catch {
    // Blocked storage: use the copy in memory.
  }
  if (!cache || cache.raw !== raw) cache = { raw, choice: parseChoice(raw, Date.now()) };
  return cache.choice;
}

/** First-party cookies each kind of tag sets on this site. Google's ad cookies aren't here: ads show for everyone. */
const COOKIES: Record<keyof Choice, RegExp> = {
  analytics: /^(_ga|_gid|_gat|_clck|_clsk)/,
  ads: /^(_fbp|_fbc)/,
};

function clearCookies(pattern: RegExp) {
  const domain = location.hostname.replace(/^www\./, "");
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.split("=")[0].trim();
    if (!pattern.test(name)) continue;
    document.cookie = `${name}=; Max-Age=0; path=/`;
    document.cookie = `${name}=; Max-Age=0; path=/; domain=.${domain}`;
  }
}

export function saveChoice(choice: Choice) {
  // Outside Europe, the tags ran before any choice, so a first "no" takes them back too.
  const before = effectiveChoice(readChoice(), readRegion());
  const raw = JSON.stringify({ v: CONSENT_VERSION, analytics: choice.analytics, ads: choice.ads, at: Date.now() });
  memory = raw;
  try {
    localStorage.setItem(CONSENT_KEY, raw);
    localStorage.removeItem(OLD_KEY);
  } catch {
    // Blocked storage: the choice lasts for this page only.
  }
  open = false;
  notify();

  const withdrawn = (Object.keys(COOKIES) as (keyof Choice)[]).filter((kind) => before[kind] && !choice[kind]);
  if (withdrawn.length > 0) {
    // Tags can't be unloaded, so clear their cookies and start the page again without them.
    for (const kind of withdrawn) clearCookies(COOKIES[kind]);
    location.reload();
    return;
  }
  window.__tithiTags?.(choice);
}

/**
 * The old box ran the tags until someone declined. A decline still stands. An
 * old Accept covered fewer services than the box asks about now, so those
 * visitors are asked again.
 */
export function carryOverOldChoice() {
  try {
    const old = localStorage.getItem(OLD_KEY);
    if (old === null) return;
    localStorage.removeItem(OLD_KEY);
    if (old === "denied" && localStorage.getItem(CONSENT_KEY) === null) saveChoice(DECLINE_ALL);
  } catch {
    // Blocked storage: nothing was kept, so there's nothing to carry over.
  }
}

export const settingsOpen = () => open;

export function openSettings() {
  open = true;
  notify();
}

export function closeSettings() {
  open = false;
  notify();
}
