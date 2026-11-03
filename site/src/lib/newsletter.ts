// Checks for the newsletter signup, shared by the form and app/api/subscribe.

export type Signup = { email: string; name: string };

/** Plain enough for any real address; Brevo does the final check. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Reads a signup from the posted body, or returns a message in plain words. */
export function readSignup(body: unknown): Signup | { problem: string } {
  const data = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
  const name = typeof data.name === "string" ? data.name.trim().replace(/\s+/g, " ").slice(0, 60) : "";
  if (!email) return { problem: "Please enter your email address." };
  if (email.length > 254 || !EMAIL.test(email)) return { problem: "That email address doesn't look right. Please check it." };
  return { email, name };
}

/** A hidden field people never see. Bots fill it in, so those signups are quietly dropped. */
export const TRAP_FIELD = "website";

export type SubscribeResult = { ok: true; confirm: boolean } | { ok: false; problem: string };
