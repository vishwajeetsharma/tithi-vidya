import { describe, expect, it } from "vitest";

import { browsePosts, isLive, readBrowse, SHOW_ALL, topics, withBrowse, type PostSummary } from "@/lib/posts";

const post = (slug: string, extra: Partial<PostSummary> = {}): PostSummary => ({
  slug,
  title: slug,
  description: "",
  date: "2026-11-03",
  liveAt: "2026-11-03T00:30:00.000Z",
  minutes: 4,
  tags: [],
  cover: null,
  headings: [],
  ...extra,
});

const slugs = (posts: PostSummary[]) => posts.map((p) => p.slug);

describe("scheduled posts", () => {
  it("are hidden until their go-live moment", () => {
    const later = { liveAt: "2026-11-10T00:30:00.000Z" };
    expect(isLive(later, Date.parse("2026-11-10T05:59:59+05:30"))).toBe(false);
    expect(isLive(later, Date.parse("2026-11-10T06:00:00+05:30"))).toBe(true);
  });
});

describe("searching and sorting the blog", () => {
  const posts = [
    post("moves", { title: "Why your birthday moves", date: "2026-11-03", minutes: 5, tags: ["tithi", "birthday"] }),
    post("adhika", { title: "The extra month", description: "Adhika masa explained", date: "2026-10-01", minutes: 3, tags: ["tithi"] }),
    post("sunrise", { title: "Days start at sunrise", date: "2026-12-01", minutes: 7, tags: ["panchang"], headings: ["Why Delhi and Chennai differ"] }),
  ];

  it("shows everything, newest first, by default", () => {
    expect(slugs(browsePosts(posts, SHOW_ALL))).toEqual(["sunrise", "moves", "adhika"]);
  });

  it("needs every word, from the title, description, topics or headings, in any case", () => {
    expect(slugs(browsePosts(posts, { ...SHOW_ALL, q: "ADHIKA month" }))).toEqual(["adhika"]);
    expect(slugs(browsePosts(posts, { ...SHOW_ALL, q: "chennai" }))).toEqual(["sunrise"]);
    expect(slugs(browsePosts(posts, { ...SHOW_ALL, q: "birthday sunrise" }))).toEqual([]);
  });

  it("filters by topic and sorts", () => {
    expect(slugs(browsePosts(posts, { ...SHOW_ALL, tag: "tithi", sort: "oldest" }))).toEqual(["adhika", "moves"]);
    expect(slugs(browsePosts(posts, { ...SHOW_ALL, sort: "quickest" }))).toEqual(["adhika", "moves", "sunrise"]);
  });

  it("counts topics, most used first", () => {
    expect(topics(posts)).toEqual([
      ["tithi", 2],
      ["birthday", 1],
      ["panchang", 1],
    ]);
  });

  it("keeps choices in the address, leaving defaults and other parts alone", () => {
    expect(readBrowse("tag=hindu+calendar&sort=toString")).toEqual({ q: "", tag: "hindu calendar", sort: "newest" });
    expect(withBrowse("utm_source=x&tag=old", { q: " moon ", tag: "", sort: "oldest" })).toBe("utm_source=x&q=moon&sort=oldest");
    expect(withBrowse("q=moon", SHOW_ALL)).toBe("");
  });
});
