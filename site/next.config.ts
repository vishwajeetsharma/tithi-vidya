import type { NextConfig } from "next";

// Pages are built ahead of time, and the tithi engine runs as WebAssembly in
// the visitor's browser. Two things run on Vercel: app/api/subscribe, which
// keeps the Brevo key off the browser, and the first visit to an older blog
// post, which builds its HTML once (see app/blog/[slug]/page.tsx).
const nextConfig: NextConfig = {
  images: { unoptimized: true },
  // That first visit reads the post from the files scripts/content.mjs built.
  outputFileTracingIncludes: {
    "/blog/*": ["./.content/blog.json", "./.content/posts/*.json"],
  },
};

export default nextConfig;
