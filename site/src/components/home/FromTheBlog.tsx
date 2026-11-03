import Link from "next/link";

import { PostCard } from "@/components/blog/PostCard";
import { ArrowIcon } from "@/components/Icons";
import { getPosts } from "@/lib/blog";

import s from "./home.module.css";

export function FromTheBlog() {
  const posts = getPosts().slice(0, 3);
  if (posts.length === 0) return null;
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
          {posts.map((post) => (
            <div key={post.slug} data-reveal>
              <PostCard post={post} headingLevel={3} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
