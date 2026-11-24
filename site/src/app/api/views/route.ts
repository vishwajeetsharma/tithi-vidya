import { draftMode } from "next/headers";

import { getPosts } from "@/lib/blog";
import { isLive } from "@/lib/posts";
import { hasDatabase } from "@/lib/redis";
import { countView, ROBOT } from "@/lib/views";

// Counts one view of an article. components/blog/ViewCounter.tsx sends the
// post's slug, and nothing else, when an article is opened. See lib/views.ts.

/** The same answer every time, counted or not, so it tells nobody anything. */
const done = () => new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  // Only the live site counts: never `npm run dev`, a local build or a preview deployment.
  if (process.env.VERCEL_ENV !== "production" || !hasDatabase()) return done();
  // Not while signed in to Backstage: that's us, reading our own posts.
  if ((await draftMode()).isEnabled) return done();
  // Not robots, and only from this site's own pages.
  const agent = request.headers.get("user-agent") ?? "";
  const site = request.headers.get("sec-fetch-site");
  if (!agent || ROBOT.test(agent) || (site && site !== "same-origin")) return done();

  const slug = (await request.text()).slice(0, 200).trim();
  const post = getPosts().find((candidate) => candidate.slug === slug);
  if (!post || post.draft || !isLive(post, Date.now())) return done();
  try {
    await countView(slug);
  } catch (error) {
    console.error("views: couldn't count a view", error);
  }
  return done();
}
