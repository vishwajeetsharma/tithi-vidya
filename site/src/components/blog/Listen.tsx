"use client";

import { useEffect, useRef, useState } from "react";

import { LANGS, type Lang } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

import s from "./blog.module.css";

// "Listen to this article": the article read aloud by the reader's own device
// (the browser's speech synthesis). It costs nothing, works offline once the
// voice is on the device, and sends the text nowhere. It helps people who see
// poorly, who read slowly, or who would rather listen while doing something else.
//
// The voice is the device's, so how it sounds depends on the phone or computer.
// Almost every phone has English and Hindi voices; other languages vary.

type Part = { el: HTMLElement; text: string };
type Status = "idle" | "playing" | "paused";

const SPEEDS = [0.8, 1, 1.2, 1.5];

/**
 * Chrome stops speaking part-way through one long piece of text (after about
 * 15 seconds with some voices), so everything is spoken a sentence or two at a
 * time. Pieces this short also make pausing and changing speed feel instant.
 */
const MOST = 180;

/** A language's voice can stand in for a close one in the same script when a device lacks it. */
const STAND_IN: Partial<Record<string, string>> = { mr: "hi", ne: "hi", sa: "hi" };

/** Cuts text into sentences, at a full stop, question mark or danda that is followed by a space (so "6.32" stays whole). */
function sentences(text: string): string[] {
  const out: string[] = [];
  const end = /[.?!।]+["')\]]*\s+/g;
  let start = 0;
  for (let match = end.exec(text); match; match = end.exec(text)) {
    out.push(text.slice(start, match.index + match[0].length));
    start = match.index + match[0].length;
  }
  if (start < text.length) out.push(text.slice(start));
  return out;
}

/** The text in pieces of at most MOST characters, cut at sentences, then commas, then spaces. */
function pieces(text: string): string[] {
  const out: string[] = [];
  let current = "";
  const push = () => {
    if (current.trim()) out.push(current.trim());
    current = "";
  };
  for (let sentence of sentences(text)) {
    if (current && current.length + sentence.length > MOST) push();
    while (sentence.length > MOST) {
      let cut = sentence.lastIndexOf(",", MOST);
      if (cut < MOST / 2) cut = sentence.lastIndexOf(" ", MOST);
      if (cut <= 0) cut = MOST;
      out.push(sentence.slice(0, cut + 1).trim());
      sentence = sentence.slice(cut + 1);
    }
    current += sentence;
  }
  push();
  return out;
}

/**
 * The article as things to read, in order: headings, paragraphs, list items,
 * table rows and pictures. A table row is read with its column headings ("City:
 * Patna. Sunset: 5:00 pm."), and a picture by its description, so nothing a
 * sighted reader gets is skipped.
 */
function partsOf(root: HTMLElement, picture: string): Part[] {
  const parts: Part[] = [];
  const add = (el: HTMLElement, text: string) => {
    const clean = text.replace(/\s+/g, " ").trim();
    if (clean) parts.push({ el, text: clean });
  };
  for (const el of root.querySelectorAll<HTMLElement>("h2, h3, h4, p, li, tr, figure")) {
    if (el.closest("pre, [aria-hidden='true']")) continue;
    if (el.tagName === "P" && el.closest("li, figure")) continue; // read as part of the item or picture it is in
    if (el.tagName === "TR") {
      if (el.closest("thead")) continue; // read with each row instead
      const heads = [...(el.closest("table")?.querySelectorAll("thead th") ?? [])].map((th) => th.textContent?.trim() ?? "");
      const cells = [...el.children].map((cell, i) => {
        const value = cell.textContent?.trim() ?? "";
        return value && i > 0 && heads[i] ? `${heads[i]}: ${value}` : value;
      });
      add(el, `${cells.filter(Boolean).join(". ")}.`);
    } else if (el.tagName === "FIGURE" || (el.tagName === "P" && !el.textContent?.trim())) {
      const image = el.querySelector("img");
      if (image?.alt) add(el, `${picture}: ${image.alt}. ${el.querySelector("figcaption")?.textContent ?? ""}`);
    } else {
      add(el, el.textContent ?? "");
    }
  }
  return parts;
}

/** The device's best voice for a language ("hi-IN"), or for a close language that reads the same script. */
function pickVoice(voices: SpeechSynthesisVoice[], speech: string): SpeechSynthesisVoice | null {
  const code = (voice: SpeechSynthesisVoice) => voice.lang.replace("_", "-").toLowerCase();
  const wanted = speech.toLowerCase();
  const base = wanted.split("-")[0];
  const quality = (voice: SpeechSynthesisVoice) =>
    (/natural|neural|enhanced|premium/i.test(voice.name) ? 4 : 0) + (/google/i.test(voice.name) ? 2 : 0) + (code(voice) === wanted ? 1 : 0);
  for (const language of [base, STAND_IN[base]]) {
    if (!language) continue;
    const pool = voices.filter((voice) => code(voice).split("-")[0] === language);
    if (pool.length) return pool.sort((a, b) => quality(b) - quality(a))[0];
  }
  return null;
}

const Icon = ({ d }: { d: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d={d} />
  </svg>
);
const PLAY = "M8 5.2v13.6a1 1 0 0 0 1.5.86l11.3-6.8a1 1 0 0 0 0-1.72L9.5 4.34A1 1 0 0 0 8 5.2Z";
const PAUSE = "M7 5h3.5v14H7zM13.5 5H17v14h-3.5z";
const STOP = "M7 7h10v10H7z";

export function Listen({ lang, words, t }: { lang: Lang; words: number; t: Dictionary["listen"] }) {
  const [supported, setSupported] = useState(true);
  const [status, setStatus] = useState<Status>("idle");
  const [rate, setRate] = useState(1);
  const [missing, setMissing] = useState(false);

  const parts = useRef<Part[]>([]);
  const at = useRef({ part: 0, piece: 0 });
  const run = useRef(0); // goes up on every start, pause and stop, so a finished piece from before is ignored
  const speaking = useRef<SpeechSynthesisUtterance | null>(null); // kept, or Chrome forgets it mid-sentence
  const speed = useRef(rate);

  useEffect(() => {
    // Some in-app browsers have no speech at all: the button goes, since it could do nothing.
    if (!(window as { speechSynthesis?: SpeechSynthesis }).speechSynthesis) {
      const hide = setTimeout(() => setSupported(false), 0);
      return () => clearTimeout(hide);
    }
    // Reading stops when the reader leaves the page.
    const stopAll = () => window.speechSynthesis.cancel();
    window.addEventListener("pagehide", stopAll);
    return () => {
      window.removeEventListener("pagehide", stopAll);
      stopAll();
      document.querySelector("[data-speaking]")?.removeAttribute("data-speaking");
    };
  }, []);

  function mark(part: Part | null) {
    document.querySelector("[data-speaking]")?.removeAttribute("data-speaking");
    if (!part) return;
    part.el.dataset.speaking = "";
    // Keep the piece being read on screen, without jumping when it already is.
    const box = part.el.getBoundingClientRect();
    if (box.top < 90 || box.bottom > window.innerHeight - 40) {
      const calm = document.documentElement.dataset.motion !== "on";
      part.el.scrollIntoView({ block: "center", behavior: calm ? "auto" : "smooth" });
    }
  }

  function speak(part: number, piece: number) {
    const synth = window.speechSynthesis;
    const mine = ++run.current;
    synth.cancel();
    const current = parts.current[part];
    if (!current) return stop();
    const list = pieces(current.text);
    if (piece >= list.length) return speak(part + 1, 0);
    at.current = { part, piece };
    mark(current);

    const utterance = new SpeechSynthesisUtterance(list[piece]);
    const voice = pickVoice(synth.getVoices(), LANGS[lang].speech);
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang ?? LANGS[lang].speech;
    utterance.rate = speed.current;
    const next = () => {
      if (run.current === mine) speak(part, piece + 1);
    };
    utterance.onend = next;
    // "interrupted" and "canceled" are our own pause, stop or speed change.
    utterance.onerror = (event) => event.error !== "interrupted" && event.error !== "canceled" && next();
    speaking.current = utterance;
    synth.speak(utterance);
    setStatus("playing");
  }

  function start() {
    const body = document.querySelector<HTMLElement>("[data-article-body]");
    if (!body) return;
    parts.current = partsOf(body, t.picture);
    // Voices can load late, so the check happens at the tap. No voice at all listed means the device hasn't said yet.
    const voices = window.speechSynthesis.getVoices();
    setMissing(voices.length > 0 && !pickVoice(voices, LANGS[lang].speech));
    speak(0, 0);
  }

  function pause() {
    // Stopping and starting the same piece again works on every phone; the browser's own pause does not on Android.
    run.current++;
    window.speechSynthesis.cancel();
    setStatus("paused");
  }

  function stop() {
    run.current++;
    window.speechSynthesis.cancel();
    mark(null);
    at.current = { part: 0, piece: 0 };
    setStatus("idle");
  }

  function changeSpeed(value: number) {
    speed.current = value;
    setRate(value);
    if (status === "playing") speak(at.current.part, at.current.piece);
  }

  if (!supported) return null;
  const minutes = Math.max(1, Math.round(words / 150));

  return (
    <div className={s.listen} data-status={status}>
      {status === "idle" ? (
        <button className={s.listenStart} type="button" onClick={start}>
          <Icon d={PLAY} />
          {t.listen}
          <span>{t.minutes.replace("{n}", String(minutes))}</span>
        </button>
      ) : (
        <div className={s.listenBar} role="group" aria-label={t.listen}>
          {status === "playing" ? (
            <button className={s.listenStart} type="button" onClick={pause}>
              <Icon d={PAUSE} />
              {t.pause}
            </button>
          ) : (
            <button className={s.listenStart} type="button" onClick={() => speak(at.current.part, at.current.piece)}>
              <Icon d={PLAY} />
              {t.resume}
            </button>
          )}
          <button className={s.listenButton} type="button" onClick={stop}>
            <Icon d={STOP} />
            {t.stop}
          </button>
          <label className={s.listenSpeed}>
            {t.speed}
            <select value={rate} onChange={(event) => changeSpeed(Number(event.target.value))}>
              {SPEEDS.map((value) => (
                <option key={value} value={value}>
                  {value}×
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      <p className="visuallyHidden" role="status">
        {status === "playing" ? t.reading : ""}
      </p>
      {missing && status !== "idle" && <p className={s.listenNote}>{t.noVoice.replace("{language}", LANGS[lang].name)}</p>}
    </div>
  );
}
