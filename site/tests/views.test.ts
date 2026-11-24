import { describe, expect, it } from "vitest";

import { slugFromSearch, isLinkSearch } from "@/lib/posts";
import { indiaDate, lastDays, mostRead, ROBOT, scores, viewCommands } from "@/lib/views";

describe("view counts", () => {
  it("count each view under its day in India", () => {
    // 11:00 PM on 24 November in London is already 25 November in India.
    const late = Date.parse("2026-11-24T23:00:00Z");
    expect(indiaDate(late)).toBe("2026-11-25");
    expect(viewCommands("kharmas", late)).toEqual([
      ["ZINCRBY", "views:all", 1, "kharmas"],
      ["ZINCRBY", "views:day:2026-11-25", 1, "kharmas"],
      ["EXPIRE", "views:day:2026-11-25", 40 * 86_400],
    ]);
  });

  it("add up the last 30 days for trending, today first", () => {
    const days = lastDays(Date.parse("2026-11-25T06:00:00+05:30"));
    expect(days).toHaveLength(30);
    expect(days[0]).toBe("views:day:2026-11-25");
    expect(days[1]).toBe("views:day:2026-11-24");
    expect(days[29]).toBe("views:day:2026-10-27");
  });

  it("read Redis's answer, flat or in pairs, most read first", () => {
    const flat = scores(["a", "3", "b", "10", "c", "3", "broken", "x", "zero", "0"]);
    expect(mostRead(flat)).toEqual([
      ["b", 10],
      ["a", 3],
      ["c", 3],
    ]);
    expect(scores([["a", 2]])).toEqual(new Map([["a", 2]]));
    expect(scores(null).size).toBe(0);
  });

  it("skip robots, not people", () => {
    expect(ROBOT.test("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")).toBe(true);
    expect(ROBOT.test("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/120.0 Safari/537.36")).toBe(true);
    expect(ROBOT.test("facebookexternalhit/1.1")).toBe(true);
    expect(ROBOT.test("Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36")).toBe(false);
    expect(ROBOT.test("Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1")).toBe(false);
  });
});

describe("finding a post by its link or slug", () => {
  it("reads the slug from a link, with or without the site, a language, a query or a section", () => {
    expect(slugFromSearch("https://www.tithividya.org/blog/kharmas")).toBe("kharmas");
    expect(slugFromSearch("tithividya.org/hi/blog/dev-uthani-ekadashi?utm_source=x#parana")).toBe("dev-uthani-ekadashi");
    expect(slugFromSearch(" /blog/purnima-list/ ")).toBe("purnima-list");
    expect(slugFromSearch("/blog/kharmas.md")).toBe("kharmas");
    expect(isLinkSearch("/blog/kharmas")).toBe(true);
  });

  it("takes a bare slug, and leaves sentences to the word search", () => {
    expect(slugFromSearch("Gita-Jayanti")).toBe("gita-jayanti");
    expect(slugFromSearch("kharmas")).toBe("kharmas");
    expect(slugFromSearch("when is kharmas")).toBeNull();
    expect(isLinkSearch("kharmas")).toBe(false);
  });
});
