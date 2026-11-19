/**
 * IndexNow tells Bing, Yandex, Seznam, Naver and the other engines that share
 * it about a new page the moment it goes live, so they don't wait to find it.
 * Bing's index also feeds ChatGPT search and Copilot. Google doesn't use
 * IndexNow: for Google, the sitemap and "Request indexing" in Search Console
 * do this job.
 *
 * The key proves the site is ours: public/<INDEXNOW_KEY>.txt holds the same
 * text, and must stay online.
 */
export const INDEXNOW_KEY = "589f21737fb188409ed1074ef81578b1";

const ENDPOINT = "https://api.indexnow.org/indexnow";

/**
 * Posts that went live within this many hours. Posts go live at 6:00 AM IST,
 * the time of the daily run, and Vercel may start that run any time in the
 * hour. So the morning's post is under an hour old and yesterday's is over 24:
 * 12 takes only the new one.
 */
const WINDOW_HOURS = 12;

/** Addresses of posts that went live within the last day, plus the blog page that lists them. */
export function justLive(posts: { slug: string; liveAt: string; draft?: boolean }[], origin: string, now: number): string[] {
  const since = now - WINDOW_HOURS * 3600_000;
  const urls = posts
    .filter((post) => {
      const at = Date.parse(post.liveAt);
      return !post.draft && at <= now && at > since;
    })
    .map((post) => `${origin}/blog/${post.slug}`);
  return urls.length ? [...urls, `${origin}/blog`] : [];
}

/** The request IndexNow expects, for addresses on one site. */
export function indexNowRequest(urls: string[], origin: string) {
  return {
    host: new URL(origin).host,
    key: INDEXNOW_KEY,
    keyLocation: `${origin}/${INDEXNOW_KEY}.txt`,
    urlList: urls,
  };
}

/** Sends the addresses. Never throws: a failed ping must not stop the rest of the morning's work. */
export async function pingIndexNow(urls: string[], origin: string): Promise<{ sent: number; status?: number; problem?: string }> {
  if (urls.length === 0) return { sent: 0 };
  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(indexNowRequest(urls, origin)),
      signal: AbortSignal.timeout(10_000),
    });
    // 200 and 202 both mean it was accepted.
    return response.ok ? { sent: urls.length, status: response.status } : { sent: 0, status: response.status };
  } catch (error) {
    return { sent: 0, problem: error instanceof Error ? error.message : String(error) };
  }
}
