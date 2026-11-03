"use client";

import { useState } from "react";

/** Copies an email address, for people whose computer has no mail app set up. */
export function CopyEmail({ email, className }: { email: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copy this email address:", email);
    }
  }

  return (
    <>
      <button type="button" className={className} onClick={copy}>
        {copied ? "Copied" : "Copy address"}
      </button>
      <span className="visuallyHidden" role="status">
        {copied ? "Email address copied" : ""}
      </span>
    </>
  );
}
