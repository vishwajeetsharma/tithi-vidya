import { getPosts } from "@/lib/blog";
import { summarise } from "@/lib/posts";

export const dynamic = "force-static";

/**
 * Every post's card and search details, scheduled posts included. The blog
 * page loads this for search, topics and later pages, so its own HTML holds
 * only the first page and stays small as the blog grows.
 */
export function GET() {
  return Response.json({ posts: getPosts().map(summarise) });
}
