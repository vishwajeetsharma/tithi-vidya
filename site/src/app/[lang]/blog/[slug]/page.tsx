import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Listen } from "@/components/blog/Listen";
import { PostCard } from "@/components/blog/PostCard";
import { ReadIn } from "@/components/blog/ReadIn";
import { ShareButtons } from "@/components/blog/ShareButtons";
import s from "@/components/blog/blog.module.css";
import { ArrowIcon } from "@/components/Icons";
import { TocSpy } from "@/components/how/TocSpy";
import { JsonLd } from "@/components/JsonLd";
import { dateFormatter, inLang, isTranslated, LANGS, TRANSLATED, type Lang } from "@/i18n/config";
import { dictionary } from "@/i18n/dictionaries";
import { getBuiltAt, getPostsIn, getTranslation } from "@/lib/blog";
import { isLive, type Post } from "@/lib/posts";
import { AUTHOR, SITE_NAME, siteUrl } from "@/lib/site";

// A translated article: /hi/blog/<slug> is content/blog/<slug>/index.hi.md.
// It is the English post's page (src/app/blog/[slug]/page.tsx) in another
// language, with the same pictures, date and address after the language.

const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap", preload: false });

type Params = { params: Promise<{ lang: string; slug: string }> };

const IMAGE_SIZES = "(min-width: 2400px) 860px, (min-width: 2100px) 800px, (min-width: 1700px) 760px, (min-width: 760px) 720px, calc(100vw - 32px)";

/** The newest translations are built at deploy; older ones the first time someone opens them. */
const BUILT_AT_DEPLOY = 20;
export const dynamicParams = true;
export const revalidate = false;

export function generateStaticParams() {
  return TRANSLATED.flatMap((lang) =>
    getPostsIn(lang)
      .slice(0, BUILT_AT_DEPLOY)
      .map((post) => ({ lang, slug: post.slug })),
  );
}

const atSixIst = (date: string) => `${date}T06:00:00+05:30`;

/** The same post in every language it has, for hreflang: search engines then show each reader their own language. */
function languagesOf(post: Post): Record<string, string> {
  const path = `/blog/${post.slug}`;
  const all: Record<string, string> = { en: path, "x-default": path };
  for (const code of TRANSLATED) if (post.translations?.[code]) all[code] = inLang(code, path);
  return all;
}

function load(lang: string, slug: string): { lang: Exclude<Lang, "en">; post: Post } | null {
  if (!isTranslated(lang)) return null;
  const post = getTranslation(slug, lang);
  return post ? { lang, post } : null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { lang: code, slug } = await params;
  const found = load(code, slug);
  if (!found) return { robots: { index: false } };
  const { lang, post } = found;
  const url = inLang(lang, `/blog/${post.slug}`);
  const image = post.cover ? { url: post.cover.og, width: 1200, height: 630, alt: post.cover.alt } : "/opengraph-image.png";
  return {
    title: post.title,
    description: post.description,
    authors: [{ name: post.author }],
    alternates: { canonical: url, languages: languagesOf(post) },
    openGraph: {
      type: "article",
      siteName: SITE_NAME,
      locale: LANGS[lang].og,
      url,
      title: post.title,
      description: post.description,
      publishedTime: atSixIst(post.date),
      modifiedTime: atSixIst(post.updated),
      authors: [post.author],
      images: [image],
    },
    twitter: { card: "summary_large_image", title: post.title, description: post.description, images: [post.cover ? post.cover.og : "/opengraph-image.png"] },
  };
}

