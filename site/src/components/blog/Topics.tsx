"use client";

import { useId, useState } from "react";

import { searchTerms } from "@/lib/search";

import s from "./blog.module.css";

/** Topics shown as buttons straight away, on wide screens and on phones. The rest are a click away, so a blog with many topics stays tidy. */
const SHOWN = 8;
const SHOWN_ON_PHONES = 4;
/** With more topics than this, the full list gets a box to find one. */
const FINDABLE = 16;

type Props = { counts: [string, number][]; active: string; onPick: (tag: string) => void };

type ButtonProps = { tag: string; count: number; active: boolean; onPick: (tag: string) => void; className?: string };

function TopicButton({ tag, count, active, onPick, className = "" }: ButtonProps) {
  return (
    <button type="button" className={`${s.topic} ${className}`} aria-pressed={active} onClick={() => onPick(active ? "" : tag)}>
      {tag}{" "}
      <span>
        {count}
        <span className="visuallyHidden"> {count === 1 ? "article" : "articles"}</span>
      </span>
    </button>
  );
}

/**
 * The most used topics as buttons, and every topic, A to Z, behind "All
 * topics". The picked topic always shows among the buttons.
 */
export function Topics({ counts, active, onPick }: Props) {
  const [open, setOpen] = useState(false);
  const [find, setFind] = useState("");
  const panel = useId();

  const shown = counts.slice(0, SHOWN);
  const picked = counts.find(([tag]) => tag === active) ?? (active ? ([active, 0] as [string, number]) : null);
  if (picked && !shown.includes(picked)) shown.push(picked);

  const wanted = searchTerms(find);
  const listed = [...counts]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .filter(([tag]) => {
      const name = searchTerms(tag).join(" ");
      return wanted.every((term) => name.includes(term));
    });

  const pick = (tag: string) => {
    onPick(tag);
    setOpen(false);
    setFind("");
  };

  return (
    <>
      <div className={s.topics} role="group" aria-label="Topics">
        <button type="button" className={s.topic} aria-pressed={!active} onClick={() => onPick("")}>
          All
        </button>
        {shown.map(([tag, count], i) => (
          <TopicButton
            key={tag}
            tag={tag}
            count={count}
            active={tag === active}
            onPick={onPick}
            className={i >= SHOWN_ON_PHONES && tag !== active ? s.topicWide : ""}
          />
        ))}
        {counts.length > SHOWN_ON_PHONES && (
          <button
            type="button"
            className={`${s.topic} ${s.moreTopics} ${counts.length > SHOWN ? "" : s.topicPhone}`}
            aria-expanded={open}
            aria-controls={panel}
            onClick={() => setOpen(!open)}
          >
            {open ? "Fewer topics" : `All ${counts.length} topics`}
          </button>
        )}
      </div>
      {open && (
        <div
          id={panel}
          className={s.topicPanel}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
          }}
        >
          {counts.length > FINDABLE && (
            <input
              className={`${s.field} ${s.topicFind}`}
              type="search"
              value={find}
              placeholder="Find a topic"
              aria-label="Find a topic"
              autoComplete="off"
              // Opened to look for one, so the box is ready to type in.
              autoFocus
              onChange={(event) => setFind(event.target.value)}
              onKeyDown={(event) => {
                // Enter picks the only topic left.
                if (event.key === "Enter" && listed.length === 1) pick(listed[0][0]);
              }}
            />
          )}
          {listed.length ? (
            <ul className={s.topicIndex}>
              {listed.map(([tag, count]) => (
                <li key={tag}>
                  <TopicButton tag={tag} count={count} active={tag === active} onPick={pick} />
                </li>
              ))}
            </ul>
          ) : (
            <p className={s.topicNone}>No topic has that name.</p>
          )}
        </div>
      )}
    </>
  );
}
