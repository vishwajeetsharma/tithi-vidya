"use client";

import Link from "next/link";
import { useId, useState, type FormEvent } from "react";

import { ArrowIcon } from "@/components/Icons";
import { readSignup, TRAP_FIELD, type SubscribeResult } from "@/lib/newsletter";

import s from "./blog.module.css";

type State = { step: "idle" | "sending" } | { step: "done"; confirm: boolean } | { step: "error"; problem: string };

/**
 * The newsletter signup. It posts to /api/subscribe, which adds the address
 * to Brevo. The address goes in the request body, never in the page address,
 * so analytics can't see it.
 */
export function NewsletterSignup() {
  const id = useId();
  const [state, setState] = useState<State>({ step: "idle" });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = { email: form.get("email"), name: form.get("name"), [TRAP_FIELD]: form.get(TRAP_FIELD) };
    const checked = readSignup(body);
    if ("problem" in checked) return setState({ step: "error", problem: checked.problem });

    setState({ step: "sending" });
    try {
      const response = await fetch("/api/subscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const result = (await response.json()) as SubscribeResult;
      setState(result.ok ? { step: "done", confirm: result.confirm } : { step: "error", problem: result.problem });
    } catch {
      setState({ step: "error", problem: "Sorry, that didn't work. Please check your connection and try again." });
    }
  }

  return (
    <section className={s.signup} aria-labelledby={`${id}-title`}>
      <div className={s.signupText}>
        <p className="eyebrow">The moon letter</p>
        <h2 id={`${id}-title`} className={`display ${s.signupTitle}`}>
          New articles, in your inbox
        </h2>
        <p>One short email when there is something new. No spam, and you can leave at any time.</p>
      </div>

      {state.step === "done" ? (
        <p className={s.signupDone} role="status">
          {state.confirm ? "Almost done. Check your inbox and click the link to confirm." : "You're subscribed. Thank you!"}
        </p>
      ) : (
        // method="post" keeps the address out of the page address, even before the page's script loads.
        <form className={s.signupForm} method="post" onSubmit={submit} noValidate>
          <label className={s.signupField}>
            <span>
              First name <small>(optional)</small>
            </span>
            <input className={s.field} name="name" autoComplete="given-name" maxLength={60} />
          </label>
          <label className={s.signupField}>
            <span>Email</span>
            <input
              className={s.field}
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              aria-invalid={state.step === "error" || undefined}
              aria-describedby={state.step === "error" ? `${id}-problem` : undefined}
            />
          </label>
          {/* For bots only: hidden from people and screen readers. */}
          <input className={s.trap} name={TRAP_FIELD} tabIndex={-1} autoComplete="off" aria-hidden="true" />
          <button className="btn btnPrimary" type="submit" disabled={state.step === "sending"}>
            {state.step === "sending" ? "Subscribing…" : "Subscribe"}
            <ArrowIcon />
          </button>
          {state.step === "error" && (
            <p id={`${id}-problem`} className={s.signupProblem} role="alert">
              {state.problem}
            </p>
          )}
          <p className={s.signupNote}>
            We use Brevo to send it. See our <Link href="/privacy">privacy policy</Link>.
          </p>
        </form>
      )}
    </section>
  );
}
