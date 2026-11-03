import { readFileSync } from "node:fs";
import { join } from "node:path";

import { isLive, summarise, type Post, type PostSummary } from "./posts";

export { formatDate, type BlogImage, type Post } from "./posts";

type Content = { builtAt: string; posts: Post[] };

let content: Content | null = null;

/**
 * The posts, built ahead of time by scripts/content.mjs, which runs before
 * `npm run build` and `npm run dev`, so pages only read a file.
 */
function read(): Content {
  if (content && process.env.NODE_ENV === "production") return content;
  try {
    content = JSON.parse(readFileSync(join(process.cwd(), ".content/blog.json"), "utf8")) as Content;
  } catch {
    throw new Error("Blog content is missing. Run `npm run content` in site/ (it normally runs before build and dev).");
  }
  return content;
}

/** Every built post, newest first, including posts scheduled for later. */
export const getPosts = (): Post[] => read().posts;

/** When the posts were built. The HTML shows what was live then, and the page's script catches up from there. */
export const getBuiltAt = (): string => read().builtAt;

/** Posts that were live when the site was built. For files that can't check the clock: the sitemap, feed and llms.txt. */
export function getLivePosts(): Post[] {
  const builtAt = Date.parse(getBuiltAt());
  return getPosts().filter((post) => isLive(post, builtAt));
}

export function getPost(slug: string): Post | undefined {
  return getPosts().find((post) => post.slug === slug);
}

/**
 * Candidates for a list of the newest `count` posts: the newest live ones,
 * plus every scheduled post, since any of those may be live by the time
 * someone visits. The list itself picks by the visitor's clock.
 */
export function latestPosts(count: number, except = ""): PostSummary[] {
  const builtAt = Date.parse(getBuiltAt());
  let live = 0;
  return getPosts()
    .filter((post) => post.slug !== except && (!isLive(post, builtAt) || live++ < count))
    .map(summarise);
}