export default async function TranslatedPost({ params }: Params) {
  const { lang: code, slug } = await params;
  const found = load(code, slug);
  if (!found) notFound();
  const { lang, post } = found;
  const d = dictionary(lang);
  const t = d.post;
  const formatDate = dateFormatter(lang);
  const origin = siteUrl().origin;
  const url = `${origin}${inLang(lang, `/blog/${post.slug}`)}`;
  const hasContents = post.toc.length >= 3;
  const builtAt = getBuiltAt();
  const liveAt = Date.parse(post.liveAt);
  const scheduled = !isLive(post, Date.parse(builtAt));
  // Other articles in this language, newest first. Ones not out yet stay out of the list.
  const others = getPostsIn(lang)
    .filter((other) => other.slug !== post.slug && isLive(other, Date.parse(builtAt)))
    .slice(0, 3);

  const contents = (className: string) => (
    <nav className={className} aria-label={t.onThisPage} data-toc>
      <p>{t.onThisPage}</p>
      <ol>
        {post.toc.map((heading) => (
          <li key={heading.id}>
            <a href={`#${heading.id}`}>{heading.text}</a>
          </li>
        ))}
      </ol>
    </nav>
  );

  return (
    <div className={`${s.page} ${mono.variable}`} suppressHydrationWarning={scheduled}>
      {scheduled && (
        <>
          {/* As on the English page: until the post goes live, the notice shows in its place. */}
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){var e=document.currentScript.parentElement,t=${liveAt}-Date.now();if(t>0){e.dataset.notYet="";if(t<2147483647)setTimeout(function(){delete e.dataset.notYet},t)}})()`,
            }}
          />
          <div className={s.notYet}>
            <p className="eyebrow">{t.comingSoon}</p>
            <p className={`display ${s.notYetTitle}`}>{t.notOut}</p>
            <p className={s.lead}>{t.goesLive.replace("{date}", formatDate(post.date))}</p>
            <Link className="btn btnPrimary" href={inLang(lang, "/blog")}>
              {t.readOthers}
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
              author: { "@type": "Person", name: post.author, ...(post.author === AUTHOR ? { url: `${origin}/about` } : {}) },
              publisher: {
                "@type": "Organization",
                name: SITE_NAME,
                url: `${origin}/`,
                logo: { "@type": "ImageObject", url: `${origin}/icon-512.png`, width: 512, height: 512 },
              },
              mainEntityOfPage: url,
              url,
              inLanguage: lang,
              // Tells search engines this is the same article as the English one, not a copy.
              translationOfWork: { "@type": "BlogPosting", "@id": `${origin}/blog/${post.slug}`, inLanguage: "en" },
              wordCount: post.words,
              image: [`${origin}${post.cover ? post.cover.og : "/opengraph-image.png"}`],
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: d.footer.home, item: `${origin}${inLang(lang, "/")}` },
                { "@type": "ListItem", position: 2, name: t.blog, item: `${origin}${inLang(lang, "/blog")}` },
                { "@type": "ListItem", position: 3, name: post.title, item: url },
              ],
            },
          ],
        }}
      />
      <div className={s.postWrap}>
        <div className={s.postLayout}>
          <article className={s.postMain}>
            <nav className={s.crumbs} aria-label={t.blog}>
              <Link href={inLang(lang, "/blog")}>{t.blog}</Link>
            </nav>
            <header className={s.head}>
              <h1 className={`display ${s.articleTitle}`}>{post.title}</h1>
              <p className={s.lead}>{post.description}</p>
              <p className={s.meta}>
                <time dateTime={post.date}>{formatDate(post.date)}</time>
                {post.updated !== post.date && (
                  <>
                    {" "}
                    · {t.updated} <time dateTime={post.updated}>{formatDate(post.updated)}</time>
                  </>
                )}{" "}
                · {post.minutes} {t.minRead} · {post.author}
              </p>
            </header>

            <div className={s.articleTools}>
              <Listen lang={lang} words={post.words} t={d.listen} />
              <ReadIn lang={lang} slug={post.slug} translations={post.translations} t={t} more={d.language.more} />
            </div>

            {post.cover && (
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

            {hasContents && contents(`${s.toc} ${s.tocInline}`)}

            <div className={s.prose} data-article-body dangerouslySetInnerHTML={{ __html: post.html }} />

            <section className={s.shareInline} aria-labelledby="share-title">
              <h2 id="share-title" className={s.railLabel}>
                {t.share}
              </h2>
              <ShareButtons url={url} title={post.title} />
            </section>

            <div className={s.cta}>
              <p className={`display ${s.ctaTitle}`}>{t.ctaTitle}</p>
              <p>
                {t.ctaText} {d.home.toolNote}
              </p>
              <Link className="btn btnLight" href="/find">
                {t.ctaButton}
                <ArrowIcon />
              </Link>
            </div>
          </article>

          {hasContents && <div className={s.rightRail}>{contents(s.toc)}</div>}
          {hasContents && <TocSpy ids={post.toc.map((heading) => heading.id)} within="[data-toc]" />}
        </div>

        {others.length > 0 && (
          <section className={s.recent} aria-labelledby="recent-title">
            <div className={s.recentHead}>
              <h2 id="recent-title" className={`display ${s.moreTitle}`}>
                {t.moreTitle}
              </h2>
              <Link className="btn btnGhost" href={inLang(lang, "/blog")}>
                {t.viewAll}
                <ArrowIcon />
              </Link>
            </div>
            <div className={s.recentGrid}>
              {others.map((other) => (
                <PostCard
                  key={other.slug}
                  post={other}
                  headingLevel={3}
                  href={inLang(lang, `/blog/${other.slug}`)}
                  meta={`${formatDate(other.date)} · ${other.minutes} ${t.minRead}`}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
