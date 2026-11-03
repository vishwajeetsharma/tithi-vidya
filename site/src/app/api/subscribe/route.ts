import { readSignup, TRAP_FIELD, type SubscribeResult } from "@/lib/newsletter";

// Adds a newsletter signup to Brevo. This is the site's only server code: the
// API key stays here, on Vercel, and never reaches the browser.
//
//   BREVO_API_KEY           required, from Brevo > SMTP & API > API keys
//   BREVO_LIST_ID           required, the number of the list to add people to
//   BREVO_DOI_TEMPLATE_ID   optional: send a "please confirm" email first,
//                           using this Brevo double opt-in template
const BREVO = "https://api.brevo.com/v3";

const reply = (result: SubscribeResult, status = 200) => Response.json(result, { status, headers: { "Cache-Control": "no-store" } });
const SORRY = "Sorry, that didn't work. Please try again in a minute.";

export async function POST(request: Request) {
  const key = process.env.BREVO_API_KEY;
  const listId = Number(process.env.BREVO_LIST_ID);
  const confirmTemplate = Number(process.env.BREVO_DOI_TEMPLATE_ID) || 0;
  if (!key || !Number.isInteger(listId) || listId <= 0) {
    console.error("subscribe: set BREVO_API_KEY and BREVO_LIST_ID");
    return reply({ ok: false, problem: "Signups are not open yet. Please try again later." }, 503);
  }

  // Only the site's own pages may post here.
  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin && origin !== url.origin) return reply({ ok: false, problem: SORRY }, 403);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return reply({ ok: false, problem: SORRY }, 400);
  }
  if ((body as Record<string, unknown> | null)?.[TRAP_FIELD]) return reply({ ok: true, confirm: false });
  const signup = readSignup(body);
  if ("problem" in signup) return reply({ ok: false, problem: signup.problem }, 400);

  const attributes = signup.name ? { FIRSTNAME: signup.name } : undefined;
  const [path, payload] = confirmTemplate
    ? [
        "/contacts/doubleOptinConfirmation",
        { email: signup.email, includeListIds: [listId], templateId: confirmTemplate, redirectionUrl: `${url.origin}/subscribed`, attributes },
      ]
    : ["/contacts", { email: signup.email, listIds: [listId], updateEnabled: true, attributes }];

  try {
    const response = await fetch(`${BREVO}${path}`, {
      method: "POST",
      headers: { "api-key": key, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });
    if (response.ok) return reply({ ok: true, confirm: Boolean(confirmTemplate) });
    // Brevo's reason, for the Vercel logs. It never includes the key.
    console.error(`subscribe: Brevo said ${response.status}: ${(await response.text()).slice(0, 300)}`);
  } catch (error) {
    console.error(`subscribe: could not reach Brevo: ${(error as Error).message}`);
  }
  return reply({ ok: false, problem: SORRY }, 502);
}
