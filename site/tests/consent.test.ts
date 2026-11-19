import { runInNewContext } from "node:vm";

import { describe, expect, it, vi } from "vitest";

import { ANALYTICS_SCRIPT } from "@/lib/analytics-script";
import { CONSENT_KEY, CONSENT_VERSION, parseChoice, type Choice } from "@/lib/consent";

// Google's own ad blocking recovery code needs a real page. These tests are about
// when things load, so it's left out.
vi.mock("@/lib/funding-choices", () => ({ FC_ERROR_PROTECTION: "" }));

const NOW = Date.UTC(2026, 10, 20);
const DAY = 86_400_000;
const stored = (choice: Partial<Choice>, at = NOW, v = CONSENT_VERSION) => JSON.stringify({ v, analytics: false, ads: false, ...choice, at });

/** Runs the head script in a bare page, and returns the scripts it added and the page's globals. */
function runHead(saved: string | null) {
  const added: string[] = [];
  const script = () => ({ async: false, crossOrigin: "", src: "" });
  const record = (element: { src: string }) => added.push(element.src);
  const page: Record<string, unknown> = {
    Date,
    JSON,
    setTimeout,
    frames: {},
    localStorage: { getItem: (key: string) => (key === CONSENT_KEY ? saved : null) },
    document: {
      createElement: script,
      head: { appendChild: record },
      body: { appendChild: () => undefined },
      getElementsByTagName: () => [{ parentNode: { insertBefore: record } }],
    },
  };
  page.window = page;
  runInNewContext(ANALYTICS_SCRIPT, page);
  const tags = page.__tithiTags as (choice: Choice) => void;
  return { added, page, tags };
}

const GA = /googletagmanager\.com\/gtag\/js/;
const ADSENSE = /pagead2\.googlesyndication\.com/;
const RECOVERY = /fundingchoicesmessages\.google\.com/;
const PIXEL = /connect\.facebook\.net/;

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

describe("the head script", () => {
  it("loads nothing before the visitor chooses", () => {
    const { added, page } = runHead(null);
    expect(added).toEqual([]);
    expect(page.dataLayer).toBeUndefined();
    expect(page.fbq).toBeUndefined();
  });

  it("loads nothing after a decline, or when the choice has expired", () => {
    expect(runHead(stored({})).added).toEqual([]);
    expect(runHead(stored({ analytics: true, ads: true }, Date.now() - 400 * DAY)).added).toEqual([]);
  });

  it("starts only Google Analytics for visit counts, with ad storage denied", () => {
    const { added, page } = runHead(stored({ analytics: true }, Date.now()));
    expect(added).toHaveLength(1);
    expect(added[0]).toMatch(GA);
    const consent = (page.dataLayer as IArguments[]).map((entry) => Array.from(entry)).find((entry) => entry[0] === "consent");
    expect(consent).toEqual(["consent", "default", { analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" }]);
  });

  it("starts AdSense, its ad blocking message and the Meta Pixel for ads, without Google Analytics", () => {
    const { added } = runHead(stored({ ads: true }, Date.now()));
    expect(added.some((src) => ADSENSE.test(src))).toBe(true);
    expect(added.some((src) => RECOVERY.test(src))).toBe(true);
    expect(added.some((src) => PIXEL.test(src))).toBe(true);
    expect(added.some((src) => GA.test(src))).toBe(false);
  });

  it("keeps every Google ad script away from visit counts alone", () => {
    const { added } = runHead(stored({ analytics: true }, Date.now()));
    expect(added.some((src) => ADSENSE.test(src) || RECOVERY.test(src) || PIXEL.test(src))).toBe(false);
  });

  it("starts tags the moment someone accepts in the box, and only once", () => {
    const { added, tags } = runHead(null);
    tags({ analytics: true, ads: true });
    tags({ analytics: true, ads: true });
    expect(added.filter((src) => GA.test(src))).toHaveLength(1);
    expect(added.filter((src) => ADSENSE.test(src))).toHaveLength(1);
    expect(added.filter((src) => PIXEL.test(src))).toHaveLength(1);
  });

  it("tells Google Analytics when ads are allowed later", () => {
    const { page, tags } = runHead(stored({ analytics: true }, Date.now()));
    tags({ analytics: true, ads: true });
    const updates = (page.dataLayer as IArguments[]).map((entry) => Array.from(entry)).filter((entry) => entry[0] === "consent" && entry[1] === "update");
    expect(updates).toEqual([["consent", "update", { ad_storage: "granted", ad_user_data: "granted", ad_personalization: "granted" }]]);
  });
});
