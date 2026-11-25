// Post types and helpers that also run in the browser: no file reading here.
// The server side, which reads the built posts, is lib/blog.ts.

import { searchPosts, type Found } from "./search";

/** A processed image: WebP widths with fixed dimensions, and a 1200x630 social card. */
export type BlogImage = { src: string; srcset: string; width: number; height: number; largest: string; og: string };

export type Post = {
  slug: string;
  title: string;
  description: string;
  date: string;
  /** 6:00 AM IST on `date`, as an ISO time. Until then the post is scheduled. */
  liveAt: string;
  updated: string;
  /** The authors' names, joined with commas: for feeds and plain text. */
  author: string;
  /** Each author, with a link: a full address, a page on this site, or "" for none. See `author:` in content/blog/README.md. */
  authors: { name: string; url: string }[];
  tags: string[];
  draft: boolean;
  cover: (BlogImage & { alt: string }) | null;
  /** The pictures in the article's text, in order: each one's largest size and its alt text. For the sitemap. */
  images: { src: string; alt: string }[];
  /**
   * What a notification for the post shows: `pushTitle` and `pushBody` from the
   * post (empty means its title and description), a wide picture cut from the
   * cover, and a square one from `coverArt`. Either picture can be "".
   */
  push: { title: string; body: string; image: string; icon: string };
  /** The languages the post is translated into, with each one's title and description. See src/i18n. */
  translations?: Partial<Record<string, { title: string; description: string; minutes: number }>>;
  toc: { id: string; text: string }[];
  words: number;
  minutes: number;
  html: string;
  markdown: string;
};

/** A post without its text, as .content/blog.json lists it. Pages that show many posts read only these. */
export type PostDetails = Omit<Post, "html" | "markdown">;

/** What lists and search need. No article text, so the pages that carry it stay small. */
export type PostSummary = Pick<Post, "slug" | "title" | "description" | "date" | "liveAt" | "minutes" | "tags" | "cover"> & {
  headings: string[];
};

export const summarise = (post: PostDetails): PostSummary => ({
  slug: post.slug,
  title: post.title,
  description: post.description,
  date: post.date,
  liveAt: post.liveAt,
  minutes: post.minutes,
  tags: post.tags,
  cover: post.cover,
  headings: post.toc.map((heading) => heading.text),
});

/** While writing (npm run dev), scheduled posts show straight away. */
export const PREVIEW = process.env.NODE_ENV === "development";

/** Whether a post is out at `now` (milliseconds since 1970). */
export const isLive = (post: { liveAt: string }, now: number) => PREVIEW || Date.parse(post.liveAt) <= now;

const longDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export const formatDate = (iso: string) => longDate.format(new Date(`${iso}T00:00:00Z`));

// Search, topic, sort and pages on the blog page.

/** Articles on each page of the blog: four rows of three on a wide screen. */
export const PAGE_SIZE = 12;

export const SORTS = { best: "Best match", read: "Most read", newest: "Newest first", oldest: "Oldest first", quickest: "Quickest read" } as const;
export type Sort = keyof typeof SORTS;
/**
 * `sort` stays "" until someone picks one; see sortOf. `show` is "trending"
 * for the most read articles of the last 30 days, in place of a topic.
 */
export type Browse = { q: string; tag: string; sort: Sort | ""; page: number; show: "" | "trending" };
export const SHOW_ALL: Browse = { q: "", tag: "", sort: "", page: 1, show: "" };

/** How many articles Trending shows. */
export const TRENDING_COUNT = 10;

/**
 * The order in use: what was picked, or else best match while searching,
 * most read for trending, and newest first otherwise. "Best match" needs a
 * search, and "Most read" needs trending.
 */
export function sortOf({ q, sort, show = "" }: Pick<Browse, "q" | "sort"> & { show?: Browse["show"] }): Sort {
  const searching = q.trim() !== "";
  const fallback = searching ? "best" : show ? "read" : "newest";
  if (!sort || (sort === "best" && !searching) || (sort === "read" && !show)) return fallback;
  return sort;
}

