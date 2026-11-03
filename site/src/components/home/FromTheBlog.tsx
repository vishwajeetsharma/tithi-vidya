"use client";

import Link from "next/link";

import { PostCard } from "@/components/blog/PostCard";
import { useLivePosts } from "@/components/blog/useLivePosts";
import { ArrowIcon } from "@/components/Icons";
import type { PostSummary } from "@/lib/posts";

import s from "./home.module.css";

/** The three newest posts. `posts` comes from latestPosts(3) in lib/blog. */
export function FromTheBlog({ posts, builtAt }: { posts: PostSummary[]; builtAt: string }) {
  const live = useLivePosts(posts, builtAt).slice(0, 3);
  if (live.length === 0) return null;
  return (
    <section className={s.fromBlog} aria-labelledby="blog-title">
      <div className="wrap">
        <div className={s.fromBlogHead} data-reveal>
          <h2 id="blog-title" className={`display ${s.sceneTitle}`}>
            From the <em className="gradientText">blog</em>
          </h2>
          <Link className="btn btnGhost" href="/blog">
            All posts
            <ArrowIcon />
          </Link>
        </div>
        <div className={s.fromBlogGrid}>
          {live.map((post) => (
            <div key={post.slug} data-reveal>
              <PostCard post={post} headingLevel={3} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
