import type { Metadata } from "next";
import Link from "next/link";

import { ArrowIcon } from "@/components/Icons";
import { MoonPhase } from "@/components/MoonPhase";

// Where the "please confirm" email's link lands, when double opt-in is on.
export const metadata: Metadata = { title: "You're subscribed", robots: { index: false } };

export default function Subscribed() {
  return (
    <div style={{ minHeight: "100svh", display: "grid", placeItems: "center", padding: "110px 16px 60px", textAlign: "center" }}>
      <div style={{ display: "grid", justifyItems: "center", gap: 16 }}>
        <MoonPhase elongation={180} size={96} />
        <h1 className="display" style={{ fontSize: "clamp(2.5rem, 8vw, 4.5rem)" }}>
          You&apos;re on the list.
        </h1>
        <p style={{ color: "var(--ink-soft)" }}>Thank you. New articles will come to your inbox.</p>
        <Link className="btn btnPrimary" href="/blog">
          Read the blog
          <ArrowIcon />
        </Link>
      </div>
    </div>
  );
}
