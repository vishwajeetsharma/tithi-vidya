import type { Metadata } from "next";

import { BlogBrowser } from "@/components/blog/BlogBrowser";
import s from "@/components/blog/blog.module.css";
import { FollowFeed } from "@/components/blog/FollowFeed";
import { NotifyButton } from "@/components/blog/NotifyButton";
import { PreferredSource } from "@/components/blog/PreferredSource";
import { NewsletterSignup } from "@/components/blog/NewsletterSignup";
import { JsonLd } from "@/components/JsonLd";
import { getBuiltAt, getLivePosts, latestPosts } from "@/lib/blog";
import { PAGE_SIZE, topics } from "@/lib/posts";
import { AUTHOR, SITE_NAME, pageMetadata, siteUrl } from "@/lib/site";

const TITLE = "Blog: Tithis, Moon Birthdays and the Hindu Calendar";
const DESCRIPTION = "Simple guides to tithis, moon birthdays, panchang days and the Hindu calendar, from the makers of Tithi Vidya.";

export const metadata: Metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, path: "/blog" });

export default function BlogIndex() {
  const posts = getLivePosts();
  const origin = siteUrl().origin;
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
        <BlogBrowser firstPage={latestPosts(PAGE_SIZE)} total={posts.length} topics={topics(posts)} builtAt={getBuiltAt()} />
        <NewsletterSignup />
      </div>
    </div>
  );
}
