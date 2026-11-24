import { runInNewContext } from "node:vm";

import { describe, expect, it, vi } from "vitest";

import { ANALYTICS_SCRIPT } from "@/lib/analytics-script";
import { ACCEPT_ALL, CONSENT_KEY, CONSENT_VERSION, DECLINE_ALL, effectiveChoice, parseChoice, REGION_KEY, type Choice } from "@/lib/consent";
import { needsConsent } from "@/lib/region";
import { GOOGLE_ANALYTICS_ID } from "@/lib/site";

// Google's own ad blocking recovery code needs a real page. These tests are about
// when things load, so it's left out.
vi.mock("@/lib/funding-choices", () => ({ FC_ERROR_PROTECTION: "" }));

const NOW = Date.UTC(2026, 10, 20);
const DAY = 86_400_000;
const stored = (choice: Partial<Choice>, at = NOW, v = CONSENT_VERSION) => JSON.stringify({ v, analytics: false, ads: false, ...choice, at });

type Tags = (choice: Choice & { pings?: boolean }) => void;

/**
 * Runs the head script in a bare page, and returns the scripts it added and
 * the page's globals. `region` is what this tab already knows from
 * /api/region; `answer` is what /api/region says when asked. The page
 * finishes loading straight away unless `loaded` is false; then `load()` does it.
 */
function runHead(
  saved: string | null,
  {
    region = null as string | null,
    answer = Promise.resolve({ ok: true, json: async () => ({ strict: true }) }) as Promise<unknown>,
    loaded = true,
  } = {},
) {
  const added: string[] = [];
  const kept: Record<string, string> = {};
  const onLoad: (() => void)[] = [];
  const script = () => ({ async: false, crossOrigin: "", src: "" });
  const record = (element: { src: string }) => added.push(element.src);
  const page: Record<string, unknown> = {
    Date,
    JSON,
    setTimeout,
    frames: {},
    Event: class {
      constructor(public type: string) {}
    },
    dispatchEvent: vi.fn(),
    addEventListener: (type: string, listener: () => void) => {
      if (type === "load") onLoad.push(listener);
    },
    // The browser is idle at once.
    requestIdleCallback: (callback: () => void) => callback(),
    fetch: vi.fn(() => answer),
    localStorage: { getItem: (key: string) => (key === CONSENT_KEY ? saved : null) },
    sessionStorage: {
      getItem: (key: string) => (key === REGION_KEY ? region : null),
      setItem: (key: string, value: string) => {
        kept[key] = value;
      },
    },
    document: {
      readyState: "loading",
      createElement: script,
      head: { appendChild: record },
      body: { appendChild: () => undefined },
      getElementsByTagName: () => [{ parentNode: { insertBefore: record } }],
    },
  };
  page.window = page;
  runInNewContext(ANALYTICS_SCRIPT, page);
  const load = () => onLoad.splice(0).forEach((listener) => listener());
  if (loaded) load();
  return { added, page, kept, load, tags: page.__tithiTags as Tags };
}

/** Lets the /api/region answer arrive. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

const GA = /googletagmanager\.com\/gtag\/js/;
const ADSENSE = /pagead2\.googlesyndication\.com/;
const RECOVERY = /fundingchoicesmessages\.google\.com/;
const PIXEL = /connect\.facebook\.net/;
const CLARITY = /clarity\.ms\/tag\/zgagx5rs8w/;

const trackers = (added: string[]) => added.filter((src) => GA.test(src) || CLARITY.test(src) || PIXEL.test(src));
const has = (added: string[], pattern: RegExp) => added.some((src) => pattern.test(src));
/** Every gtag("consent", ...) call, in order. */
const consents = (page: Record<string, unknown>) =>
  ((page.dataLayer as IArguments[]) ?? []).map((entry) => Array.from(entry)).filter((entry) => entry[0] === "consent");
const gaOff = (page: Record<string, unknown>) => page[`ga-disable-${GOOGLE_ANALYTICS_ID}`];

