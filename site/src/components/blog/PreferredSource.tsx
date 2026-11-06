import { GOOGLE_PREFERRED_SOURCE, SHOW_PREFERRED_SOURCE, SITE_NAME } from "@/lib/site";

import s from "./blog.module.css";

/**
 * Asks Google to show more of this site to the reader, through Google's
 * Preferred Sources. A plain link: no Google script loads on the site.
 */
export function PreferredSource({ compact = false }: { compact?: boolean }) {
  if (!SHOW_PREFERRED_SOURCE) return null;
  return (
    <a
      className={`${s.preferred} ${compact ? s.preferredCompact : ""}`}
      href={GOOGLE_PREFERRED_SOURCE}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Add ${SITE_NAME} as a preferred source on Google (opens in a new tab)`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
        <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z" />
      </svg>
      <span>
        <strong>Add as a preferred source on Google</strong>
        {!compact && <small>See more from {SITE_NAME} in your Google results.</small>}
      </span>
    </a>
  );
}
