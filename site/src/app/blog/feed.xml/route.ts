import { getLivePosts, getPost } from "@/lib/blog";
import { absoluteHtml, escape } from "@/lib/feeds";
import { AUTHOR, AUTHOR_EMAIL, SITE_NAME, siteUrl } from "@/lib/site";

export const dynamic = "force-static";

/** How many of the newest posts the feed carries. Readers only need recent ones; llms-full.txt has every post. */
const FEED_POSTS = 20;

/** RSS with each post's full text, so feed readers and AI tools get the whole article. */
export function GET() {
  const origin = siteUrl().origin;
  const posts = getLivePosts()
    .slice(0, FEED_POSTS)
    .flatMap((post) => getPost(post.slug) ?? []);
  const items = posts
    .map(
      (post) => `    <item>
      <title>${escape(post.title)}</title>
      <link>${origin}/blog/${post.slug}</link>
      <guid isPermaLink="true">${origin}/blog/${post.slug}</guid>
      <pubDate>${new Date(`${post.date}T00:00:00Z`).toUTCString()}</pubDate>
      <dc:creator>${escape(post.author)}</dc:creator>
      <description>${escape(post.description)}</description>
${post.tags.map((tag) => `      <category>${escape(tag)}</category>`).join("\n")}
      <content:encoded><![CDATA[${absoluteHtml(post.html, origin).replaceAll("]]>", "]]]]><![CDATA[>")}]]></content:encoded>
    </item>`,
    )
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${SITE_NAME} Blog</title>
    <link>${origin}/blog</link>
    <atom:link href="${origin}/blog/feed.xml" rel="self" type="application/rss+xml" />
    <description>Simple guides to tithis, moon birthdays and the Hindu calendar.</description>
    <language>en</language>
    <managingEditor>${AUTHOR_EMAIL} (${AUTHOR})</managingEditor>
${posts[0] ? `    <lastBuildDate>${new Date(`${posts[0].updated}T00:00:00Z`).toUTCString()}</lastBuildDate>\n` : ""}${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
