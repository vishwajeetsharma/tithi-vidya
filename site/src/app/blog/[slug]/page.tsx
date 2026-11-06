import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import Form from "next/form";
import { draftMode } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import { NewsletterSignup } from "@/components/blog/NewsletterSignup";
import { PreferredSource } from "@/components/blog/PreferredSource";
import { ReadingRail } from "@/components/blog/ReadingRail";
import { RecentPosts } from "@/components/blog/RecentPosts";
import { ShareButtons } from "@/components/blog/ShareButtons";
import s from "@/components/blog/blog.module.css";
import { ArrowIcon, SearchIcon } from "@/components/Icons";
import { TocSpy } from "@/components/how/TocSpy";
import { JsonLd } from "@/components/JsonLd";
import { formatDate, getBuiltAt, getPost, getPosts, latestPosts, type Post } from "@/lib/blog";
import { isLive, PREVIEW } from "@/lib/posts";
import { AUTHOR, SITE_NAME, siteUrl } from "@/lib/site";

// Only downloaded by pages that show code.
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap", preload: false });

type Params = { params: Promise<{ slug: string }> };

/** The article column: 720 px, then 760, 800 and 860 px on 1700, 2100 and 2400 px screens. Keep in step with SIZES in scripts/content.mjs. */
const IMAGE_SIZES = "(min-width: 2400px) 860px, (min-width: 2100px) 800px, (min-width: 1700px) 760px, (min-width: 760px) 720px, calc(100vw - 32px)";

/** How many of the newest posts are built into HTML at deploy, including scheduled ones. */
const BUILT_AT_DEPLOY = 20;

// Older posts are built the first time someone opens them, and that HTML is
// kept and served to everyone after, so deploys stay quick as the blog grows.
// The posts never change between deploys, so the HTML is never rebuilt
// (revalidate = false). A deploy starts afresh, with the newest posts built.
export const dynamicParams = true;
export const revalidate = false;

// The route needs at least one page here, so an empty blog still builds.
const NO_POSTS = "no-posts-yet";

export function generateStaticParams() {
  const posts = getPosts();
  return posts.length ? posts.slice(0, BUILT_AT_DEPLOY).map((post) => ({ slug: post.slug })) : [{ slug: NO_POSTS }];
}

