"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

import { MIN_PASSWORD } from "./settings";

// Backstage is a private page for previewing scheduled posts. It has one
// password, ADMIN_PASSWORD, set in Vercel (and in .env.local for npm run dev).
// Signing in turns on Next.js draft mode: a cookie that lets this browser see
// scheduled posts in full before they go live. It lasts until the browser
// closes, or until "Sign out".

const digest = (text: string) => createHash("sha256").update(text).digest();

export async function signIn(form: FormData) {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (expected.length < MIN_PASSWORD) redirect("/backstage");
  const given = String(form.get("password") ?? "").slice(0, 200);
  // Compared as hashes in constant time, so how long the check takes gives nothing away.
  if (!timingSafeEqual(digest(given), digest(expected))) {
    await new Promise((resolve) => setTimeout(resolve, 800)); // slows down guessing
    redirect("/backstage?wrong=1");
  }
  (await draftMode()).enable();
  redirect("/backstage");
}

export async function signOut() {
  (await draftMode()).disable();
  redirect("/backstage");
}
