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
  let npaWhenAdSenseAdded: unknown;
  const record = (element: { src: string }) => {
    added.push(element.src);
    if (/adsbygoogle\.js/.test(element.src)) npaWhenAdSenseAdded = (page.adsbygoogle as { requestNonPersonalizedAds?: number } | undefined)?.requestNonPersonalizedAds;
  };
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
  return { added, page, tags, npaWhenAdSenseAdded: () => npaWhenAdSenseAdded };
}

const GA = /googletagmanager\.com\/gtag\/js/;
const ADSENSE = /pagead2\.googlesyndication\.com/;
const RECOVERY = /fundingchoicesmessages\.google\.com/;
const PIXEL = /connect\.facebook\.net/;
const CLARITY = /clarity\.ms\/tag\/zgagx5rs8w/;

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

/** Whether the page asks Google for non-personalised ads (1) or allows personalised ones (0). */
const npa = (page: Record<string, unknown>) => (page.adsbygoogle as { requestNonPersonalizedAds?: number }).requestNonPersonalizedAds;
const trackers = (added: string[]) => added.filter((src) => GA.test(src) || CLARITY.test(src) || PIXEL.test(src));

describe("the head script", () => {
  it("before any choice: ads for everyone, non-personalised, and no trackers", () => {
    const { added, page } = runHead(null);
    expect(added.some((src) => RECOVERY.test(src))).toBe(true);
    expect(npa(page)).toBe(1);
    expect(trackers(added)).toEqual([]);
    expect(page.dataLayer).toBeUndefined();
    expect(page.fbq).toBeUndefined();
  });

  it("after a decline, or an expired choice, the same: non-personalised ads, no trackers", () => {
    for (const saved of [stored({}), stored({ analytics: true, ads: true }, Date.now() - 400 * DAY)]) {
      const { added, page } = runHead(saved);
      expect(npa(page)).toBe(1);
      expect(trackers(added)).toEqual([]);
    }
  });

  it("starts only Google Analytics and Clarity for visit counts, with ad storage denied", () => {
    const { added, page } = runHead(stored({ analytics: true }, Date.now()));
    expect(trackers(added)).toHaveLength(2);
    expect(added.some((src) => GA.test(src))).toBe(true);
    expect(added.some((src) => CLARITY.test(src))).toBe(true);
    expect(npa(page)).toBe(1);
    // Clarity is told the visitor agreed, so it may set its cookies.
    expect((page.clarity as { q: IArguments[] }).q.map((entry) => Array.from(entry))).toEqual([["consent"]]);
    const consent = (page.dataLayer as IArguments[]).map((entry) => Array.from(entry)).find((entry) => entry[0] === "consent");
    expect(consent).toEqual(["consent", "default", { analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" }]);
  });

  it("allows personalised ads and starts the Meta Pixel for ads, without Google Analytics", () => {
    const { added, page } = runHead(stored({ ads: true }, Date.now()));
    expect(npa(page)).toBe(0);
    expect(added.some((src) => PIXEL.test(src))).toBe(true);
    expect(added.some((src) => GA.test(src) || CLARITY.test(src))).toBe(false);
  });

  it("adds AdSense for everyone, once, after setting whether ads may be personalised", () => {
    for (const [saved, expected] of [[null, 1], [stored({}), 1], [stored({ analytics: true, ads: true }, Date.now()), 0]] as const) {
      const { added, tags, npaWhenAdSenseAdded } = runHead(saved);
      expect(npaWhenAdSenseAdded()).toBe(expected);
      tags({ analytics: true, ads: true });
      expect(added.filter((src) => ADSENSE.test(src))).toHaveLength(1);
    }
  });

  it("starts tags the moment someone accepts in the box, and only once", () => {
    const { added, page, tags } = runHead(null);
    tags({ analytics: true, ads: true });
    tags({ analytics: true, ads: true });
    expect(added.filter((src) => GA.test(src))).toHaveLength(1);
    expect(added.filter((src) => CLARITY.test(src))).toHaveLength(1);
    expect(added.filter((src) => PIXEL.test(src))).toHaveLength(1);
    expect(npa(page)).toBe(0);
  });

  it("tells Google Analytics when ads are allowed later", () => {
    const { page, tags } = runHead(stored({ analytics: true }, Date.now()));
    tags({ analytics: true, ads: true });
    const updates = (page.dataLayer as IArguments[]).map((entry) => Array.from(entry)).filter((entry) => entry[0] === "consent" && entry[1] === "update");
    expect(updates).toEqual([["consent", "update", { ad_storage: "granted", ad_user_data: "granted", ad_personalization: "granted" }]]);
  });
});
