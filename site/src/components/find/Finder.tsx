"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { findBirth, type BirthQuery, type BirthResult } from "@/lib/engine";
import { heldQuery, holdQuery, toHash } from "@/lib/query";

import { FinderForm } from "./FinderForm";
import { Results } from "./Results";
import s from "./find.module.css";

/** The form plus results. Everything runs in the browser, in WebAssembly. */
export function Finder() {
  const [initial, setInitial] = useState<BirthQuery | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [result, setResult] = useState<BirthResult | null>(null);
  const [query, setQuery] = useState<BirthQuery | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const moveFocus = useRef(false);

  const run = useCallback(async (next: BirthQuery) => {
    setBusy(true);
    setError("");
    try {
      const value = await findBirth(next);
      setResult(value);
      setQuery(next);
      moveFocus.current = true;
      holdQuery(next);
    } catch (problem) {
      setResult(null);
      setError(problem instanceof Error ? problem.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }, []);

  // A shared link, or the short form on the home page, fills everything in.
  useEffect(() => {
    const load = () => {
      const waiting = heldQuery();
      if (!waiting) return;
      setInitial(waiting);
      setFormKey((key) => key + 1);
      void run(waiting);
    };
    const timer = window.setTimeout(load, 0);
    // A shared link pasted while already on this page does not reload it.
    window.addEventListener("hashchange", load);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("hashchange", load);
    };
  }, [run]);

  // Bring keyboard and screen reader users to the answer.
  useEffect(() => {
    if (!result || !moveFocus.current) return;
    moveFocus.current = false;
    heading.current?.focus({ preventScroll: true });
    const calm = document.documentElement.dataset.motion !== "on";
    heading.current?.closest("section")?.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "start" });
  }, [result]);

  return (
    <>
      <FinderForm key={formKey} initial={initial} busy={busy} onFind={run} />
      {error && (
        <p className={s.error} role="alert">
          {error}
        </p>
      )}
      {result && query && (
        <Results
          result={result}
          heading={heading}
          noon={query.time === "12:00"}
          shareHash={toHash(query)}
          onToggle={() => void run({ ...query, yearly: !query.yearly })}
        />
      )}
    </>
  );
}
