// Post types and helpers that also run in the browser: no file reading here.
// The server side, which reads the built posts, is lib/blog.ts.

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
  toc: { id: string; text: string }[];
  words: number;
  minutes: number;
  html: string;
  markdown: string;
};

/** What lists and search need. No article text, so the pages that carry it stay small. */
export type PostSummary = Pick<Post, "slug" | "title" | "description" | "date" | "liveAt" | "minutes" | "tags" | "cover"> & {
  headings: string[];
};

export const summarise = (post: Post): PostSummary => ({
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

// Search, topic and sort on the blog page.

export const SORTS = { newest: "Newest first", oldest: "Oldest first", quickest: "Quickest read" } as const;
export type Sort = keyof typeof SORTS;
export type Browse = { q: string; tag: string; sort: Sort };
export const SHOW_ALL: Browse = { q: "", tag: "", sort: "newest" };

/** Reads ?q=, ?tag= and ?sort= from the address. */
export function readBrowse(search: string): Browse {
  const params = new URLSearchParams(search);
  const sort = params.get("sort") ?? "";
  return { q: params.get("q") ?? "", tag: params.get("tag") ?? "", sort: Object.hasOwn(SORTS, sort) ? (sort as Sort) : "newest" };
}

/** The address's query with these choices in it. Defaults are left out, so a plain /blog stays plain, and anything else (like utm_source) is kept. */
export function withBrowse(search: string, { q, tag, sort }: Browse): string {
  const params = new URLSearchParams(search);
  const put = (key: string, value: string) => (value ? params.set(key, value) : params.delete(key));
  put("q", q.trim());
  put("tag", tag);
  put("sort", sort === "newest" ? "" : sort);
  return params.toString();
}

const newestFirst = (a: PostSummary, b: PostSummary) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title);

const ORDER: Record<Sort, (a: PostSummary, b: PostSummary) => number> = {
  newest: newestFirst,
  oldest: (a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title),
  quickest: (a, b) => a.minutes - b.minutes || newestFirst(a, b),
};

/** The posts to show. Every word typed must appear in the title, description, topics or section headings. */
export function browsePosts<T extends PostSummary>(posts: T[], { q, tag, sort }: Browse): T[] {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  return posts
    .filter((post) => {
      if (tag && !post.tags.includes(tag)) return false;
      const text = [post.title, post.description, ...post.tags, ...post.headings].join(" ").toLowerCase();
      return words.every((word) => text.includes(word));
    })
    .sort(ORDER[sort]);
}

/** Every topic with its number of posts, most used first. */
export function topics(posts: PostSummary[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const post of posts) for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}
