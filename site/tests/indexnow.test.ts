import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { INDEXNOW_KEY, indexNowRequest, justLive } from "@/lib/indexnow";

const ORIGIN = "https://www.tithividya.org";
const NOW = Date.parse("2026-11-20T01:00:00Z");

describe("IndexNow", () => {
  it("names the post that went live this morning, and the blog page", () => {
    const posts = [
      { slug: "what-is-tithi", liveAt: "2026-11-20T00:30:00Z" },
      { slug: "ekadashi-list", liveAt: "2026-11-19T00:30:00Z" }, // yesterday's run sent it
      { slug: "purnima-list", liveAt: "2026-11-23T00:30:00Z" }, // not live yet
      { slug: "a-draft", liveAt: "2026-11-20T00:30:00Z", draft: true },
    ];
    expect(justLive(posts, ORIGIN, NOW)).toEqual([`${ORIGIN}/blog/what-is-tithi`, `${ORIGIN}/blog`]);
  });

  it("sends nothing on a day with no new post", () => {
    expect(justLive([{ slug: "old", liveAt: "2026-11-01T00:30:00Z" }], ORIGIN, NOW)).toEqual([]);
  });

  it("builds the request with the key and where to check it", () => {
    expect(indexNowRequest([`${ORIGIN}/blog`], ORIGIN)).toEqual({
      host: "www.tithividya.org",
      key: INDEXNOW_KEY,
      keyLocation: `${ORIGIN}/${INDEXNOW_KEY}.txt`,
      urlList: [`${ORIGIN}/blog`],
    });
  });

  it("has the key file online, holding the same key", () => {
    expect(readFileSync(new URL(`../public/${INDEXNOW_KEY}.txt`, import.meta.url), "utf8").trim()).toBe(INDEXNOW_KEY);
  });
});
