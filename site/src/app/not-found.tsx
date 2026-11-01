import type { Metadata } from "next";
import Link from "next/link";

import { ArrowIcon } from "@/components/Icons";
import { MoonPhase } from "@/components/MoonPhase";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <div style={{ minHeight: "100svh", display: "grid", placeItems: "center", padding: "110px 16px 60px", textAlign: "center" }}>
      <div style={{ display: "grid", justifyItems: "center", gap: 16 }}>
        <MoonPhase elongation={2} size={96} />
        <h1 className="display" style={{ fontSize: "clamp(2.5rem, 8vw, 4.5rem)" }}>
          This page is a new moon.
        </h1>
        <p style={{ color: "var(--ink-soft)" }}>We looked, but we can not see it.</p>
        <Link className="btn btnPrimary" href="/">
          Go to the home page
          <ArrowIcon />
        </Link>
      </div>
    </div>
  );
}
