import type { Metadata } from "next";
import { draftMode } from "next/headers";
import Link from "next/link";

import { getBuiltAt, getPosts, serverNow, type PostDetails } from "@/lib/blog";
import { notificationFor } from "@/lib/push";
import { searchPosts } from "@/lib/search";

import { signIn, signOut } from "./actions";
import s from "./backstage.module.css";
import { PushPreview } from "./PushPreview";
import { MIN_PASSWORD } from "./settings";

// A private page: not linked from anywhere, not in the sitemap, kept out of
// search, and behind a password. See actions.ts for how signing in works.
export const metadata: Metadata = { title: "Backstage", robots: { index: false, follow: false } };

// What it shows depends on who is asking and on the time, so it's never built ahead of time.
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ wrong?: string; view?: string; q?: string; page?: string }> };

/**
 * Posts on each page. The list is cut on the server, so the page stays the
 * same size, and as quick, with a thousand posts as with ten.
 */
const PER_PAGE = 24;

const VIEWS = { scheduled: "Scheduled", live: "Live", all: "All" } as const;
type View = keyof typeof VIEWS;

const dayAndDate = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const istClock = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });
const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/** "in 17 hours", "tomorrow", "3 days ago". */
function fromNow(at: number, now: number): string {
  const minutes = Math.round((at - now) / 60_000);
  if (Math.abs(minutes) < 60) return relative.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 36) return relative.format(hours, "hour");
  return relative.format(Math.round(hours / 24), "day");
}

/** The address of this page for a view, a search and a page number. */
function address(view: View, q: string, page = 1): string {
  const query = new URLSearchParams();
  if (view !== "scheduled") query.set("view", view);
  if (q) query.set("q", q);
  if (page > 1) query.set("page", String(page));
  const text = query.toString();
  return text ? `/backstage?${text}` : "/backstage";
}

/** The smallest version of a cover: the list shows it about 170 px wide. */
const thumbnail = (cover: NonNullable<PostDetails["cover"]>) => cover.srcset.split(",")[0]?.trim().split(" ")[0] || cover.src;

