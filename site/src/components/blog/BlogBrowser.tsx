"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

import { SearchIcon } from "@/components/Icons";
import { browsePosts, PAGE_SIZE, readBrowse, SHOW_ALL, sortOf, SORTS, topics, withBrowse, type Browse, type PostSummary, type Sort } from "@/lib/posts";

import { Pager } from "./Pager";
import { PostCard } from "./PostCard";
import { Topics } from "./Topics";
import s from "./blog.module.css";
import { useLivePosts } from "./useLivePosts";

/** Reports the address's query. Kept apart, in Suspense, so the article list is still built into the HTML. */
function AddressReader({ onChange }: { onChange: (query: string) => void }) {
  const query = useSearchParams().toString();
  useEffect(() => onChange(query), [query, onChange]);
  return null;
}

function describe(count: number, { q, tag }: Browse, partial: boolean) {
  const words = q.trim();
  if (partial) return `No article has all of “${words}”. ${count === 1 ? "This one has" : `These ${count} have`} some of the words.`;
  let text = `${count} ${count === 1 ? "article" : "articles"}`;
  if (tag) text += ` about ${tag}`;
  if (words) text += ` matching “${words}”`;
  return text;
}

/** Every post, loaded from /blog/posts.json, or null until then. `retry` loads again after a failure. */
function useAllPosts() {
  const [posts, setPosts] = useState<PostSummary[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let current = true;
    fetch("/blog/posts.json")
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<{ posts: PostSummary[] }>;
      })
      .then((data) => current && setPosts(data.posts))
      .catch(() => current && setFailed(true));
    return () => {
      current = false;
    };
  }, [attempt]);

  const retry = () => {
    setFailed(false);
    setAttempt((n) => n + 1);
  };
  return { posts, failed, retry };
}

type Props = {
  /** The first page of posts, built into the HTML, plus scheduled posts. */
  firstPage: PostSummary[];
  /** Live posts when the site was built, and their topics: what the page shows until every post has loaded. */
  total: number;
  topics: [string, number][];
  builtAt: string;
};

/**
 * The blog's articles, a page at a time, with search, topics and sorting. The
 * choices are kept in the address (?q=, ?tag=, ?sort=, ?page=), so topic links
 * from articles, shared links and the back button all work.
 */
