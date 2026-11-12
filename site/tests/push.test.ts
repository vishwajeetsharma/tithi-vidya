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

  it("says what the notification shows, with the post's own words and pictures", () => {
    const origin = "https://www.tithividya.org";
    const plain = { slug: "a", title: "Moon days", description: "Why.", liveAt: "2026-11-10T00:30:00.000Z" };
    // Without its own words or pictures: the title, the description and the site's icon.
    expect(notificationFor(plain, origin)).toEqual({
      title: "Moon days",
      body: "Why.",
      url: `${origin}/blog/a?utm_source=push&utm_medium=notification&utm_campaign=a`,
      icon: `${origin}/icon-192.png`,
      badge: `${origin}/badge-96.png`,
      tag: "post-a",
      timestamp: Date.parse("2026-11-10T00:30:00.000Z"),
    });
    const rich = notificationFor(
      { ...plain, push: { title: "Holi is on 22 March", body: "Bonfire the night before.", image: "/blog-media/a-push.jpg", icon: "/blog-media/a-icon.jpg" } },
      origin,
    );
    expect(rich).toMatchObject({
      title: "Holi is on 22 March",
      body: "Bonfire the night before.",
      image: `${origin}/blog-media/a-push.jpg`,
      icon: `${origin}/blog-media/a-icon.jpg`,
    });
  });

  it("cuts long words at a word, so nothing ends mid-word on a lock screen", () => {
    const long = notificationFor(
      { slug: "a", title: "A very long title ".repeat(8).trim(), description: "Some words here. ".repeat(20).trim(), liveAt: "2026-11-10T00:30:00.000Z" },
      "https://www.tithividya.org",
    );
    expect(long.title.length).toBeLessThanOrEqual(65);
    expect(long.title.endsWith("…")).toBe(true);
    expect(long.title).not.toMatch(/\s…$/);
    expect(long.body.length).toBeLessThanOrEqual(180);
  });
});
