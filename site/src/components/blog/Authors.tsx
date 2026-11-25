import Link from "next/link";
import { Fragment } from "react";

import type { Post } from "@/lib/posts";

import s from "./blog.module.css";

/**
 * A post's authors, each linked where the post gives a link: a page on this
 * site opens here, any other address in a new tab. "A, B and C".
 */
export function Authors({ authors, and = " and " }: { authors: Post["authors"]; and?: string }) {
  return authors.map((author, i) => (
    <Fragment key={`${author.name}-${i}`}>
      {i > 0 && (i === authors.length - 1 ? and : ", ")}
      {!author.url ? (
        author.name
      ) : author.url.startsWith("/") ? (
        <Link className={s.author} href={author.url} rel="author">
          {author.name}
        </Link>
      ) : (
        <a className={s.author} href={author.url} rel="author noopener noreferrer" target="_blank">
          {author.name}
        </a>
      )}
    </Fragment>
  ));
}

/** The authors for structured data: each a Person, with a full address when there's a link. */
export const authorsLd = (authors: Post["authors"], origin: string) =>
  authors.map((author) => ({
    "@type": "Person",
    name: author.name,
    ...(author.url ? { url: author.url.startsWith("/") ? `${origin}${author.url}` : author.url } : {}),
  }));
