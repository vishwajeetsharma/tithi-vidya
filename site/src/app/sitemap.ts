import type { MetadataRoute } from "next";

import { getPosts } from "@/lib/blog";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteUrl().origin;
  const built = new Date();
  const posts = getPosts();
  return [
    { url: origin, lastModified: built, changeFrequency: "monthly", priority: 1 },
    { url: `${origin}/find`, lastModified: built, changeFrequency: "monthly", priority: 0.9 },
    { url: `${origin}/how-it-works`, lastModified: built, changeFrequency: "monthly", priority: 0.7 },
    { url: `${origin}/blog`, lastModified: posts[0] ? new Date(posts[0].updated) : built, changeFrequency: "weekly", priority: 0.8 },
    ...posts.map((post) => ({
      url: `${origin}/blog/${post.slug}`,
      lastModified: new Date(post.updated),
      changeFrequency: "monthly" as const,
      priority: 0.7,
      ...(post.cover ? { images: [`${origin}${post.cover.largest}`] } : {}),
    })),
    { url: `${origin}/privacy`, lastModified: built, changeFrequency: "yearly", priority: 0.2 },
    { url: `${origin}/terms`, lastModified: built, changeFrequency: "yearly", priority: 0.2 },
  ];
}
