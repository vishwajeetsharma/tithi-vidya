"use client";

import { useEffect, useId, useRef, useState } from "react";

import { FireIcon } from "@/components/Icons";
import { searchTerms } from "@/lib/search";

import s from "./blog.module.css";

/** Topics shown as buttons straight away. The rest are a click away, so a blog with many topics stays tidy. On phones the buttons sit in one row that scrolls sideways. */
const SHOWN = 8;
/** With more topics than this, the full list gets a box to find one. */
const FINDABLE = 16;

type Props = {
  counts: [string, number][];
  active: string;
  onPick: (tag: string) => void;
  /** The Trending button, once posts have views: whether it's on, and what pressing it does. */
  trending?: { on: boolean; toggle: () => void };
};

type ButtonProps = { tag: string; count: number; active: boolean; onPick: (tag: string) => void };

function TopicButton({ tag, count, active, onPick }: ButtonProps) {
  return (
    <button type="button" className={s.topic} aria-pressed={active} onClick={() => onPick(active ? "" : tag)}>
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
 * topics". The picked topic always shows among the buttons. Trending, the
 * most read articles, comes first, after All.
 */
export function Topics({ counts, active, onPick, trending }: Props) {
  const [open, setOpen] = useState(false);
  const [find, setFind] = useState("");
  const panel = useId();
  const row = useRef<HTMLDivElement>(null);

  // On phones the row scrolls sideways: bring the picked button into view, say after a reload with a topic picked.
  useEffect(() => {
    const box = row.current;
    const on = box?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!box || !on || box.scrollWidth <= box.clientWidth) return;
    const edge = box.getBoundingClientRect();
    const chip = on.getBoundingClientRect();
    if (chip.left < edge.left || chip.right > edge.right) box.scrollLeft += chip.left - edge.left - parseFloat(getComputedStyle(box).paddingLeft);
  }, [active, trending?.on]);

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
      <div ref={row} className={s.topics} role="group" aria-label="Topics">
        <button type="button" className={s.topic} aria-pressed={!active && !trending?.on} onClick={() => onPick("")}>
          All
        </button>
        {trending && (
          <button type="button" className={`${s.topic} ${s.trendingTopic}`} aria-pressed={trending.on} onClick={trending.toggle}>
            <FireIcon />
            Trending
          </button>
        )}
        {shown.map(([tag, count]) => (
          <TopicButton key={tag} tag={tag} count={count} active={tag === active} onPick={onPick} />
        ))}
        {counts.length > SHOWN && (
          <button
            type="button"
            className={`${s.topic} ${s.moreTopics}`}
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
