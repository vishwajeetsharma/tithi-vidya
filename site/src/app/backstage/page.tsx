import type { Metadata } from "next";
import { draftMode } from "next/headers";
import Link from "next/link";

import { getBuiltAt, getPosts, serverNow, type PostDetails } from "@/lib/blog";
import { isLinkSearch, slugFromSearch } from "@/lib/posts";
import { notificationFor } from "@/lib/push";
import { hasDatabase } from "@/lib/redis";
import { searchPosts } from "@/lib/search";
import { readViews, TRENDING_DAYS, type Views } from "@/lib/views";

import { signIn, signOut } from "./actions";
import s from "./backstage.module.css";
import { PushPreview } from "./PushPreview";
import { MIN_PASSWORD } from "./settings";

// A private page: not linked from anywhere, not in the sitemap, kept out of
// search, and behind a password. See actions.ts for how signing in works.
export const metadata: Metadata = { title: "Backstage", robots: { index: false, follow: false } };

// What it shows depends on who is asking and on the time, so it's never built ahead of time.
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ wrong?: string; view?: string; q?: string; page?: string; by?: string }> };

/**
 * Posts on each page. The list is cut on the server, so the page stays the
 * same size, and as quick, with a thousand posts as with ten.
 */
const PER_PAGE = 24;

/** The lists, each a tab: its label, and what its posts are called in sentences. */
const TABS = {
  scheduled: { label: "Scheduled", posts: "scheduled posts" },
  live: { label: "Live", posts: "live posts" },
  all: { label: "All", posts: "posts" },
  read: { label: "Most read", posts: "live posts" },
} as const;
type Tab = keyof typeof TABS;

/** Most read counts every view, or only the last 30 days'. */
type By = "all" | "month";

const dayAndDate = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const istClock = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });
const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const number = (n: number) => n.toLocaleString("en-IN");

/** "in 17 hours", "tomorrow", "3 days ago". */
function fromNow(at: number, now: number): string {
  const minutes = Math.round((at - now) / 60_000);
  if (Math.abs(minutes) < 60) return relative.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 36) return relative.format(hours, "hour");
  return relative.format(Math.round(hours / 24), "day");
}

/** The address of this page for a tab, a search, a page number and, on Most read, the days counted. */
function address(tab: Tab, q: string, page = 1, by: By = "all"): string {
  const query = new URLSearchParams();
  if (tab !== "scheduled") query.set("view", tab);
  if (tab === "read" && by === "month") query.set("by", by);
  if (q) query.set("q", q);
  if (page > 1) query.set("page", String(page));
  const text = query.toString();
  return text ? `/backstage?${text}` : "/backstage";
}

/**
 * The posts a search finds. A link to a post, or its slug, finds that post
 * alone; anything else finds posts with the words, as the blog's search does.
 */
function find(posts: PostDetails[], q: string): PostDetails[] {
  if (!q) return posts;
  const named = slugFromSearch(q);
  const exact = named ? posts.filter((post) => post.slug === named) : [];
  if (exact.length || isLinkSearch(q)) return exact;
  return searchPosts(
    posts.map((post) => ({ ...post, headings: post.toc.map((heading) => heading.text) })),
    q,
  ).posts;
}