/** Posts go live at 6:00 AM India time on their date. Google asks for a time with its zone. */
const atSixIst = (date: string) => `${date}T06:00:00+05:30`;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const post = getPost((await params).slug);
  if (!post) return { robots: { index: false } };
  const url = `/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.description,
    authors: [{ name: post.author }],
    keywords: post.tags,
    alternates: { canonical: url, types: { "text/markdown": `${url}.md` } },
    openGraph: {
      type: "article",
      siteName: SITE_NAME,
      locale: "en_IN",
      url,
      title: post.title,
      description: post.description,
      publishedTime: atSixIst(post.date),
      modifiedTime: atSixIst(post.updated),
      authors: [post.author],
      tags: post.tags,
      images: [post.cover ? { url: post.cover.og, width: 1200, height: 630, alt: post.cover.alt } : "/opengraph-image.png"],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [post.cover ? post.cover.og : "/opengraph-image.png"],
    },
  };
}

function Contents({ post, className }: { post: Post; className: string }) {
  return (
    <nav className={className} aria-label="On this page" data-toc>
      <p>On this page</p>
      <ol>
        {post.toc.map((heading) => (
          <li key={heading.id}>
            <a href={`#${heading.id}`}>{heading.text}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default async function PostPage({ params }: Params) {
  const slug = (await params).slug;
  const post = getPost(slug);
  if (!post && slug === NO_POSTS) {
    return (
      <div className={s.page}>
        <div className={`wrap ${s.article}`}>
          <p className={s.lead}>
            New posts are on their way. <Link href="/blog">Back to the blog</Link>
          </p>
        </div>
      </div>
    );
  }
  if (!post) notFound();
  const origin = siteUrl().origin;
  const hasContents = post.toc.length >= 3;
  const builtAt = getBuiltAt();
  const liveAt = Date.parse(post.liveAt);
  // Signed in at /backstage (draft mode), a scheduled post shows in full, with a note.
  const { isEnabled: backstage } = await draftMode();
  const early = liveAt > Date.parse(builtAt);
  const scheduled = !backstage && !isLive(post, Date.parse(builtAt));

  return (
    // The notice's script marks this element, so the attribute it adds is expected.
    <div className={`${s.page} ${mono.variable}`} suppressHydrationWarning={scheduled}>
      {scheduled && (
        <>
          {/* Runs as the page loads, before the article is drawn. Until the post
              goes live it shows the notice instead, and swaps back on time if
              the page is left open. */}
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){var e=document.currentScript.parentElement,t=${liveAt}-Date.now();if(t>0){e.dataset.notYet="";if(t<2147483647)setTimeout(function(){delete e.dataset.notYet},t)}})()`,
            }}
          />
          <div className={s.notYet}>
            <p className="eyebrow">Coming soon</p>
            <p className={`display ${s.notYetTitle}`}>This article is not out yet</p>
            <p className={s.lead}>It goes live on {formatDate(post.date)} at 6:00 AM India time.</p>
            <Link className="btn btnPrimary" href="/blog">
              Read other articles
              <ArrowIcon />
            </Link>
          </div>
        </>
      )}
      <JsonLd
        data={{
          "@graph": [
            {
              "@type": "BlogPosting",
              headline: post.title,
              description: post.description,
              datePublished: atSixIst(post.date),
              dateModified: atSixIst(post.updated),
              // The site's own author has a page; guest authors are named only.
              author: { "@type": "Person", name: post.author, ...(post.author === AUTHOR ? { url: `${origin}/about` } : {}) },
              publisher: {
                "@type": "Organization",
                name: SITE_NAME,
                url: `${origin}/`,
                logo: { "@type": "ImageObject", url: `${origin}/icon-512.png`, width: 512, height: 512 },
              },
              mainEntityOfPage: `${origin}/blog/${post.slug}`,
              url: `${origin}/blog/${post.slug}`,
              inLanguage: "en",
              wordCount: post.words,
              keywords: post.tags.join(", "),
              image: [`${origin}${post.cover ? post.cover.og : "/opengraph-image.png"}`],
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: origin },
                { "@type": "ListItem", position: 2, name: "Blog", item: `${origin}/blog` },
                { "@type": "ListItem", position: 3, name: post.title, item: `${origin}/blog/${post.slug}` },
              ],
            },
          ],
        }}
      />
      <div className={s.postWrap}>
        <div className={s.postLayout}>
          <article className={s.postMain}>
            {backstage && early && (
              <p className={s.backstageNote} role="status">
                Preview from Backstage. Visitors see this post from {formatDate(post.date)} at 6:00 AM India time.{" "}
                <Link href="/backstage" prefetch={false}>
                  Back to Backstage
                </Link>
              </p>
            )}
            <nav className={s.crumbs} aria-label="Breadcrumb">
              <Link href="/blog">Blog</Link>
            </nav>
            <header className={s.head}>
              <h1 className={`display ${s.articleTitle}`}>{post.title}</h1>
              <p className={s.lead}>
                {post.description}
              </p>
              <p className={s.meta}>
                <time dateTime={post.date}>{formatDate(post.date)}</time>
                {post.updated !== post.date && (
                  <>
                    {" "}
                    · Updated <time dateTime={post.updated}>{formatDate(post.updated)}</time>
                  </>
                )}{" "}
                · {post.minutes} min read · {post.author}
                {PREVIEW && liveAt > Date.parse(builtAt) && <strong> · Scheduled: live on the site at 6:00 AM IST that day</strong>}
              </p>
            </header>

            {post.cover && (
              // The cover is the largest thing on the page, so it loads first.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className={s.cover}
                src={post.cover.src}
                srcSet={post.cover.srcset || undefined}
                sizes={IMAGE_SIZES}
                width={post.cover.width}
                height={post.cover.height}
                alt={post.cover.alt}
                fetchPriority="high"
              />
            )}

            {hasContents && <Contents post={post} className={`${s.toc} ${s.tocInline}`} />}

            <div className={s.prose} data-article-body dangerouslySetInnerHTML={{ __html: post.html }} />

            {post.tags.length > 0 && (
              <ul className={s.tags} aria-label="Topics">
                {post.tags.map((tag) => (
                  <li key={tag}>
                    <Link className={s.tag} href={`/blog?tag=${encodeURIComponent(tag)}`}>
                      {tag}
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {/* Phones and tablets: on wide screens these are in the left rail. */}
            <section className={s.shareInline} aria-labelledby="share-title">
              <h2 id="share-title" className={s.railLabel}>
                Share this article
              </h2>
              <ShareButtons url={`${origin}/blog/${post.slug}`} title={post.title} />
              <PreferredSource />
            </section>

            <div className={s.cta}>
              <p className={`display ${s.ctaTitle}`}>When is your moon birthday?</p>
              <p>Enter your birth date, time and place. Free, private and open source.</p>
              <Link className="btn btnLight" href="/find">
                Find my moon birthday
                <ArrowIcon />
              </Link>
            </div>
          </article>

          {/* Wide screens: a sticky copy on the right. Only one copy is ever shown,
              and a hidden one is hidden from screen readers too. */}
          {hasContents && (
            <div className={s.rightRail}>
              <Contents post={post} className={s.toc} />
            </div>
          )}

          {hasContents && <TocSpy ids={post.toc.map((heading) => heading.id)} within="[data-toc]" />}

          <aside className={s.leftRail} aria-label="Reading progress and sharing">
            <ReadingRail url={`${origin}/blog/${post.slug}`} title={post.title} />
          </aside>
        </div>

        <section className={s.recent} aria-labelledby="recent-title">
          <div className={s.recentHead}>
            <h2 id="recent-title" className={`display ${s.moreTitle}`}>
              Recent articles
            </h2>
            <Link className="btn btnGhost" href="/blog">
              View all articles
              <ArrowIcon />
            </Link>
          </div>
          <RecentPosts posts={latestPosts(3, post.slug)} builtAt={builtAt} />
          <Form className={s.findMore} action="/blog" role="search" aria-label="Articles">
            <p className={s.findMoreTitle}>Looking for something else?</p>
            <div className={s.search}>
              <SearchIcon />
              <input
                className={s.field}
                type="search"
                name="q"
                required
                placeholder="Search by word, festival or topic"
                aria-label="Search articles"
                enterKeyHint="search"
                autoComplete="off"
              />
            </div>
          </Form>
          <NewsletterSignup />
        </section>
      </div>
    </div>
  );
}
