"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";

import { SearchIcon } from "@/components/Icons";
import { browsePosts, readBrowse, SHOW_ALL, SORTS, topics, withBrowse, type Browse, type PostSummary, type Sort } from "@/lib/posts";

import { PostCard } from "./PostCard";
import s from "./blog.module.css";
import { useLivePosts } from "./useLivePosts";

/** Reports the address's query. Kept apart, in Suspense, so the article list is still built into the HTML. */
function AddressReader({ onChange }: { onChange: (query: string) => void }) {
  const query = useSearchParams().toString();
  useEffect(() => onChange(query), [query, onChange]);
  return null;
}

function describe(count: number, { q, tag }: Browse) {
  let text = `${count} ${count === 1 ? "article" : "articles"}`;
  if (tag) text += ` about ${tag}`;
  if (q.trim()) text += ` matching “${q.trim()}”`;
  return text;
}

/**
 * The blog's articles, with search, topics and sorting. The choices are kept
 * in the address (?q=, ?tag=, ?sort=), so topic links from articles, shared
 * links and the back button all work.
 */
export function BlogBrowser({ posts, builtAt }: { posts: PostSummary[]; builtAt: string }) {
  const live = useLivePosts(posts, builtAt);
  const [browse, setBrowse] = useState<Browse>(SHOW_ALL);
  const addressRead = useRef(false);
  const written = useRef("");

  // From the address: on arrival, and when a link or the back button changes it.
  const fromAddress = useCallback((query: string) => {
    addressRead.current = true;
    if (query === written.current) return;
    written.current = query;
    setBrowse(readBrowse(query));
  }, []);

  // Into the address, once typing pauses.
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

  if (live.length === 0) return <p className={s.empty}>New posts are on their way.</p>;

  const change = (next: Partial<Browse>) => setBrowse((current) => ({ ...current, ...next }));
  const shown = browsePosts(live, browse);
  const tagCounts = topics(live);
  if (browse.tag && !tagCounts.some(([tag]) => tag === browse.tag)) tagCounts.push([browse.tag, 0]);

  return (
    <>
      <Suspense fallback={null}>
        <AddressReader onChange={fromAddress} />
      </Suspense>

      <form className={s.browse} role="search" aria-label="Articles" onSubmit={(event) => event.preventDefault()}>
        <div className={s.browseRow}>
          <label className={s.search}>
            <span className="visuallyHidden">Search articles</span>
            <SearchIcon />
            <input
              className={s.field}
              type="search"
              value={browse.q}
              placeholder="Search articles"
              enterKeyHint="search"
              autoComplete="off"
              onChange={(event) => change({ q: event.target.value })}
            />
          </label>
          <label className={s.sort}>
            <span>Sort</span>
            <select className={s.field} value={browse.sort} onChange={(event) => change({ sort: event.target.value as Sort })}>
              {Object.entries(SORTS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {tagCounts.length > 0 && (
          <div className={s.topics} role="group" aria-label="Topics">
            <button type="button" className={s.topic} aria-pressed={!browse.tag} onClick={() => change({ tag: "" })}>
              All topics
            </button>
            {tagCounts.map(([tag, count]) => (
              <button
                key={tag}
                type="button"
                className={s.topic}
                aria-pressed={browse.tag === tag}
                onClick={() => change({ tag: browse.tag === tag ? "" : tag })}
              >
                {tag}{" "}
                <span>
                  {count}
                  <span className="visuallyHidden"> {count === 1 ? "article" : "articles"}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </form>

      <p className={s.count} role="status">
        {describe(shown.length, browse)}
      </p>

      {shown.length > 0 ? (
        <div className={s.grid}>
          {shown.map((post, i) => (
            <PostCard key={post.slug} post={post} priority={i === 0} />
          ))}
        </div>
      ) : (
        <div className={s.noMatch}>
          <p>No articles match. Try fewer or different words, or another topic.</p>
          <button type="button" className="btn btnGhost" onClick={() => setBrowse(SHOW_ALL)}>
            Show all articles
          </button>
        </div>
      )}
    </>
  );
}
