import { describe, expect, it } from "vitest";

import { browsePosts, isLive, pageList, readBrowse, SHOW_ALL, sortOf, topics, withBrowse, type Browse, type PostSummary } from "@/lib/posts";
import { bestMatch, highlights, searchPosts, searchTerms } from "@/lib/search";

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
  const find = (browse: Partial<Browse>) => slugs(browsePosts(posts, { ...SHOW_ALL, ...browse }).posts);

  it("shows everything, newest first, by default", () => {
    expect(find({})).toEqual(["sunrise", "moves", "adhika"]);
  });

  it("needs every word, from the title, description, topics or headings, in any case", () => {
    expect(find({ q: "ADHIKA month" })).toEqual(["adhika"]);
    expect(find({ q: "chennai" })).toEqual(["sunrise"]);
  });

  it("filters by topic and sorts", () => {
    expect(find({ tag: "tithi", sort: "oldest" })).toEqual(["adhika", "moves"]);
    expect(find({ sort: "quickest" })).toEqual(["adhika", "moves", "sunrise"]);
  });

  it("counts topics, most used first", () => {
    expect(topics(posts)).toEqual([
      ["tithi", 2],
      ["birthday", 1],
      ["panchang", 1],
    ]);
  });

  it("keeps choices in the address, leaving defaults and other parts alone", () => {
    expect(readBrowse("tag=hindu+calendar&sort=toString&page=x")).toEqual({ q: "", tag: "hindu calendar", sort: "", page: 1 });
    expect(readBrowse("q=moon&page=3")).toEqual({ q: "moon", tag: "", sort: "", page: 3 });
    expect(withBrowse("utm_source=x&tag=old", { q: " moon ", tag: "", sort: "oldest", page: 2 })).toBe("utm_source=x&q=moon&sort=oldest&page=2");
    expect(withBrowse("q=moon&page=4", SHOW_ALL)).toBe("");
  });

  it("orders by best match while searching, and newest first otherwise", () => {
    expect(sortOf({ q: "", sort: "" })).toBe("newest");
    expect(sortOf({ q: "moon", sort: "" })).toBe("best");
    expect(sortOf({ q: "", sort: "best" })).toBe("newest");
    expect(sortOf({ q: "moon", sort: "oldest" })).toBe("oldest");
  });
});

describe("blog search", () => {
  const posts = [
    post("ekadashi", { title: "Ekādaśī: the eleventh day", date: "2026-01-01", tags: ["fasting"] }),
    post("purnima", { title: "Pūrṇimā and the full moon", date: "2026-02-01", tags: ["moon"] }),
    post("dwadashi", { title: "Breaking the fast on Dwadashi", date: "2026-03-01" }),
    post("birthday", { title: "Why your birthday moves", description: "A full moon birthday explained", date: "2026-04-01", tags: ["birthday"] }),
    post("calendar", { title: "Reading a panchang", description: "Mentions a birthday once", date: "2026-05-01", headings: ["Birthday dates"] }),
  ];
  const find = (q: string) => slugs(searchPosts(posts, q).posts);

  it("forgives accents and the usual English spellings of Indian words", () => {
    expect(find("ekadashi")).toEqual(["ekadashi"]);
    expect(find("EKADASI")).toEqual(["ekadashi"]);
    expect(find("poornima")).toEqual(["purnima"]);
    expect(find("dvadasi")).toEqual(["dwadashi"]);
  });

  it("forgives a typing slip in a longer word, and finds words still being typed", () => {
    expect(find("ekadsahi")).toEqual(["ekadashi"]);
    expect(find("purnma")).toEqual(["purnima"]);
    expect(find("birthd")).toEqual(["birthday", "calendar"]);
    expect(find("ekdsh")).toEqual([]);
  });

  it("puts title matches first, and newer posts first among equals", () => {
    expect(find("birthday")).toEqual(["birthday", "calendar"]);
    expect(find("full moon")).toEqual(["purnima", "birthday"]);
  });

  it("drops common words, and falls back to some of the words when no post has them all", () => {
    expect(find("why does my birthday move")).toEqual(["birthday"]);
    const found = searchPosts(posts, "birthday zodiac");
    expect(found.partial).toBe(true);
    expect(slugs(found.posts)).toEqual(["birthday", "calendar"]);
    expect(searchPosts(posts, "zodiac").posts).toEqual([]);
  });

  it("marks the words found, in the original text", () => {
    const terms = searchTerms("ekadashi");
    const title = "Ekādaśī: the eleventh day";
    expect(highlights(title, terms).map(([a, b]) => title.slice(a, b))).toEqual(["Ekādaśī"]);
    const moon = "Pūrṇimā and the full moon";
    expect(highlights(moon, searchTerms("purnma moon")).map(([a, b]) => moon.slice(a, b))).toEqual(["Pūrṇimā", "moon"]);
  });

  it("names the section or topic a match came from", () => {
    expect(bestMatch(["Intro", "Birthday dates"], searchTerms("birthday"))).toBe("Birthday dates");
    expect(bestMatch(["Intro"], searchTerms("birthday"))).toBeUndefined();
  });
});

describe("pages", () => {
  it("offers the first, the last and the pages around the current one", () => {
    expect(pageList(1, 1)).toEqual([1]);
    expect(pageList(1, 5)).toEqual([1, 2, null, 5]);
    expect(pageList(3, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(pageList(6, 20)).toEqual([1, null, 5, 6, 7, null, 20]);
    expect(pageList(20, 20)).toEqual([1, null, 19, 20]);
  });
});

describe("feed html", () => {
  it("keeps plain markup, and drops the site's own attributes and table wrappers", async () => {
    const { feedHtml } = await import("@/lib/feeds");
    const html = `<figure><img src="/a.webp" alt="A" loading="lazy" decoding="async" width="10" height="5" srcset="/a.webp 10w" sizes="100vw"></figure><div data-table="" tabindex="0" role="region" aria-label="Table"><table><tr><td>1</td></tr></table></div><pre class="shiki" style="color:#000" tabindex="0" role="group" aria-label="Code example"><code>x</code></pre>`;
    expect(feedHtml(html)).toBe(`<figure><img src="/a.webp" alt="A" width="10" height="5" srcset="/a.webp 10w"></figure><table><tr><td>1</td></tr></table><pre><code>x</code></pre>`);
  });
});
