// Browser notifications for new articles: the server side. The browser side
// is components/blog/NotifyButton.tsx and public/sw.js.
//
// Subscriptions live in a Redis database (Upstash, from Vercel's Marketplace),
// reached over its REST API, so no database library is needed:
//   push:subs  a hash of subscription id -> the browser's subscription JSON
//   push:sent  a set of post slugs already announced, so each goes out once
import { createHash } from "node:crypto";

export type Subscription = { endpoint: string; keys: { p256dh: string; auth: string } };

const BASE64URL = /^[A-Za-z0-9_-]+={0,2}$/;

/** A subscription as the browser sends it, checked, or null if it isn't one. */
export function readSubscription(body: unknown): Subscription | null {
  const data = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const keys = (data.keys && typeof data.keys === "object" ? data.keys : {}) as Record<string, unknown>;
  const { endpoint } = data;
  const { p256dh, auth } = keys;
  if (typeof endpoint !== "string" || endpoint.length > 1000) return null;
  try {
    if (new URL(endpoint).protocol !== "https:") return null;
  } catch {
    return null;
  }
  if (typeof p256dh !== "string" || typeof auth !== "string" || p256dh.length > 200 || auth.length > 100) return null;
  if (!BASE64URL.test(p256dh) || !BASE64URL.test(auth)) return null;
  return { endpoint, keys: { p256dh, auth } };
}

/** The id a subscription is stored under. The endpoint is long, so it is hashed. */
export const subscriptionId = (endpoint: string) => createHash("sha256").update(endpoint).digest("hex");

/** Posts are announced once, in a window after they go live, so turning this on never announces old posts. */
const WINDOW_HOURS = 48;
/** At most this many in one run, newest first. */
const MOST_AT_ONCE = 3;

/**
 * The posts to announce now: live, not drafts, not announced yet, and gone
 * live in the last two days. Scheduled posts are caught by the 6:00 AM run on
 * their date; a post published directly is caught by the next morning's run.
 */
export function postsToAnnounce<T extends { slug: string; liveAt: string; draft?: boolean }>(posts: T[], sent: Set<string>, now: number): T[] {
  const since = now - WINDOW_HOURS * 3600_000;
  return posts
    .filter((post) => {
      const at = Date.parse(post.liveAt);
      return !post.draft && !sent.has(post.slug) && at <= now && at > since;
    })
    .sort((a, b) => Date.parse(b.liveAt) - Date.parse(a.liveAt))
    .slice(0, MOST_AT_ONCE);
}

/** What the notification says. public/sw.js shows it. */
export function notificationFor(post: { slug: string; title: string; description: string }, origin: string) {
  return {
    title: `New on Tithi Vidya: ${post.title}`,
    body: post.description,
    url: `${origin}/blog/${post.slug}`,
    icon: `${origin}/icon-192.png`,
    tag: `post-${post.slug}`,
  };
}

/** The database's address and token. Vercel's Upstash integration may name them either way. */
function database() {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  return url && token ? { url, token } : null;
}

export const hasDatabase = () => database() !== null;

/** Runs one Redis command over Upstash's REST API. */
export async function redis<T = unknown>(command: (string | number)[]): Promise<T> {
  const db = database();
  if (!db) throw new Error("push: the database is not set up (UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN)");
  const response = await fetch(db.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${db.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  const data = (await response.json()) as { result?: T; error?: string };
  if (!response.ok || data.error) throw new Error(`push: database said ${response.status} ${data.error ?? ""}`.trim());
  return data.result as T;
}

export const SUBS = "push:subs";
export const SENT = "push:sent";