/** Reads ?q=, ?tag=, ?sort=, ?page= and ?show= from the address. */
export function readBrowse(search: string): Browse {
  const params = new URLSearchParams(search);
  const sort = params.get("sort") ?? "";
  const page = Number(params.get("page"));
  const show = params.get("show") === "trending" ? "trending" : "";
  return {
    q: params.get("q") ?? "",
    // Trending takes the place of a topic.
    tag: show ? "" : (params.get("tag") ?? ""),
    sort: Object.hasOwn(SORTS, sort) ? (sort as Sort) : "",
    page: Number.isInteger(page) && page > 1 ? page : 1,
    show,
  };
}

/** The address's query with these choices in it. Defaults are left out, so a plain /blog stays plain, and anything else (like utm_source) is kept. */
export function withBrowse(search: string, { q, tag, sort, page, show }: Browse): string {
  const params = new URLSearchParams(search);
  const put = (key: string, value: string) => (value ? params.set(key, value) : params.delete(key));
  put("q", q.trim());
  put("tag", tag);
  put("show", show);
  put("sort", sort);
  put("page", page > 1 ? String(page) : "");
  return params.toString();
}

const newestFirst = (a: PostSummary, b: PostSummary) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title);

const ORDER: Record<Exclude<Sort, "best" | "read">, (a: PostSummary, b: PostSummary) => number> = {
  newest: newestFirst,
  oldest: (a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title),
  quickest: (a, b) => a.minutes - b.minutes || newestFirst(a, b),
};

/**
 * The posts to show, with the terms to highlight. See searchPosts in lib/search
 * for how words match. `trending` is the most read slugs, most first: Trending
 * shows those, in that order.
 */
export function browsePosts<T extends PostSummary>(posts: T[], browse: Browse, trending: string[] = []): Found<T> {
  const bySlug = new Map(posts.map((post) => [post.slug, post]));
  const inView = browse.show
    ? trending.flatMap((slug) => bySlug.get(slug) ?? []).slice(0, TRENDING_COUNT)
    : browse.tag
      ? posts.filter((post) => post.tags.includes(browse.tag))
      : posts;
  const found = searchPosts(inView, browse.q);
  const sort = sortOf(browse);
  if (sort === "best") return found;
  if (sort === "read") {
    const rank = new Map(trending.map((slug, i) => [slug, i]));
    return { ...found, posts: [...found.posts].sort((a, b) => (rank.get(a.slug) ?? Infinity) - (rank.get(b.slug) ?? Infinity)) };
  }
  return { ...found, posts: [...found.posts].sort(ORDER[sort]) };
}

/**
 * The post a search names directly, if it does: a link to it (with or without
 * the site, a language, a query or a #section) or its slug. "kharmas",
 * "/blog/kharmas" and "https://www.tithividya.org/hi/blog/kharmas?x=1" all
 * name kharmas. Plain words come back as a slug too, so check it exists.
 */
export function slugFromSearch(query: string): string | null {
  const text = query.trim();
  const link = text.match(/\/blog\/([a-z0-9]+(?:-[a-z0-9]+)*)/i);
  if (link) return link[1].toLowerCase();
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(text) ? text.toLowerCase() : null;
}

/** Whether a search is a link, which should find only the post it names. */
export const isLinkSearch = (query: string) => /\/blog\//i.test(query);

/** Every topic with its number of posts, most used first. */
export function topics(posts: { tags: string[] }[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const post of posts) for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

/** The page numbers to offer: the first, the last, and the ones either side of the current page, with null for a gap. */
export function pageList(page: number, pages: number): (number | null)[] {
  const wanted = [...new Set([1, page - 1, page, page + 1, pages])].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  const list: (number | null)[] = [];
  for (const n of wanted) {
    const last = list.at(-1);
    // A gap of one page shows that page, since "…" would take the same room.
    if (typeof last === "number" && n - last === 2) list.push(last + 1);
    else if (typeof last === "number" && n - last > 2) list.push(null);
    list.push(n);
  }
  return list;
}
