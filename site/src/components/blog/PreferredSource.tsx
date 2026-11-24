import { GOOGLE_PREFERRED_SOURCE, SHOW_PREFERRED_SOURCE, SITE_NAME } from "@/lib/site";

import s from "./blog.module.css";

/** Google's four-colour "G", as on Google's own buttons. */
function GoogleG() {
  return (
    <svg className={s.preferredG} width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

/**
 * Asks Google to show more of this site to the reader, through Google's
 * Preferred Sources. Styled like Google's own buttons (white, grey border, the
 * four-colour G), so readers know at a glance where it goes. A plain link: no
 * Google script loads on the site.
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
      <GoogleG />
      <span className={s.preferredText}>
        {compact ? (
          <>
            Add as a preferred source on <b>Google</b>
          </>
        ) : (
          <>
            <b>Add {SITE_NAME} as a preferred source</b>
            <small>See more from us in your Google results</small>
          </>
        )}
      </span>
    </a>
  );
}
