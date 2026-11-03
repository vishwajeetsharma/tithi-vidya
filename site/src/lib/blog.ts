import { readFileSync } from "node:fs";
import { join } from "node:path";

/** A processed image: WebP widths with fixed dimensions, and a 1200x630 social card. */
export type BlogImage = { src: string; srcset: string; width: number; height: number; largest: string; og: string };

export type Post = {
  slug: string;
  title: string;
  description: string;
  date: string;
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

let posts: Post[] | null = null;

/**
 * Every post, newest first. Built ahead of time by scripts/content.mjs, which
 * runs before `npm run build` and `npm run dev`, so pages only read a file.
 */
export function getPosts(): Post[] {
  if (posts && process.env.NODE_ENV === "production") return posts;
  try {
    posts = (JSON.parse(readFileSync(join(process.cwd(), ".content/blog.json"), "utf8")) as { posts: Post[] }).posts;
  } catch {
    throw new Error("Blog content is missing. Run `npm run content` in site/ (it normally runs before build and dev).");
  }
  return posts;
}

export function getPost(slug: string): Post | undefined {
  return getPosts().find((post) => post.slug === slug);
}

const longDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export const formatDate = (iso: string) => longDate.format(new Date(`${iso}T00:00:00Z`));
