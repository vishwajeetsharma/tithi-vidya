"use client";

import { openSettings } from "@/lib/consent";

export function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button className={className} type="button" onClick={openSettings}>
      Cookie settings
    </button>
  );
}