describe("parseChoice", () => {
  it("reads a saved choice", () => {
    expect(parseChoice(stored({ analytics: true }), NOW)).toEqual({ analytics: true, ads: false });
  });

  it("forgets a choice after a year, one from an older box, and anything broken", () => {
    expect(parseChoice(stored({ ads: true }, NOW - 366 * DAY), NOW)).toBeNull();
    expect(parseChoice(stored({ ads: true }, NOW, CONSENT_VERSION - 1), NOW)).toBeNull();
    expect(parseChoice("granted", NOW)).toBeNull();
    expect(parseChoice('{"v":1}', NOW)).toBeNull();
    expect(parseChoice(null, NOW)).toBeNull();
  });
});

describe("where a yes is needed first", () => {
  it("in the EEA, the UK, Switzerland and Quebec, and when the country is unknown", () => {
    for (const country of ["DE", "fr", "IE", "NO", "GB", "CH", "RE"]) expect(needsConsent(country)).toBe(true);
    expect(needsConsent("CA", "QC")).toBe(true);
    expect(needsConsent(null)).toBe(true);
  });

  it("not in India, the US or the rest of Canada", () => {
    expect(needsConsent("IN")).toBe(false);
    expect(needsConsent("US", "CA")).toBe(false);
    expect(needsConsent("CA", "ON")).toBe(false);
  });

  it("before a choice, tags are on outside Europe and off in it", () => {
    expect(effectiveChoice(null, "open")).toEqual(ACCEPT_ALL);
    expect(effectiveChoice(null, "strict")).toEqual(DECLINE_ALL);
    expect(effectiveChoice(null, null)).toEqual(DECLINE_ALL);
    expect(effectiveChoice({ analytics: true, ads: false }, "open")).toEqual({ analytics: true, ads: false });
  });
});

