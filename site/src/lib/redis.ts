// The site's Redis database (Upstash, from Vercel's Marketplace), reached over
// its REST API, so no database library is needed. Article notifications
// (lib/push.ts) and article view counts (lib/views.ts) keep their data here.

/** The database's address and token. Vercel's Upstash integration may name them either way. */
function database() {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  return url && token ? { url: url.replace(/\/+$/, ""), token } : null;
}

export const hasDatabase = () => database() !== null;

type Command = (string | number)[];

type Options = {
  /**
   * For pages built ahead of time, like the blog page. It leaves out
   * `cache: "no-store"`, which would make Next.js build the page afresh on
   * every visit. The answer is then fetched whenever the page is made: at
   * deploy, and each time it's made again.
   */
  prebuilt?: boolean;
  /** How long to wait, in milliseconds, before giving up. */
  timeout?: number;
};

async function send<T>(path: string, body: unknown, { prebuilt = false, timeout = 8000 }: Options): Promise<T> {
  const db = database();
  if (!db) throw new Error("redis: the database is not set up (UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN)");
  const response = await fetch(`${db.url}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${db.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeout),
    ...(prebuilt ? {} : { cache: "no-store" as const }),
  });
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok || (data && !Array.isArray(data) && data.error)) {
    throw new Error(`redis: the database said ${response.status} ${(!Array.isArray(data) && data?.error) || ""}`.trim());
  }
  return data;
}

/** Runs one Redis command. */
export async function redis<T = unknown>(command: Command, options: Options = {}): Promise<T> {
  const data = await send<{ result?: T }>("", command, options);
  return data.result as T;
}

/** Runs several commands in one request, in order, and returns each one's answer. */
export async function pipeline(commands: Command[], options: Options = {}): Promise<unknown[]> {
  const data = await send<{ result?: unknown; error?: string }[]>("/pipeline", commands, options);
  return data.map((answer) => {
    if (answer.error) throw new Error(`redis: the database said ${answer.error}`);
    return answer.result;
  });
}