export default async function Backstage({ searchParams }: Props) {
  const { isEnabled: signedIn } = await draftMode();
  const ready = (process.env.ADMIN_PASSWORD ?? "").length >= MIN_PASSWORD;
  const params = await searchParams;

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
              {params.wrong === "1" && (
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

  // Scheduled and live are told apart by the clock, not by the last deploy: a
  // post that went live this morning is live here too.
  const now = serverNow();
  const posts = getPosts(); // newest first
  const isScheduled = (post: PostDetails) => Date.parse(post.liveAt) > now;
  const lists: Record<View, PostDetails[]> = {
    scheduled: posts.filter(isScheduled).reverse(), // the next one to go live first
    live: posts.filter((post) => !isScheduled(post)),
    all: posts,
  };

  const view: View = params.view === "live" || params.view === "all" ? params.view : "scheduled";
  const q = (params.q ?? "").trim().slice(0, 100);
  const found = q
    ? searchPosts(
        lists[view].map((post) => ({ ...post, headings: post.toc.map((heading) => heading.text) })),
        q,
      ).posts
    : lists[view];
  const pages = Math.max(1, Math.ceil(found.length / PER_PAGE));
  const page = Math.min(pages, Math.max(1, Math.floor(Number(params.page)) || 1));
  const shown = found.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const next = lists.scheduled[0];

  return (
    <div className={s.page}>
      <div className={`${s.card} ${s.wide}`}>
        <div className={s.top}>
          <div>
            <p className="eyebrow">Tithi Vidya</p>
            <h1 className={`display ${s.title}`}>Backstage</h1>
          </div>
          <form action={signOut}>
            <button className="btn btnGhost" type="submit">
              Sign out
            </button>
          </form>
        </div>

        <p className={s.note}>
          {next ? (
            <>
              Next to go live: <strong>{next.title}</strong>, {fromNow(Date.parse(next.liveAt), now)} (
              {dayAndDate.format(new Date(`${next.date}T00:00:00Z`))}, 6:00 AM IST).{" "}
            </>
          ) : (
            <>Nothing is scheduled. </>
          )}
          Scheduled posts open in full in this browser until you sign out. Visitors see them from 6:00 AM India time on
          their date.
        </p>

        <nav className={s.tabs} aria-label="Which posts to show">
          {(Object.keys(VIEWS) as View[]).map((key) => (
            <Link key={key} className={s.tab} href={address(key, q)} aria-current={key === view ? "page" : undefined} prefetch={false}>
              {VIEWS[key]} <span>{lists[key].length.toLocaleString("en-IN")}</span>
            </Link>
          ))}
        </nav>

        <form className={s.search} action="/backstage" method="get" role="search">
          {view !== "scheduled" && <input type="hidden" name="view" value={view} />}
          <label className="visuallyHidden" htmlFor="backstage-search">
            Search {VIEWS[view].toLowerCase()} posts
          </label>
          <input
            id="backstage-search"
            className={s.field}
            type="search"
            name="q"
            defaultValue={q}
            placeholder={`Search ${VIEWS[view].toLowerCase()} posts by title, topic or word`}
          />
          <button className="btn btnPrimary" type="submit">
            Search
          </button>
        </form>

        <p className={s.count} role="status">
          {found.length === 0
            ? q
              ? `No ${view === "all" ? "" : `${VIEWS[view].toLowerCase()} `}posts match “${q}”.`
              : view === "scheduled"
                ? "Nothing is scheduled."
                : "No posts yet."
            : `${found.length.toLocaleString("en-IN")} post${found.length === 1 ? "" : "s"}${q ? ` for “${q}”` : ""}${pages > 1 ? `, page ${page} of ${pages}` : ""}`}
          {q && (
            <>
              {" "}
              <Link href={address(view, "")} prefetch={false}>
                Clear search
              </Link>
            </>
          )}
        </p>

        <ol className={s.list}>
          {shown.map((post) => {
            const liveAt = Date.parse(post.liveAt);
            const waiting = liveAt > now;
            const day = dayAndDate.format(new Date(`${post.date}T00:00:00Z`));
            // With no origin its addresses start at "/", so the pictures load from
            // whichever copy of the site this is, even before a deploy.
            const push = waiting ? notificationFor(post, "") : null;
            // Things worth fixing before a post goes out.
            const missing = [
              !post.cover && "No cover",
              waiting && !post.push.title && "No notification title",
              waiting && !post.push.body && "No notification text",
              waiting && !post.push.icon && "No notification picture",
            ].filter(Boolean);
            return (
              <li key={post.slug} className={s.row}>
                <Link className={s.thumb} href={`/blog/${post.slug}`} prefetch={false} tabIndex={-1} aria-hidden="true">
                  {post.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumbnail(post.cover)}
                      width={post.cover.width}
                      height={post.cover.height}
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <span>No cover</span>
                  )}
                </Link>
                <div className={s.rowMain}>
                  <p className={s.when}>
                    <span className={waiting ? s.scheduled : s.live}>{waiting ? "Scheduled" : "Live"}</span>
                    {waiting ? `${day}, 6:00 AM IST · ${fromNow(liveAt, now)}` : `Since ${day}`}
                  </p>
                  <h2 className={s.rowTitle}>
                    <Link href={`/blog/${post.slug}`} prefetch={false}>
                      {post.title}
                    </Link>
                  </h2>
                  <p className={s.meta}>
                    {post.minutes} min · {post.words.toLocaleString("en-IN")} words
                    {post.tags.length > 0 && ` · ${post.tags.join(", ")}`}
                  </p>
                  {missing.length > 0 && (
                    <ul className={s.missing} aria-label="To fix">
                      {missing.map((item) => (
                        <li key={String(item)}>{item}</li>
                      ))}
                    </ul>
                  )}
                  {push && (
                    <details className={s.push}>
                      <summary>Notification</summary>
                      <div className={s.pushCard}>
                        <div className={s.pushWords}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={push.icon} width={48} height={48} alt="" loading="lazy" />
                          <p>
                            <strong>{push.title}</strong>
                            {push.body}
                          </p>
                        </div>
                        {push.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img className={s.pushImage} src={push.image} width={1024} height={512} alt="" loading="lazy" />
                        )}
                      </div>
                      <PushPreview payload={push} />
                    </details>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        {pages > 1 && (
          <nav className={s.pager} aria-label="Pages">
            {page > 1 ? (
              <Link className="btn btnGhost" href={address(view, q, page - 1)} prefetch={false}>
                Previous
              </Link>
            ) : (
              <span />
            )}
            <span>
              Page {page} of {pages}
            </span>
            {page < pages ? (
              <Link className="btn btnGhost" href={address(view, q, page + 1)} prefetch={false}>
                Next
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}

        <p className={s.built}>Site last built {istClock.format(new Date(getBuiltAt()))} IST. Posts are as of that build.</p>
      </div>
    </div>
  );
}
