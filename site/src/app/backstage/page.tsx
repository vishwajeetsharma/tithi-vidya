import type { Metadata } from "next";
import { draftMode } from "next/headers";
import Link from "next/link";

import { formatDate, getBuiltAt, getPosts } from "@/lib/blog";

import { signIn, signOut } from "./actions";
import s from "./backstage.module.css";
import { MIN_PASSWORD } from "./settings";

// A private page: not linked from anywhere, not in the sitemap, kept out of
// search, and behind a password. See actions.ts for how signing in works.
export const metadata: Metadata = { title: "Backstage", robots: { index: false, follow: false } };

// What it shows depends on who is asking, so it's never built ahead of time.
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ wrong?: string }> };

export default async function Backstage({ searchParams }: Props) {
  const { isEnabled: signedIn } = await draftMode();
  const ready = (process.env.ADMIN_PASSWORD ?? "").length >= MIN_PASSWORD;
  const wrong = (await searchParams).wrong === "1";

  if (!signedIn) {
    return (
      <div className={s.page}>
        <div className={s.card}>
          <p className="eyebrow">Tithi Vidya</p>
          <h1 className={`display ${s.title}`}>Backstage</h1>
          {ready ? (
            <form action={signIn} className={s.form}>
              <label htmlFor="backstage-password">Password</label>
              <input
                id="backstage-password"
                className={s.field}
                type="password"
                name="password"
                autoComplete="current-password"
                required
                autoFocus
              />
              {wrong && (
                <p className={s.wrong} role="alert">
                  That&apos;s not it. Try again.
                </p>
              )}
              <button className="btn btnPrimary" type="submit">
                Open
              </button>
            </form>
          ) : (
            <p className={s.note}>
              Locked. Set ADMIN_PASSWORD ({MIN_PASSWORD} or more characters) in Vercel, under Settings, Environment
              Variables, then redeploy.
            </p>
          )}
        </div>
      </div>
    );
  }

  // The posts as of the last deploy. Scheduled ones were built too, so they can be previewed.
  const builtAt = getBuiltAt();
  const posts = getPosts();
  const upcoming = posts.filter((post) => post.liveAt > builtAt).sort((a, b) => a.date.localeCompare(b.date));
  const live = posts.filter((post) => post.liveAt <= builtAt).slice(0, 5);

  return (
    <div className={s.page}>
      <div className={`${s.card} ${s.wide}`}>
        <p className="eyebrow">Tithi Vidya</p>
        <h1 className={`display ${s.title}`}>Backstage</h1>
        <p className={s.note}>
          Scheduled posts show in full in this browser until you close it or sign out. Visitors still see
          &ldquo;not out yet&rdquo; until 6:00 AM India time on the post&apos;s date.
        </p>

        <h2 className={s.heading}>Scheduled</h2>
        {upcoming.length ? (
          <ul className={s.list}>
            {upcoming.map((post) => (
              <li key={post.slug}>
                <Link href={`/blog/${post.slug}`} prefetch={false}>
                  {post.title}
                </Link>
                <span>Goes live {formatDate(post.date)}, 6:00 AM IST</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className={s.note}>Nothing is scheduled.</p>
        )}

        <h2 className={s.heading}>Live</h2>
        <ul className={s.list}>
          {live.map((post) => (
            <li key={post.slug}>
              <Link href={`/blog/${post.slug}`} prefetch={false}>
                {post.title}
              </Link>
              <span>Out since {formatDate(post.date)}</span>
            </li>
          ))}
        </ul>

        <form action={signOut} className={s.signOut}>
          <button className="btn btnGhost" type="submit">
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
