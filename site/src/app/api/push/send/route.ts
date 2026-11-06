import { sendNotification, setVapidDetails, WebPushError } from "web-push";

import { getPosts } from "@/lib/blog";
import { hasDatabase, notificationFor, postsToAnnounce, readSubscription, redis, SENT, SUBS } from "@/lib/push";
import { CONTACT_EMAIL, siteUrl } from "@/lib/site";

// Sends a notification for each article that has just gone live. Vercel runs
// this every day at 6:00 AM India time (crons in site/vercel.json), when
// scheduled posts go live. It reads the post list built with the site, so a
// new post needs no extra step. next.config.ts bundles that list with it.
//
// Vercel calls it with "Authorization: Bearer <CRON_SECRET>". To send by hand
// after publishing directly, run:
//   curl -H "Authorization: Bearer $CRON_SECRET" https://www.tithividya.org/api/push/send

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const reply = (body: object, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** How many notifications go out at the same moment. */
const AT_ONCE = 50;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return reply({ ok: false }, 401);
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey || !hasDatabase()) {
    return reply({ ok: false, problem: "Set NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY and the database first." }, 503);
  }
  setVapidDetails(`mailto:${CONTACT_EMAIL}`, publicKey, privateKey);

  const sent = new Set(await redis<string[]>(["SMEMBERS", SENT]));
  const posts = postsToAnnounce(getPosts(), sent, Date.now());
  if (posts.length === 0) return reply({ ok: true, announced: [] });

  // HGETALL answers [id, subscription, id, subscription, ...].
  const stored = await redis<string[]>(["HGETALL", SUBS]);
  const subscribers: { id: string; subscription: NonNullable<ReturnType<typeof readSubscription>> }[] = [];
  for (let i = 0; i < stored.length; i += 2) {
    const subscription = readSubscription(JSON.parse(stored[i + 1]));
    if (subscription) subscribers.push({ id: stored[i], subscription });
  }

  const origin = siteUrl().origin;
  const gone = new Set<string>();
  let delivered = 0;
  let failed = 0;
  for (const post of posts) {
    const payload = JSON.stringify(notificationFor(post, origin));
    for (let i = 0; i < subscribers.length; i += AT_ONCE) {
      const batch = subscribers.slice(i, i + AT_ONCE).filter((s) => !gone.has(s.id));
      const results = await Promise.allSettled(batch.map((s) => sendNotification(s.subscription, payload, { TTL: 86400, urgency: "normal" })));
      results.forEach((result, j) => {
        if (result.status === "fulfilled") return void delivered++;
        // 404 and 410 mean the person turned notifications off or the browser dropped them.
        const status = result.reason instanceof WebPushError ? result.reason.statusCode : 0;
        if (status === 404 || status === 410) gone.add(batch[j].id);
        else failed++;
      });
    }
    // Marked even with no subscribers, so a post is never announced late.
    await redis(["SADD", SENT, post.slug]);
  }
  if (gone.size) await redis(["HDEL", SUBS, ...gone]);

  const summary = { ok: true, announced: posts.map((p) => p.slug), subscribers: subscribers.length, delivered, failed, removed: gone.size };
  console.log(`push: ${JSON.stringify(summary)}`);
  return reply(summary);
}
