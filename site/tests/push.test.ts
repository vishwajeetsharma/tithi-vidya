import { describe, expect, it } from "vitest";

import { notificationFor, postsToAnnounce, readSubscription, subscriptionId } from "@/lib/push";

const sub = { endpoint: "https://fcm.googleapis.com/fcm/send/abc", keys: { p256dh: "BNcRdreALRFX", auth: "tBHItJI5svbpez7KI4CCXg" } };

describe("push subscriptions", () => {
  it("accepts what a browser sends, and nothing else", () => {
    expect(readSubscription({ ...sub, expirationTime: null })).toEqual(sub);
    expect(readSubscription({ ...sub, endpoint: "http://example.com/x" })).toBeNull();
    expect(readSubscription({ ...sub, endpoint: "not a url" })).toBeNull();
    expect(readSubscription({ ...sub, keys: { p256dh: "a b", auth: "x" } })).toBeNull();
    expect(readSubscription({ endpoint: sub.endpoint })).toBeNull();
    expect(readSubscription(null)).toBeNull();
  });

  it("stores each browser under one short id", () => {
    expect(subscriptionId(sub.endpoint)).toMatch(/^[0-9a-f]{64}$/);
    expect(subscriptionId(sub.endpoint)).toBe(subscriptionId(sub.endpoint));
  });
});

describe("which posts to announce", () => {
  const now = Date.parse("2026-11-10T00:45:00Z"); // 6:15 AM IST on 10 November
  const post = (slug: string, date: string, extra = {}) => ({ slug, liveAt: `${date}T00:30:00.000Z`, ...extra });
  const posts = [
    post("today", "2026-11-10"),
    post("yesterday", "2026-11-09"),
    post("last-week", "2026-11-03"),
    post("tomorrow", "2026-11-11"),
    post("draft", "2026-11-10", { draft: true }),
  ];
  const slugs = (list: { slug: string }[]) => list.map((p) => p.slug);

  it("announces posts that went live in the last two days, newest first", () => {
    expect(slugs(postsToAnnounce(posts, new Set(), now))).toEqual(["today", "yesterday"]);
  });

  it("never repeats a post, never announces old ones, scheduled ones or drafts", () => {
    expect(slugs(postsToAnnounce(posts, new Set(["today"]), now))).toEqual(["yesterday"]);
    expect(slugs(postsToAnnounce(posts, new Set(["today", "yesterday"]), now))).toEqual([]);
  });

  it("says what the notification shows", () => {
    expect(notificationFor({ slug: "a", title: "Moon days", description: "Why." }, "https://www.tithividya.org")).toEqual({
      title: "New on Tithi Vidya: Moon days",
      body: "Why.",
      url: "https://www.tithividya.org/blog/a",
      icon: "https://www.tithividya.org/icon-192.png",
      tag: "post-a",
    });
  });
});