export function BlogBrowser({ firstPage, total, topics: builtTopics, builtAt }: Props) {
  const all = useAllPosts();
  const live = useLivePosts(all.posts ?? firstPage, builtAt);
  const [browse, setBrowse] = useState<Browse>(SHOW_ALL);
  const addressRead = useRef(false);
  const written = useRef("");
  const field = useRef<HTMLInputElement>(null);
  const top = useRef<HTMLParagraphElement>(null);

  // Typing stays quick: results catch up a moment later when there are many posts.
  const q = useDeferredValue(browse.q);
  const found = useMemo(() => browsePosts(live, { ...browse, q }), [live, browse, q]);

  // From the address: on arrival, and when a link or the back button changes it.
  const fromAddress = useCallback((query: string) => {
    addressRead.current = true;
    if (query === written.current) return;
    written.current = query;
    setBrowse(readBrowse(query));
  }, []);

  // Into the address, once typing pauses. Pages are written straight away, in goToPage.
  useEffect(() => {
    if (!addressRead.current) return;
    const timer = window.setTimeout(() => {
      const current = window.location.search.slice(1);
      const query = withBrowse(current, browse);
      if (query === current) return;
      written.current = query;
      window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [browse]);

  // "/" jumps to the search box from anywhere on the page.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.target instanceof Element && event.target.closest("input, textarea, select, [contenteditable]")) return;
      event.preventDefault();
      field.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (live.length === 0 && (all.posts || total === 0)) return <p className={s.empty}>New posts are on their way.</p>;

  // Any change but the page starts again from page 1.
  const change = (next: Partial<Browse>) => setBrowse((current) => ({ ...current, page: 1, ...next }));

  // Until every post has loaded, the first page of newest posts is all there is to show.
  const waiting = !all.posts && (browse.q.trim() !== "" || browse.tag !== "" || browse.page > 1 || sortOf(browse) !== "newest");
  const count = all.posts ? found.posts.length : total;
  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const page = Math.min(browse.page, pages);
  const shown = found.posts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const tagCounts = all.posts ? topics(live) : builtTopics;
  const sort = sortOf(browse);
  const searching = browse.q.trim() !== "";

  const goToPage = (to: number) => {
    const next = { ...browse, page: to };
    setBrowse(next);
    const query = withBrowse(window.location.search.slice(1), next);
    written.current = query;
    window.history.pushState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    top.current?.focus({ preventScroll: true });
    top.current?.scrollIntoView({ block: "start", behavior: calm ? "auto" : "smooth" });
  };

  const pickSort = (value: Sort) => change({ sort: value === sortOf({ q: browse.q, sort: "" }) ? "" : value });

  return (
    <>
      <Suspense fallback={null}>
        <AddressReader onChange={fromAddress} />
      </Suspense>

      <form
        className={s.browse}
        role="search"
        aria-label="Articles"
        onSubmit={(event) => {
          event.preventDefault();
          // On a phone, Enter puts the keyboard away so the results show.
          field.current?.blur();
        }}
      >
        <div className={s.browseRow}>
          <div className={s.search}>
            <SearchIcon />
            <input
              ref={field}
              className={s.field}
              type="search"
              value={browse.q}
              placeholder="Search by word, festival or topic"
              aria-label="Search articles"
              aria-keyshortcuts="/"
              enterKeyHint="search"
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => change({ q: event.target.value })}
              onKeyDown={(event) => {
                if (event.key === "Escape" && browse.q) {
                  event.preventDefault();
                  change({ q: "" });
                }
              }}
            />
            {browse.q ? (
              <button
                type="button"
                className={s.clear}
                aria-label="Clear search"
                onClick={() => {
                  change({ q: "" });
                  field.current?.focus();
                }}
              >
                <span aria-hidden="true">×</span>
              </button>
            ) : (
              <kbd className={s.slashHint} title="Press / to search">
                /
              </kbd>
            )}
          </div>
          <label className={s.sort}>
            <span>Sort</span>
            <select className={s.field} value={sort} onChange={(event) => pickSort(event.target.value as Sort)}>
              {Object.entries(SORTS)
                .filter(([value]) => value !== "best" || searching)
                .map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
            </select>
          </label>
        </div>
        {tagCounts.length > 0 && <Topics counts={tagCounts} active={browse.tag} onPick={(tag) => change({ tag })} />}
      </form>

      <p ref={top} className={s.count} role="status" tabIndex={-1}>
        {waiting ? "" : describe(count, { ...browse, q }, found.partial)}
        {!waiting && pages > 1 && <span className={s.countPage}> · Page {page} of {pages}</span>}
      </p>

      {waiting ? (
        all.failed ? (
          <div className={s.noMatch}>
            <p>The articles didn’t load. Check your connection, then try again.</p>
            <button type="button" className="btn btnGhost" onClick={all.retry}>
              Try again
            </button>
          </div>
        ) : (
          <p className={s.loading}>Loading articles…</p>
        )
      ) : shown.length > 0 ? (
        <>
          <div className={s.grid}>
            {shown.map((post, i) => (
              <PostCard key={post.slug} post={post} priority={page === 1 && i === 0} terms={found.terms} />
            ))}
          </div>
          <Pager page={page} pages={pages} href={(n) => `/blog${pageHref(browse, n)}`} onPage={goToPage} />
        </>
      ) : (
        <div className={s.noMatch}>
          <p>
            No articles match “{browse.q.trim()}”{browse.tag && ` about ${browse.tag}`}. Check the spelling, try other words, or pick a topic.
          </p>
          <div className={s.noMatchActions}>
            {browse.tag && (
              <button type="button" className="btn btnGhost" onClick={() => change({ tag: "" })}>
                Search all topics
              </button>
            )}
            <button type="button" className="btn btnGhost" onClick={() => setBrowse(SHOW_ALL)}>
              Show all articles
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/** The address of a page with the current search, for links that open in a new tab or that search engines follow. */
function pageHref(browse: Browse, page: number) {
  const query = withBrowse("", { ...browse, page });
  return query ? `?${query}` : "";
}
