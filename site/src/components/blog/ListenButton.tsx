"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import s from "./blog.module.css";

// The speed button steps through these, then starts again.
const SPEEDS = [1, 1.25, 1.5, 0.75];

/** What gets read, in order: the title, the summary, then the article. Code and tables are skipped. */
const READ = "h1, [data-listen-lead], [data-article-body] :is(h2, h3, p, li, figcaption)";

/**
 * The language to read in. On Google Translate's copy of the page this is the
 * language chosen there, so the translated text is read in that language.
 */
function pageLanguage(): string {
  const chosen = new URLSearchParams(location.search).get("_x_tr_tl");
  return (chosen || document.documentElement.lang || "en").toLowerCase();
}

/** The device's best voice for a language: an exact match if there is one, preferring the more natural ones. */
function pickVoice(language: string): SpeechSynthesisVoice | null {
  const base = language.split("-")[0];
  const voices = speechSynthesis.getVoices().filter((voice) => voice.lang.toLowerCase().split(/[-_]/)[0] === base);
  const score = (voice: SpeechSynthesisVoice) =>
    (voice.lang.toLowerCase().replace("_", "-") === language ? 4 : 0) +
    (/natural|enhanced|premium|neural/i.test(voice.name) ? 2 : 0) +
    (voice.lang.toLowerCase().endsWith("-in") ? 1 : 0);
  return voices.sort((a, b) => score(b) - score(a))[0] ?? null;
}

/** An element's own words. A list item's inner lists and paragraphs are read separately, so they are left out here. */
function textOf(element: HTMLElement): string {
  if (element.tagName !== "LI") return element.innerText.trim();
  const copy = element.cloneNode(true) as HTMLElement;
  copy.querySelectorAll("ul, ol, p").forEach((inner) => inner.remove());
  return (copy.textContent ?? "").replace(/\s+/g, " ").trim();
}

function blocks(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>(READ)].filter((element) => !element.closest("pre, table") && textOf(element));
}

type Status = "idle" | "playing" | "paused";

// Whether the browser can speak never changes, so there is nothing to subscribe to.
const never = () => () => {};
const canSpeak = () => "speechSynthesis" in window;
const notWhileBuilding = () => false;

/**
 * Reads the article aloud with the device's own voice: free, private, and no
 * audio files. Pausing stops the current paragraph and starts it again on
 * resume, because speechSynthesis.pause() does not work on every phone.
 */
export function ListenButton() {
  const supported = useSyncExternalStore(never, canSpeak, notWhileBuilding);
  const [status, setStatus] = useState<Status>("idle");
  const [part, setPart] = useState(0);
  const [total, setTotal] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [problem, setProblem] = useState("");
  const run = useRef(0);
  const list = useRef<HTMLElement[]>([]);
  const mainButton = useRef<HTMLButtonElement>(null);

  const mark = (element: HTMLElement | null) => {
    document.querySelectorAll("[data-speaking]").forEach((other) => other.removeAttribute("data-speaking"));
    if (!element) return;
    element.setAttribute("data-speaking", "");
    const box = element.getBoundingClientRect();
    if (box.top < 90 || box.bottom > innerHeight - 40) {
      const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
      element.scrollIntoView({ block: "center", behavior: still ? "auto" : "smooth" });
    }
  };

  const stop = useCallback(() => {
    run.current += 1;
    if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
    mark(null);
    setStatus("idle");
    setPart(0);
  }, []);

  const speakFrom = useCallback((index: number, rate: number) => {
    const token = ++run.current;
    speechSynthesis.cancel();
    const language = pageLanguage();
    const voice = pickVoice(language);
    if (!voice && !language.startsWith("en")) {
      setProblem("This device has no voice for this language. Try another device or browser, or listen in English.");
    }
    const say = (i: number) => {
      if (token !== run.current) return;
      const element = list.current[i];
      if (!element) {
        mark(null);
        setStatus("idle");
        setPart(0);
        return;
      }
      setPart(i);
      mark(element);
      const utterance = new SpeechSynthesisUtterance(textOf(element));
      utterance.lang = voice?.lang ?? language;
      if (voice) utterance.voice = voice;
      utterance.rate = rate;
      utterance.onend = () => say(i + 1);
      utterance.onerror = (event) => {
        if (token !== run.current || event.error === "interrupted" || event.error === "canceled") return;
        say(i + 1);
      };
      speechSynthesis.speak(utterance);
    };
    setStatus("playing");
    say(index);
  }, []);

  useEffect(() => {
    if (!canSpeak()) return;
    // Voices load after the page on some browsers; asking once starts that.
    speechSynthesis.getVoices();
    const leave = () => stop();
    window.addEventListener("pagehide", leave);
    return () => {
      window.removeEventListener("pagehide", leave);
      stop();
    };
  }, [stop]);

  if (!supported) return null;

  function play() {
    setProblem("");
    if (status === "paused") return speakFrom(part, speed);
    list.current = blocks();
    setTotal(list.current.length);
    speakFrom(0, speed);
  }

  function pause() {
    run.current += 1;
    speechSynthesis.cancel();
    setStatus("paused");
  }

  function changeSpeed(next: number) {
    setSpeed(next);
    if (status === "playing") speakFrom(part, next);
  }

  return (
    <div className={s.listen}>
      {status === "playing" ? (
        <button ref={mainButton} type="button" className="btn btnPrimary" onClick={pause}>
          <PauseIcon />
          Pause
        </button>
      ) : (
        <button ref={mainButton} type="button" className="btn btnGhost" onClick={play}>
          <PlayIcon />
          {status === "paused" ? "Resume" : "Listen"}
        </button>
      )}
      {status !== "idle" && (
        <>
          <button
            type="button"
            className={s.listenStop}
            onClick={() => {
              stop();
              // This button goes away when stopped, so focus moves back to Listen.
              mainButton.current?.focus();
            }}
            aria-label="Stop listening"
          >
            <StopIcon />
          </button>
          <button
            type="button"
            className={s.listenSpeed}
            onClick={() => changeSpeed(SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length])}
            aria-label={`Reading speed ${speed} times. Change speed`}
          >
            {speed}×
          </button>
          <span className={s.listenPart}>
            {part + 1} of {total}
          </span>
        </>
      )}
      {status === "idle" && !problem && (
        <p className={s.listenHint}>Hear it read aloud. To listen in another language, use Translate, then press Listen on the translated page.</p>
      )}
      {problem && (
        <p className={s.listenProblem} role="status">
          {problem}
        </p>
      )}
    </div>
  );
}

function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.6-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6" y="5" width="4" height="14" rx="1.2" />
      <rect x="14" y="5" width="4" height="14" rx="1.2" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}
