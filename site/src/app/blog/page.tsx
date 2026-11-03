import type { Metadata } from "next";

import { BlogBrowser } from "@/components/blog/BlogBrowser";
import s from "@/components/blog/blog.module.css";
import { FollowFeed } from "@/components/blog/FollowFeed";
import { NewsletterSignup } from "@/components/blog/NewsletterSignup";
import { JsonLd } from "@/components/JsonLd";
import { getBuiltAt, getLivePosts, getPosts } from "@/lib/blog";
import { summarise } from "@/lib/posts";
import { AUTHOR, SITE_NAME, siteUrl } from "@/lib/site";

const TITLE = "Blog: Tithis, Moon Birthdays and the Hindu Calendar";
const DESCRIPTION = "Simple guides to tithis, moon birthdays, panchang days and the Hindu calendar, from the makers of Tithi Vidya.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/blog" },
  openGraph: { title: `${TITLE} | ${SITE_NAME}`, description: DESCRIPTION, url: "/blog" },
};

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
          blogPost: posts.map((post) => ({
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
          <FollowFeed feed={`${origin}/blog/feed.xml`} />
        </header>
        {/* Scheduled posts come too, and show once they go live. */}
        <BlogBrowser posts={getPosts().map(summarise)} builtAt={getBuiltAt()} />
        <NewsletterSignup />
      </div>
    </div>
  );
}
