import Link from "next/link";

import { ArrowIcon } from "@/components/Icons";
import { dateFormatter, inLang, type TranslatedLang } from "@/i18n/config";
import { dictionary } from "@/i18n/dictionaries";
import { getPostsIn } from "@/lib/blog";
import { isLive } from "@/lib/posts";

import { PostCard } from "./PostCard";
import s from "./blog.module.css";

/**
 * A language's front page and blog page: a few words about the site, the way
 * to the tithi finder, and every article that exists in that language. Posts
 * that are not out yet stay off the list; the page is made again every 10
 * minutes (see `revalidate` on the pages), so they join it by themselves.
 */
export function LanguagePosts({ lang, home }: { lang: TranslatedLang; home: boolean }) {
  const d = dictionary(lang);
  const t = d.home;
  const formatDate = dateFormatter(lang);
  const madeAt = new Date().getTime();
  const posts = getPostsIn(lang).filter((post) => isLive(post, madeAt));
  return (
    <div className={s.page}>
      <div className="wrap">
        <header className={s.head}>
          <p className="eyebrow">{home ? t.eyebrow : d.post.blog}</p>
          <h1 className={`display ${s.title}`}>{home ? t.title : t.latest}</h1>
          <p className={s.lead}>{t.lead}</p>
          <div className={s.headTools}>
            <Link className="btn btnPrimary" href="/find">
              {t.find}
              <ArrowIcon />
            </Link>
            <Link className="btn btnGhost" href="/blog" hrefLang="en">
              {t.english}
            </Link>
          </div>
          {t.toolNote && <p className={s.meta}>{t.toolNote}</p>}
        </header>
        {home && <h2 className={`display ${s.moreTitle}`}>{t.latest}</h2>}
        {posts.length === 0 ? (
          <p className={s.empty}>{t.none}</p>
        ) : (
          <div className={s.grid}>
            {posts.map((post, i) => (
              <PostCard
                key={post.slug}
                post={post}
                headingLevel={home ? 3 : 2}
                priority={i < 3}
                href={inLang(lang, `/blog/${post.slug}`)}
                meta={`${formatDate(post.date)} · ${post.minutes} ${d.post.minRead}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
