// How often each article is read, kept in the site's Redis database (lib/redis.ts):
//   views:all         a sorted set of post slug -> views since counting began
//   views:day:<date>  the same for one day (India time), kept 40 days, for "trending"
//
// A view is one article opened on the live site, sent by
// components/blog/ViewCounter.tsx to app/api/views. Only the article and the
// day are stored: no cookie, and nothing about the reader.

import { hasDatabase, pipeline, redis } from "./redis";

export const ALL_VIEWS = "views:all";
const dayKey = (date: string) => `views:day:${date}`;

/** Trending means the most read in this many days, today included. */
export const TRENDING_DAYS = 30;
/** Daily counts are kept a little longer than trending needs, then Redis deletes them. */
const KEEP_DAYS = 40;

const DAY = 86_400_000;

// en-CA writes dates as YYYY-MM-DD.
const indiaDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" });

/** The date in India at a moment, as YYYY-MM-DD. India has no daylight saving, so a day is always 24 hours. */
export const indiaDate = (at: number) => indiaDay.format(at);

/** The keys of the last `days` days in India, today first. */
export function lastDays(now: number, days = TRENDING_DAYS): string[] {
  return Array.from({ length: days }, (_, i) => dayKey(indiaDate(now - i * DAY)));
}

/** The commands that count one view of a post. */
export function viewCommands(slug: string, now: number): (string | number)[][] {
  const day = dayKey(indiaDate(now));
  return [
    ["ZINCRBY", ALL_VIEWS, 1, slug],
    ["ZINCRBY", day, 1, slug],
    ["EXPIRE", day, KEEP_DAYS * 86_400],
  ];
}

export async function countView(slug: string, now = Date.now()) {
  await pipeline(viewCommands(slug, now));
}

/** A sorted set as Redis answers, [slug, score, slug, score, ...], as a map. Pairs sent as their own arrays work too. */
export function scores(reply: unknown): Map<string, number> {
  const counts = new Map<string, number>();
  if (!Array.isArray(reply)) return counts;
  const flat: unknown[] = reply.flatMap((item) => (Array.isArray(item) ? item : [item]));
  for (let i = 0; i + 1 < flat.length; i += 2) {
    const slug = flat[i];
    const count = Number(flat[i + 1]);
    if (typeof slug === "string" && Number.isFinite(count) && count > 0) counts.set(slug, count);
  }
  return counts;
}

/** The slugs with the most views first, then A to Z. */
export const mostRead = (counts: Map<string, number>): [string, number][] =>
  [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

export type Views = { all: Map<string, number>; recent: Map<string, number> };

/** Every post's views, all time and in the last 30 days. For Backstage, which is made afresh on every visit. */
export async function readViews(now = Date.now()): Promise<Views> {
  const days = lastDays(now);
  const [all, recent] = await pipeline([
    ["ZRANGE", ALL_VIEWS, 0, -1, "WITHSCORES"],
    ["ZUNION", days.length, ...days, "WITHSCORES"],
  ]);
  return { all: scores(all), recent: scores(recent) };
}

async function loadTrending(now: number): Promise<[string, number][]> {
  if (!hasDatabase()) return [];
  try {
    const days = lastDays(now);
    // Pages built ahead of time call this, so it must not wait long: they
    // fall back to the newest posts when the database doesn't answer.
    return mostRead(scores(await redis(["ZUNION", days.length, ...days, "WITHSCORES"], { prebuilt: true, timeout: 3000 })));
  } catch (error) {
    console.error("views: couldn't read trending posts", error);
    return [];
  }
}

let kept: { at: number; trending: Promise<[string, number][]> } | undefined;

/**
 * The most read posts of the last 30 days, most first, with their views.
 * Empty when there's no database or it doesn't answer. A deploy builds many
 * pages at once, so the answer is kept for a minute.
 */
export function trendingViews(now = Date.now()): Promise<[string, number][]> {
  if (!kept || Math.abs(now - kept.at) > 60_000) kept = { at: now, trending: loadTrending(now) };
  return kept.trending;
}

let keptAll: { at: number; views: Promise<Map<string, number>> } | undefined;

/**
 * Every post's views since counting began, for "Most viewed" on the blog page.
 * Empty when there's no database or it doesn't answer. Kept for a minute.
 */
export function allViews(now = Date.now()): Promise<Map<string, number>> {
  if (!keptAll || Math.abs(now - keptAll.at) > 60_000) {
    keptAll = {
      at: now,
      views: hasDatabase()
        ? redis(["ZRANGE", ALL_VIEWS, 0, -1, "WITHSCORES"], { prebuilt: true, timeout: 3000 })
            .then(scores)
            .catch((error) => {
              console.error("views: couldn't read view counts", error);
              return new Map<string, number>();
            })
        : Promise.resolve(new Map<string, number>()),
    };
  }
  return keptAll.views;
}

/** Anything that announces itself as a robot, a crawler or a script. */
export const ROBOT = /bot|crawl|spider|slurp|archiver|preview|facebookexternalhit|headless|lighthouse|pagespeed|python|curl|wget|httpclient|okhttp|axios|node-fetch|go-http/i;
