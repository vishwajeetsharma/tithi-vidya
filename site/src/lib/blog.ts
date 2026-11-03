import { readFileSync } from "node:fs";
import { join } from "node:path";

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

/** Posts that were live when the site was built. For files that can't check the clock: the sitemap, feed and llms.txt. */
export function getLivePosts(): PostDetails[] {
  const builtAt = Date.parse(getBuiltAt());
  return getPosts().filter((post) => isLive(post, builtAt));
}

/**
 * One post with its HTML and Markdown, from .content/posts/<slug>.json. Only
 * names listed in blog.json are read, so an address can't reach other files.
 */
export function getPost(slug: string): Post | undefined {
  if (!getPosts().some((post) => post.slug === slug)) return undefined;
  return readBuilt<Post>(join("posts", `${slug}.json`));
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
