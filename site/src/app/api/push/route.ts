import { hasDatabase, readSubscription, redis, subscriptionId, SUBS } from "@/lib/push";

// Saves or removes a browser's notification subscription. The subscription is
// an address at the browser maker's push service and two keys; it holds
// nothing about the person.

const reply = (body: object, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** Only the site's own pages may post here, and only small JSON bodies. */
async function readBody(request: Request): Promise<unknown | Response> {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return reply({ ok: false }, 403);
  if (Number(request.headers.get("content-length") ?? 0) > 4000) return reply({ ok: false }, 413);
  try {
    return await request.json();
  } catch {
    return reply({ ok: false }, 400);
  }
}

export async function POST(request: Request) {
  if (!hasDatabase()) return reply({ ok: false, problem: "Notifications are not set up yet." }, 503);
  const body = await readBody(request);
  if (body instanceof Response) return body;
  const subscription = readSubscription(body);
  if (!subscription) return reply({ ok: false }, 400);
  try {
    await redis(["HSET", SUBS, subscriptionId(subscription.endpoint), JSON.stringify(subscription)]);
    return reply({ ok: true });
  } catch (error) {
    console.error((error as Error).message);
    return reply({ ok: false }, 502);
  }
}

export async function DELETE(request: Request) {
  if (!hasDatabase()) return reply({ ok: true });
  const body = await readBody(request);
  if (body instanceof Response) return body;
  const endpoint = (body as { endpoint?: unknown } | null)?.endpoint;
  if (typeof endpoint !== "string" || endpoint.length > 1000) return reply({ ok: false }, 400);
  try {
    await redis(["HDEL", SUBS, subscriptionId(endpoint)]);
    return reply({ ok: true });
  } catch (error) {
    console.error((error as Error).message);
    return reply({ ok: false }, 502);
  }
}
