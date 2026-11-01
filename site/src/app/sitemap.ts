import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteUrl().origin;
  const lastModified = new Date();
  return [
    { url: origin, lastModified, changeFrequency: "monthly", priority: 1 },
    { url: `${origin}/find`, lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: `${origin}/how-it-works`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${origin}/privacy`, lastModified, changeFrequency: "yearly", priority: 0.2 },
    { url: `${origin}/terms`, lastModified, changeFrequency: "yearly", priority: 0.2 },
  ];
}