describe("the head script", () => {
  it("loads nothing until the page has loaded, then everything a choice allows", () => {
    const { added, page, load } = runHead(stored({ analytics: true, ads: true }, Date.now()), { loaded: false });
    expect(added).toEqual([]);
    expect(page.fetch).not.toHaveBeenCalled();
    // Google's consent defaults are set at once: they load nothing.
    expect(consents(page)).toHaveLength(2);
    load();
    expect(has(added, ADSENSE) && has(added, RECOVERY)).toBe(true);
    expect(trackers(added)).toHaveLength(3);
  });

  it("a yes before the page has loaded starts those tags at once, and later steps keep it", async () => {
    const { added, page, tags, load } = runHead(null, { region: "strict", loaded: false });
    tags(ACCEPT_ALL);
    expect(trackers(added)).toHaveLength(3);
    // The visitor's yes is saved by then; the head reads it again, so Europe's
    // cookie-free default doesn't undo it.
    (page.localStorage as { getItem: (key: string) => string | null }).getItem = (key) => (key === CONSENT_KEY ? stored(ACCEPT_ALL, Date.now()) : null);
    load();
    await settle();
    expect(consents(page).some((entry) => entry[1] === "update" && (entry[2] as { analytics_storage?: string }).analytics_storage === "denied")).toBe(false);
    expect(gaOff(page)).toBe(false);
  });

  it("loads AdSense and its recovery message for everyone, once, and never asks for non-personalised ads", () => {
    for (const saved of [null, stored({}, Date.now()), stored({ analytics: true, ads: true }, Date.now())]) {
      const { added, page, tags } = runHead(saved, { region: "strict" });
      tags(ACCEPT_ALL);
      expect(added.filter((src) => ADSENSE.test(src))).toHaveLength(1);
      expect(has(added, RECOVERY)).toBe(true);
      expect((page.adsbygoogle as { requestNonPersonalizedAds?: number } | undefined)?.requestNonPersonalizedAds).toBeUndefined();
    }
  });

  it("starts Google's ad cookies denied in Europe and granted everywhere else", () => {
    const { page } = runHead(null, { region: "open" });
    const [europe, elsewhere] = consents(page);
    expect(europe).toEqual(["consent", "default", expect.objectContaining({ ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" })]);
    expect((europe[2] as { region: string[] }).region).toEqual(expect.arrayContaining(["DE", "GB", "CH", "CA-QC"]));
    expect(elsewhere).toEqual(["consent", "default", { ad_storage: "granted", ad_user_data: "granted", ad_personalization: "granted" }]);
  });

  it("outside Europe, before any choice: Analytics, Clarity and the pixel start", () => {
    const { added, page } = runHead(null, { region: "open" });
    expect(trackers(added)).toHaveLength(3);
    expect(consents(page)).toContainEqual(["consent", "default", { analytics_storage: "granted" }]);
    expect(page.__tithiRegion).toBe("open");
    expect(page.dispatchEvent).toHaveBeenCalledOnce();
    expect(page.fetch).not.toHaveBeenCalled();
  });

  it("in Europe, before any choice: only cookie-free Analytics pings", () => {
    const { added, page } = runHead(null, { region: "strict" });
    expect(trackers(added)).toHaveLength(1);
    expect(has(added, GA)).toBe(true);
    expect(consents(page)).toContainEqual(["consent", "default", { analytics_storage: "denied" }]);
    expect(gaOff(page)).toBe(false);
    expect(page.fbq).toBeUndefined();
    expect(page.clarity).toBeUndefined();
  });

  it("asks /api/region once a visit, keeps the answer, and treats a failure as Europe", async () => {
    const open = runHead(null, { answer: Promise.resolve({ ok: true, json: async () => ({ strict: false }) }) });
    expect(trackers(open.added)).toEqual([]);
    await settle();
    expect(open.page.fetch).toHaveBeenCalledWith("/api/region");
    expect(open.kept[REGION_KEY]).toBe("open");
    expect(trackers(open.added)).toHaveLength(3);

    const failed = runHead(null, { answer: Promise.reject(new Error("offline")) });
    await settle();
    expect(failed.page.__tithiRegion).toBe("strict");
    expect(failed.kept[REGION_KEY]).toBeUndefined();
    expect(trackers(failed.added)).toHaveLength(1);
  });

  it("applies a saved choice at once, wherever the visitor is, without asking where", () => {
    const counts = runHead(stored({ analytics: true }, Date.now()));
    expect(has(counts.added, GA) && has(counts.added, CLARITY)).toBe(true);
    expect(has(counts.added, PIXEL)).toBe(false);
    expect(consents(counts.page)).toContainEqual(["consent", "default", { analytics_storage: "granted" }]);
    // Clarity is told the visitor agreed, so it may set its cookies.
    expect((counts.page.clarity as { q: IArguments[] }).q.map((entry) => Array.from(entry))).toEqual([
      ["consentv2", { ad_Storage: "denied", analytics_Storage: "granted" }],
    ]);

    const pixel = runHead(stored({ ads: true }, Date.now()));
    expect(trackers(pixel.added)).toEqual([expect.stringMatching(PIXEL)]);

    const declined = runHead(stored({}, Date.now()), { region: "open" });
    expect(trackers(declined.added)).toEqual([]);
    for (const run of [counts, pixel, declined]) expect(run.page.fetch).not.toHaveBeenCalled();
  });

  it("an expired choice counts as none", () => {
    const { added } = runHead(stored({ analytics: true, ads: true }, Date.now() - 400 * DAY), { region: "strict" });
    expect(trackers(added)).toHaveLength(1);
  });

  it("in Europe, a yes turns on cookies, and a no stops the pings", () => {
    const yes = runHead(null, { region: "strict" });
    yes.tags(ACCEPT_ALL);
    yes.tags(ACCEPT_ALL);
    expect(consents(yes.page).filter((entry) => entry[1] === "update")).toEqual([
      ["consent", "update", { analytics_storage: "granted" }],
      ["consent", "update", { analytics_storage: "granted" }],
    ]);
    expect(yes.added.filter((src) => GA.test(src))).toHaveLength(1);
    expect(yes.added.filter((src) => CLARITY.test(src))).toHaveLength(1);
    expect(yes.added.filter((src) => PIXEL.test(src))).toHaveLength(1);
    expect(gaOff(yes.page)).toBe(false);

    const no = runHead(null, { region: "strict" });
    no.tags(DECLINE_ALL);
    expect(consents(no.page).at(-1)).toEqual(["consent", "update", { analytics_storage: "denied" }]);
    expect(gaOff(no.page)).toBe(true);
    expect(trackers(no.added)).toHaveLength(1);
  });
});
