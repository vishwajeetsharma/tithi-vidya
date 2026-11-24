"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ArrowIcon, FireIcon } from "@/components/Icons";
import type { PostSummary } from "@/lib/posts";

import { PostCard } from "./PostCard";
import s from "./blog.module.css";
import { useLivePosts } from "./useLivePosts";

/**
 * The most read posts (app/blog/trending.json). Articles are built once per
 * deploy, so until the latest list loads, this is the one from that build.
 */
function useTrending(built: PostSummary[]): PostSummary[] {
  const [posts, setPosts] = useState(built);
  useEffect(() => {
    let current = true;
    fetch("/blog/trending.json")
      .then((response) => (response.ok ? (response.json() as Promise<{ posts?: PostSummary[] }>) : null))
      .then((data) => {
        if (current && Array.isArray(data?.posts)) setPosts(data.posts);
      })
      .catch(() => undefined);
    return () => {
      current = false;
    };
  }, []);
  return posts;
}

const viewAll = (
  <Link className="btn btnGhost" href="/blog">
    View all articles
    <ArrowIcon />
  </Link>
);

type Props = {
  /** The newest posts, plus scheduled ones, which show once they're live. */
  posts: PostSummary[];
  /** The most read posts when the page was built. */
  trending: PostSummary[];
  /** The article this is under, which is never suggested. */
  current: string;
  builtAt: string;
};

/**
 * Below an article: the most read post of the last 30 days, then the two
 * newest, each under its own heading. Until any post has views, the three newest.
 */
export function RecentPosts({ posts, trending: built, current, builtAt }: Props) {
  const live = useLivePosts(posts, builtAt);
  const hot = useLivePosts(useTrending(built), builtAt).find((post) => post.slug !== current);
  const recent = live.filter((post) => post.slug !== hot?.slug).slice(0, hot ? 2 : 3);

  const recentHead = (
    <div className={s.recentHead}>
      <h2 id="recent-title" className={`display ${s.moreTitle}`}>
        Recent articles
      </h2>
      {viewAll}
    </div>
  );

  if (!hot) {
    return (
      <>
        {recentHead}
        {recent.length ? (
          <div className={s.recentGrid}>
            {recent.map((post) => (
              <PostCard key={post.slug} post={post} headingLevel={3} />
            ))}
          </div>
        ) : (
          <p className={s.empty}>This is our first article. More are on the way.</p>
        )}
      </>
    );
  }

  return (
    <div className={s.recentSplit}>
      <div>
        <div className={s.recentHead}>
          <h2 className={`display ${s.moreTitle} ${s.trendingTitle}`}>
            <FireIcon />
            Trending
          </h2>
        </div>
        <PostCard post={hot} headingLevel={3} />
      </div>
      <div>
        {recentHead}
        <div className={s.recentPair}>
          {recent.map((post) => (
            <PostCard key={post.slug} post={post} headingLevel={3} />
          ))}
        </div>
      </div>
    </div>
  );
}
