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
  author: string;
  tags: string[];
  draft: boolean;
  cover: (BlogImage & { alt: string }) | null;
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

export const SORTS = { best: "Best match", newest: "Newest first", oldest: "Oldest first", quickest: "Quickest read" } as const;
export type Sort = keyof typeof SORTS;
/** `sort` stays "" until someone picks one; see sortOf. */
export type Browse = { q: string; tag: string; sort: Sort | ""; page: number };
export const SHOW_ALL: Browse = { q: "", tag: "", sort: "", page: 1 };

/** The order in use: what was picked, or else best match while searching and newest first otherwise. */
export function sortOf({ q, sort }: Pick<Browse, "q" | "sort">): Sort {
  const searching = q.trim() !== "";
  if (!sort || (sort === "best" && !searching)) return searching ? "best" : "newest";
  return sort;
}

/** Reads ?q=, ?tag=, ?sort= and ?page= from the address. */
export function readBrowse(search: string): Browse {
  const params = new URLSearchParams(search);
  const sort = params.get("sort") ?? "";
  const page = Number(params.get("page"));
  return {
    q: params.get("q") ?? "",
    tag: params.get("tag") ?? "",
    sort: Object.hasOwn(SORTS, sort) ? (sort as Sort) : "",
    page: Number.isInteger(page) && page > 1 ? page : 1,
  };
}

/** The address's query with these choices in it. Defaults are left out, so a plain /blog stays plain, and anything else (like utm_source) is kept. */
export function withBrowse(search: string, { q, tag, sort, page }: Browse): string {
  const params = new URLSearchParams(search);
  const put = (key: string, value: string) => (value ? params.set(key, value) : params.delete(key));
  put("q", q.trim());
  put("tag", tag);
  put("sort", sort);
  put("page", page > 1 ? String(page) : "");
  return params.toString();
}

const newestFirst = (a: PostSummary, b: PostSummary) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title);

const ORDER: Record<Exclude<Sort, "best">, (a: PostSummary, b: PostSummary) => number> = {
  newest: newestFirst,
  oldest: (a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title),
  quickest: (a, b) => a.minutes - b.minutes || newestFirst(a, b),
};

/** The posts to show, with the terms to highlight. See searchPosts in lib/search for how words match. */
export function browsePosts<T extends PostSummary>(posts: T[], browse: Browse): Found<T> {
  const inTopic = browse.tag ? posts.filter((post) => post.tags.includes(browse.tag)) : posts;
  const found = searchPosts(inTopic, browse.q);
  const sort = sortOf(browse);
  return sort === "best" ? found : { ...found, posts: [...found.posts].sort(ORDER[sort]) };
}

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
