import { trendingPosts } from "@/lib/blog";

// The most read articles of the last 30 days, for the "Trending" card under
// every article. Articles are built once per deploy, so the card loads this to
// stay current. Made again every 10 minutes, like the blog page.
export const revalidate = 600;

/** The top few, so the card can still pick one when the reader is on the top one already. */
const KEPT = 4;

export async function GET() {
  return Response.json({ posts: await trendingPosts(KEPT) });
}
