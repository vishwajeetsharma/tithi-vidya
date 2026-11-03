"use client";

import type { PostSummary } from "@/lib/posts";

import { PostCard } from "./PostCard";
import s from "./blog.module.css";
import { useLivePosts } from "./useLivePosts";

/** Up to three other posts below an article, newest first. */
export function RecentPosts({ posts, builtAt }: { posts: PostSummary[]; builtAt: string }) {
  const live = useLivePosts(posts, builtAt).slice(0, 3);
  if (live.length === 0) return <p className={s.empty}>This is our first article. More are on the way.</p>;
  return (
    <div className={s.recentGrid}>
      {live.map((post) => (
        <PostCard key={post.slug} post={post} headingLevel={3} />
      ))}
    </div>
  );
}
