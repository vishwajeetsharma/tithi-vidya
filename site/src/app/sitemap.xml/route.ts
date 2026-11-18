import { TRANSLATED } from "@/i18n/config";
import { getLivePosts } from "@/lib/blog";
import { escape } from "@/lib/feeds";
import { siteUrl } from "@/lib/site";

// A plain route, like the feed, rather than Next's sitemap.ts. Next builds a
// sitemap.ts with a fixed Cache-Control header, and Vercel then served the
// first copy for good: from 14 November it never listed a post that went live
// after a deploy. A route without that header is remade like the feed.
export const dynamic = "force-static";
// Made again every 10 minutes, so posts that went live since the deploy are listed (see LISTS_REVALIDATE in lib/blog.ts).
// The daily run in app/api/push/send also marks it stale at 6:00 AM India time.
export const revalidate = 600;

type Entry = {
  url: string;
  lastModified?: Date;
  changeFrequency: "weekly" | "monthly" | "yearly";
  priority: number;
  images?: string[];
  languages?: Record<string, string>;
};

/** Posts go live at 6:00 AM India time on their date. */
const day = (date: string) => new Date(`${date}T06:00:00+05:30`);

function entries(origin: string): Entry[] {
  const posts = getLivePosts();
  // Google trusts lastmod only when it is true, so pages that are not dated
  // leave it out rather than claiming they changed at every build.
  return [
    { url: origin, changeFrequency: "monthly", priority: 1 },
    { url: `${origin}/find`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${origin}/how-it-works`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${origin}/blog`, ...(posts[0] ? { lastModified: day(posts[0].updated) } : {}), changeFrequency: "weekly", priority: 0.8 },
    ...TRANSLATED.flatMap((lang): Entry[] => [
      { url: `${origin}/${lang}`, changeFrequency: "weekly", priority: 0.8 },
      { url: `${origin}/${lang}/blog`, changeFrequency: "weekly", priority: 0.7 },
    ]),
    // A post and each of its translations get a line of their own, and each names
    // the others, so search engines show every reader the version in their language.
    ...posts.flatMap((post): Entry[] => {
      const versions = TRANSLATED.filter((lang) => post.translations?.[lang]);
      const address = (lang: string) => `${origin}${lang === "en" ? "" : `/${lang}`}/blog/${post.slug}`;
      const languages = Object.fromEntries(["en", ...versions].map((lang) => [lang, address(lang)]));
      return ["en", ...versions].map((lang) => ({
        url: address(lang),
        lastModified: day(post.updated),
        changeFrequency: "monthly",
        priority: 0.7,
        ...(post.cover ? { images: [`${origin}${post.cover.largest}`] } : {}),
        ...(versions.length ? { languages } : {}),
      }));
    }),
    { url: `${origin}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${origin}/contribute`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${origin}/ai-use`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${origin}/contact`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${origin}/disclaimer`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${origin}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${origin}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];
}

function line(entry: Entry): string {
  const parts = [`<loc>${escape(entry.url)}</loc>`];
  for (const [lang, href] of Object.entries(entry.languages ?? {})) {
    parts.push(`<xhtml:link rel="alternate" hreflang="${lang}" href="${escape(href)}" />`);
  }
  for (const image of entry.images ?? []) parts.push(`<image:image><image:loc>${escape(image)}</image:loc></image:image>`);
  if (entry.lastModified) parts.push(`<lastmod>${entry.lastModified.toISOString()}</lastmod>`);
  parts.push(`<changefreq>${entry.changeFrequency}</changefreq>`, `<priority>${entry.priority}</priority>`);
  return `<url>\n${parts.join("\n")}\n</url>`;
}

export function GET() {
  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:xhtml="http://www.w3.org/1999/xhtml">`,
    ...entries(siteUrl().origin).map(line),
    `</urlset>`,
    "",
  ].join("\n");
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
