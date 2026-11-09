import type { MetadataRoute } from "next";

import { getLivePosts } from "@/lib/blog";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-static";
// Made again every 10 minutes, so posts that went live since the deploy are listed (see LISTS_REVALIDATE in lib/blog.ts).
export const revalidate = 600;

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteUrl().origin;
  const posts = getLivePosts();
  // Google trusts lastmod only when it is true, so pages that are not dated
  // leave it out rather than claiming they changed at every build.
  const day = (date: string) => new Date(`${date}T06:00:00+05:30`);
  return [
    { url: origin, changeFrequency: "monthly", priority: 1 },
    { url: `${origin}/find`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${origin}/how-it-works`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${origin}/blog`, ...(posts[0] ? { lastModified: day(posts[0].updated) } : {}), changeFrequency: "weekly", priority: 0.8 },
    ...posts.map((post) => ({
      url: `${origin}/blog/${post.slug}`,
      lastModified: day(post.updated),
      changeFrequency: "monthly" as const,
      priority: 0.7,
      ...(post.cover ? { images: [`${origin}${post.cover.largest}`] } : {}),
    })),
    { url: `${origin}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${origin}/contribute`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${origin}/ai-use`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${origin}/contact`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${origin}/disclaimer`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${origin}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${origin}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
