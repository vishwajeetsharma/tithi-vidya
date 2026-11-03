import Link from "next/link";

import { formatDate, type Post } from "@/lib/posts";

import s from "./blog.module.css";

type CardPost = Pick<Post, "slug" | "title" | "description" | "date" | "minutes" | "cover">;

/** `priority` is for a card at the top of the page, whose image should load first. */
export function PostCard({ post, headingLevel = 2, priority = false }: { post: CardPost; headingLevel?: 2 | 3; priority?: boolean }) {
  const Heading = `h${headingLevel}` as const;
  return (
    <article className={s.card}>
      {post.cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className={s.cardImage}
          src={post.cover.src}
          srcSet={post.cover.srcset || undefined}
          sizes="(min-width: 1000px) 400px, (min-width: 620px) 50vw, 100vw"
          width={post.cover.width}
          height={post.cover.height}
          alt=""
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          decoding="async"
        />
      )}
      <div className={s.cardBody}>
        <p className={s.meta}>
          <time dateTime={post.date}>{formatDate(post.date)}</time> · {post.minutes} min read
        </p>
        <Heading className={`display ${s.cardTitle}`}>
          <Link className={s.cardLink} href={`/blog/${post.slug}`}>
            {post.title}
          </Link>
        </Heading>
        <p>{post.description}</p>
      </div>
    </article>
  );
}
