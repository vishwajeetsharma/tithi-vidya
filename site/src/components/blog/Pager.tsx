import type { MouseEvent } from "react";

import { pageList } from "@/lib/posts";

import s from "./blog.module.css";

type Props = { page: number; pages: number; href: (page: number) => string; onPage: (page: number) => void };

/**
 * Previous, page numbers and next. Each is a real link, so it opens in a new
 * tab and search engines can follow it; a plain click changes the page in place.
 * Narrow screens show "Page 2 of 9" in place of the numbers.
 */
export function Pager({ page, pages, href, onPage }: Props) {
  if (pages <= 1) return null;

  const go = (to: number) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onPage(to);
  };

  return (
    <nav className={s.pager} aria-label="Pages">
      {page > 1 ? (
        <a className={s.pageStep} href={href(page - 1)} rel="prev" onClick={go(page - 1)}>
          <span aria-hidden="true">←</span> Previous
        </a>
      ) : (
        <span className={s.pageStep} aria-disabled="true">
          <span aria-hidden="true">←</span> Previous
        </span>
      )}
      <ol className={s.pageList}>
        {pageList(page, pages).map((n, i) =>
          n === null ? (
            <li key={`gap-${i}`} className={s.pageGap} aria-hidden="true">
              …
            </li>
          ) : (
            <li key={n}>
              <a className={s.pageNumber} href={href(n)} aria-label={`Page ${n}`} aria-current={n === page ? "page" : undefined} onClick={go(n)}>
                {n}
              </a>
            </li>
          ),
        )}
      </ol>
      <p className={s.pageOf}>
        Page {page} of {pages}
      </p>
      {page < pages ? (
        <a className={s.pageStep} href={href(page + 1)} rel="next" onClick={go(page + 1)}>
          Next <span aria-hidden="true">→</span>
        </a>
      ) : (
        <span className={s.pageStep} aria-disabled="true">
          Next <span aria-hidden="true">→</span>
        </span>
      )}
    </nav>
  );
}
