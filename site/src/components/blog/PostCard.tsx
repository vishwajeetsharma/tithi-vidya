import Link from "next/link";

import { formatDate, type Post } from "@/lib/posts";
import { bestMatch, highlights } from "@/lib/search";

import s from "./blog.module.css";

type CardPost = Pick<Post, "slug" | "title" | "description" | "date" | "minutes" | "cover"> & { headings?: string[]; tags?: string[] };

/** `text` with the parts that match the search terms marked. */
function Marked({ text, terms }: { text: string; terms: string[] }) {
  const ranges = highlights(text, terms);
  if (!ranges.length) return text;
  const parts = [];
  let at = 0;
  for (const [start, end] of ranges) {
    parts.push(text.slice(at, start), <mark key={start}>{text.slice(start, end)}</mark>);
    at = end;
  }
  parts.push(text.slice(at));
  return parts;
}

/**
 * `priority` is for a card at the top of the page, whose image should load first.
 * `terms` are search terms to mark. A section or topic that matches shows too,
 * so it's clear why a post was found.
 */
export function PostCard({
  post,
  headingLevel = 2,
  priority = false,
  terms = [],
}: {
  post: CardPost;
  headingLevel?: 2 | 3;
  priority?: boolean;
  terms?: string[];
}) {
  const Heading = `h${headingLevel}` as const;
  const section = terms.length ? bestMatch(post.headings ?? [], terms) : undefined;
  const topic = terms.length && !section ? bestMatch(post.tags ?? [], terms) : undefined;
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
            <Marked text={post.title} terms={terms} />
          </Link>
        </Heading>
        <p>
          <Marked text={post.description} terms={terms} />
        </p>
        {(section || topic) && (
          <p className={s.cardSection}>
            <span>{section ? "Section:" : "Topic:"}</span> <Marked text={(section || topic)!} terms={terms} />
          </p>
        )}
      </div>
    </article>
  );
}