/** Every post's views, or why there are none to show. */
async function loadViews(): Promise<{ views: Views | null; problem: string }> {
  if (!hasDatabase()) return { views: null, problem: "View counts need the Upstash database: set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN." };
  try {
    return { views: await readViews(serverNow()), problem: "" };
  } catch (error) {
    console.error("backstage: couldn't read view counts", error);
    return { views: null, problem: "The database didn't answer, so view counts aren't shown. Try again in a minute." };
  }
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
  const live = posts.filter((post) => !isScheduled(post));

  const tab: Tab = params.view === "live" || params.view === "all" || params.view === "read" ? params.view : "scheduled";
  const by: By = params.by === "month" ? "month" : "all";
  const { views, problem } = await loadViews();
  const viewsOf = (post: PostDetails) => ({ all: views?.all.get(post.slug) ?? 0, recent: views?.recent.get(post.slug) ?? 0 });
  const counted = (post: PostDetails) => (by === "month" ? viewsOf(post).recent : viewsOf(post).all);

  const lists: Record<Tab, PostDetails[]> = {
    scheduled: posts.filter(isScheduled).reverse(), // the next one to go live first
    live,
    all: posts,
    // Most read first; posts with the same views, newest first.
    read: [...live].sort((a, b) => counted(b) - counted(a)),
  };

  const q = (params.q ?? "").trim().slice(0, 300);
  const found = find(lists[tab], q);
  const pages = Math.max(1, Math.ceil(found.length / PER_PAGE));
  const page = Math.min(pages, Math.max(1, Math.floor(Number(params.page)) || 1));
  const first = (page - 1) * PER_PAGE;
  const shown = found.slice(first, first + PER_PAGE);
  const next = lists.scheduled[0];
  const noun = TABS[tab].posts;
  const total = (counts: Map<string, number>) => [...counts.values()].reduce((sum, n) => sum + n, 0);

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
          {(Object.keys(TABS) as Tab[]).map((key) => (
            <Link key={key} className={s.tab} href={address(key, q, 1, by)} aria-current={key === tab ? "page" : undefined} prefetch={false}>
              {TABS[key].label} <span>{number(lists[key].length)}</span>
            </Link>
          ))}
        </nav>

        {tab === "read" && (
          <div className={s.reads}>
            {views ? (
              <p className={s.note}>
                <strong>{number(total(views.all))}</strong> views in all, <strong>{number(total(views.recent))}</strong> in the last{" "}
                {TRENDING_DAYS} days. Counted on the live site only: not on a reload, not from robots, and not in this browser while
                you&apos;re signed in here.
              </p>
            ) : (
              <p className={s.note} role="alert">
                {problem}
              </p>
            )}
            <nav className={s.byTabs} aria-label="Views counted">
              {(
                [
                  ["all", "All time"],
                  ["month", `Last ${TRENDING_DAYS} days`],
                ] as const
              ).map(([key, label]) => (
                <Link key={key} className={s.byTab} href={address("read", q, 1, key)} aria-current={key === by ? "page" : undefined} prefetch={false}>
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        )}

        <form className={s.search} action="/backstage" method="get" role="search">
          {tab !== "scheduled" && <input type="hidden" name="view" value={tab} />}
          {tab === "read" && by === "month" && <input type="hidden" name="by" value={by} />}
          <label className="visuallyHidden" htmlFor="backstage-search">
            Search {noun}
          </label>
          <input
            id="backstage-search"
            className={s.field}
            type="search"
            name="q"
            defaultValue={q}
            placeholder={`Search ${noun} by title, slug, link or word`}
          />
          <button className="btn btnPrimary" type="submit">
            Search
          </button>
        </form>

        <p className={s.count} role="status">
          {found.length === 0
            ? q
              ? `No ${noun} match “${q}”.`
              : tab === "scheduled"
                ? "Nothing is scheduled."
                : "No posts yet."
            : `${number(found.length)} post${found.length === 1 ? "" : "s"}${q ? ` for “${q}”` : ""}${pages > 1 ? `, page ${page} of ${pages}` : ""}`}
          {q && (
            <>
              {" "}
              <Link href={address(tab, "", 1, by)} prefetch={false}>
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
            const seen = viewsOf(post);
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
                    {post.slug} · {post.minutes} min · {number(post.words)} words
                    {post.tags.length > 0 && ` · ${post.tags.join(", ")}`}
                  </p>
                  {!waiting && views && (
                    <p className={s.views}>
                      <strong>
                        {number(seen.all)} {seen.all === 1 ? "view" : "views"}
                      </strong>{" "}
                      · {number(seen.recent)} in the last {TRENDING_DAYS} days
                    </p>
                  )}
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
              <Link className="btn btnGhost" href={address(tab, q, page - 1, by)} prefetch={false}>
                Previous
              </Link>
            ) : (
              <span />
            )}
            <span>
              Page {page} of {pages}
            </span>
            {page < pages ? (
              <Link className="btn btnGhost" href={address(tab, q, page + 1, by)} prefetch={false}>
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
