import type { Metadata } from "next";

import { BlogBrowser } from "@/components/blog/BlogBrowser";
import s from "@/components/blog/blog.module.css";
import { FollowFeed } from "@/components/blog/FollowFeed";
import { NotifyButton } from "@/components/blog/NotifyButton";
import { PreferredSource } from "@/components/blog/PreferredSource";
import { NewsletterSignup } from "@/components/blog/NewsletterSignup";
import { JsonLd } from "@/components/JsonLd";
import { inLang, TRANSLATED } from "@/i18n/config";
import { getLivePosts, latestPosts, trendingPosts } from "@/lib/blog";
import { allViews } from "@/lib/views";
import { PAGE_SIZE, topics, TRENDING_COUNT } from "@/lib/posts";
import { AUTHOR, SITE_NAME, pageMetadata, siteUrl } from "@/lib/site";

const TITLE = "Blog: Tithis, Moon Birthdays and the Hindu Calendar";
const DESCRIPTION = "Simple guides to tithis, moon birthdays, panchang days and the Hindu calendar, from the makers of Tithi Vidya.";

// The blog exists in each translated language too (/hi/blog): hreflang, and the language menu, find it here.
const LANGUAGES = { en: "/blog", "x-default": "/blog", ...Object.fromEntries(TRANSLATED.map((code) => [code, inLang(code, "/blog")])) };

export const metadata: Metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, path: "/blog", ...(TRANSLATED.length ? { languages: LANGUAGES } : {}) });

// Made again every 10 minutes, so the HTML and its structured data list posts
// that went live since the deploy (see LISTS_REVALIDATE in lib/blog.ts), and
// Trending follows the latest view counts.
export const revalidate = 600;

export default async function BlogIndex() {
  // When this HTML is made. The list's script catches up from here by the visitor's clock.
  const madeAt = new Date().toISOString();
  const posts = getLivePosts(Date.parse(madeAt));
  const origin = siteUrl().origin;
  // The most read posts. They're built into the page with the first page of
  // posts, so Trending shows straight away, without loading every post.
  const trending = await trendingPosts(TRENDING_COUNT, "", Date.parse(madeAt));
  const firstPage = latestPosts(PAGE_SIZE, "", madeAt);
  const listed = new Set(firstPage.map((post) => post.slug));
  // Each live post's views, for "Most viewed". Posts without any are left out.
  const counts = await allViews(Date.parse(madeAt));
  const views = Object.fromEntries(posts.flatMap((post) => (counts.get(post.slug) ? [[post.slug, counts.get(post.slug)!]] : [])));
  return (
    <div className={s.page}>
      <JsonLd
        data={{
          "@type": "Blog",
          name: `${SITE_NAME} Blog`,
          description: DESCRIPTION,
          url: `${origin}/blog`,
          inLanguage: "en",
          author: { "@type": "Person", name: AUTHOR },
          blogPost: posts.slice(0, PAGE_SIZE).map((post) => ({
            "@type": "BlogPosting",
            headline: post.title,
            description: post.description,
            datePublished: post.date,
            dateModified: post.updated,
            url: `${origin}/blog/${post.slug}`,
          })),
        }}
      />
      <div className="wrap">
        <header className={s.head}>
          <p className="eyebrow">Blog</p>
          <h1 className={`display ${s.title}`}>
            Moon days, <em className="gradientText">made simple</em>
          </h1>
          <p className={s.lead}>Short, plain guides to tithis, moon birthdays and the Hindu calendar.</p>
          <div className={s.headTools}>
            <FollowFeed feed={`${origin}/blog/feed.xml`} />
            <NotifyButton />
            <PreferredSource compact />
          </div>
        </header>
        {/* The first page is in the HTML, with scheduled posts, which show once they go live. The rest load from /blog/posts.json. */}
        <BlogBrowser
          firstPage={[...firstPage, ...trending.filter((post) => !listed.has(post.slug))]}
          trending={trending.map((post) => post.slug)}
          views={views}
          total={posts.length}
          topics={topics(posts)}
          builtAt={madeAt}
        />
        <NewsletterSignup />
      </div>
    </div>
  );
}
