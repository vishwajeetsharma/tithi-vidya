import type { NextConfig } from "next";

// A fully static site: pages are built ahead of time and the tithi engine
// runs as WebAssembly in the visitor's browser, so Vercel needs no server.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
