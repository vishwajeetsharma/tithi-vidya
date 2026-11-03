import type { NextConfig } from "next";

// Every page is built ahead of time, and the tithi engine runs as WebAssembly
// in the visitor's browser. The one thing that runs on Vercel is
// app/api/subscribe, which keeps the Brevo key off the browser.
const nextConfig: NextConfig = {
  images: { unoptimized: true },
};

export default nextConfig;
