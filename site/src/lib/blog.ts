import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { TranslatedLang } from "@/i18n/config";

import { isLive, summarise, type Post, type PostDetails, type PostSummary } from "./posts";

export { formatDate, type BlogImage, type Post, type PostDetails } from "./posts";

type Content = { builtAt: string; posts: PostDetails[] };

let content: Content | null = null;

/**
 * Reads a file built ahead of time by scripts/content.mjs, which runs before
 * `npm run build` and `npm run dev`, so pages only read files.
 */
function readBuilt<T>(path: string): T {
  try {
    return JSON.parse(readFileSync(join(process.cwd(), ".content", path), "utf8")) as T;
  } catch {
    throw new Error("Blog content is missing. Run `npm run content` in site/ (it normally runs before build and dev).");
  }
}

/** Every post's details, without the text: .content/blog.json. */
function read(): Content {
  if (content && process.env.NODE_ENV === "production") return content;
  content = readBuilt<Content>("blog.json");
  return content;
}

/** Every built post, newest first, including posts scheduled for later. */
export const getPosts = (): PostDetails[] => read().posts;

/** When the posts were built. The HTML shows what was live then, and the page's script catches up from there. */
export const getBuiltAt = (): string => read().builtAt;

// LISTS_REVALIDATE: the files that list live posts (the sitemap, the feed,
// llms.txt, llms-full.txt and the blog page) set `revalidate = 600`. Each is
// made at deploy, then made again on Vercel by the first visit more than 10
// minutes later, so a post that goes live at 6:00 AM joins them without a
// deploy. Next.js needs the number written out in each file: keep them in step.

/**
 * The time on the server, for pages that are made afresh on every visit:
 * Backstage, and posts opened from it. A page built ahead of time must not
 * use it, because its HTML is kept and the time in it would go stale.
 */
export const serverNow = (): number => Date.now();

/** Posts that are live at `now` (milliseconds; the moment the file is made, by default). */
export function getLivePosts(now = Date.now()): PostDetails[] {
  return getPosts().filter((post) => isLive(post, now));
}

/**
 * One post with its HTML and Markdown, from .content/posts/<slug>.json. Only
 * names listed in blog.json are read, so an address can't reach other files.
 */
export function getPost(slug: string): Post | undefined {
  if (!getPosts().some((post) => post.slug === slug)) return undefined;
  return readBuilt<Post>(join("posts", `${slug}.json`));
}

/** A post in another language, from .content/posts/<slug>.<lang>.json, if it has been translated. */
export function getTranslation(slug: string, lang: TranslatedLang): Post | undefined {
  if (!getPosts().some((post) => post.slug === slug && post.translations?.[lang])) return undefined;
  return readBuilt<Post>(join("posts", `${slug}.${lang}.json`));
}

/** The posts that exist in a language, newest first, with that language's title and description. */
export function getPostsIn(lang: TranslatedLang): PostDetails[] {
  return getPosts().flatMap((post) => {
    const version = post.translations?.[lang];
    return version ? [{ ...post, ...version }] : [];
  });
}

/**
 * Candidates for a list of the newest `count` posts: the newest live ones,
 * plus every scheduled post, since any of those may be live by the time
 * someone visits. The list itself picks by the visitor's clock.
 */
export function latestPosts(count: number, except = "", at = getBuiltAt()): PostSummary[] {
  const now = Date.parse(at);
  let live = 0;
  return getPosts()
    .filter((post) => post.slug !== except && (!isLive(post, now) || live++ < count))
    .map(summarise);
}
