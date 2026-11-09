import type { NextConfig } from "next";

// Pages are built ahead of time, and the tithi engine runs as WebAssembly in
// the visitor's browser. A few things run on Vercel: app/api/subscribe, which
// keeps the Brevo key off the browser; the first visit to an older blog post,
// which builds its HTML once (see app/blog/[slug]/page.tsx); the private
// /backstage page, with the posts it previews; and the lists of live posts
// (sitemap, feed, llms.txt, the blog page), made again every 10 minutes so
// new posts join them without a deploy (lib/blog.ts). app/api/push sends article
// notifications, with a daily run at 6:00 AM IST (crons in vercel.json).
const nextConfig: NextConfig = {
  images: { unoptimized: true },
  // Those pages read the posts from the files scripts/content.mjs built.
  outputFileTracingIncludes: {
    "/blog/*": ["./.content/blog.json", "./.content/posts/*.json"],
    // Lists of live posts, made again on Vercel every 10 minutes (lib/blog.ts).
    "/blog": ["./.content/blog.json"],
    "/sitemap.xml": ["./.content/blog.json"],
    "/llms.txt": ["./.content/blog.json"],
    "/llms-full.txt": ["./.content/blog.json", "./.content/posts/*.json"],
    "/backstage": ["./.content/blog.json"],
    "/api/push/send": ["./.content/blog.json"],
  },
};

export default nextConfig;
