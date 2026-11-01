"use client";

import { useMemo, useState, type RefObject } from "react";

import { LinkIcon } from "@/components/Icons";
import { MoonPhase } from "@/components/MoonPhase";
import type { BirthResult, TithiDate } from "@/lib/engine";

import s from "./find.module.css";

function daysUntil(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  const now = new Date();
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000);
}

function inDays(days: number): string {
  if (days === 0) return "It is today!";
  if (days === 1) return "It is tomorrow.";
  return `That is in ${days.toLocaleString("en-US")} days.`;
}

function DateRow({ item, isNext }: { item: TithiDate; isNext: boolean }) {
  return (
    <li className={`${s.dateRow} ${isNext ? s.dateRowNext : ""}`}>
      <div className={s.dateMain}>
        <span>{item.label}</span>
        <span className={s.dateMonth}>{item.month}</span>
        {isNext && <span className={`${s.tag} ${s.tagNext}`}>Next</span>}
        {item.kind === "kshaya" && (
          <span className={s.tag} title="No sunrise falls inside this tithi, so we list the day it falls in.">
            Kshaya: short tithi
          </span>
        )}
        {item.kind === "vriddhi" && (
          <span className={s.tag} title="This tithi covers two sunrises. We list the first day.">
            Vriddhi: also {item.also}
          </span>
        )}
      </div>
      <p className={s.dateSpan}>
        {item.begins} to {item.ends}
      </p>
    </li>
  );
}

/** In "every return" mode there are about 12 dates a year, so they go under year headings. */
function DateList({ dates, yearly, next }: { dates: TithiDate[]; yearly: boolean; next?: TithiDate }) {
  if (yearly) {
    return (
      <ul className={s.dates}>
        {dates.map((item) => (
          <DateRow key={item.date} item={item} isNext={item === next} />
        ))}
      </ul>
    );
  }
  const years: { year: number; items: TithiDate[] }[] = [];
  for (const item of dates) {
    if (years.at(-1)?.year !== item.year) years.push({ year: item.year, items: [] });
    years.at(-1)?.items.push(item);
  }
  return years.map(({ year, items }) => (
    <div key={year} className={s.yearGroup}>
      <h3 className={s.yearTitle}>{year}</h3>
      <ul className={s.dates}>
        {items.map((item) => (
          <DateRow key={item.date} item={item} isNext={item === next} />
        ))}
      </ul>
    </div>
  ));
}

type Props = {
  result: BirthResult;
  heading: RefObject<HTMLHeadingElement | null>;
  noon: boolean;
  onToggle: () => void;
};

export function Results({ result, heading, noon, onToggle }: Props) {
  const { birth, dates, yearly, from, to, place } = result;
  const [copied, setCopied] = useState(false);
  const today = useMemo(() => new Date().toLocaleDateString("en-CA"), []);
  const next = dates.find((d) => d.date >= today);
  const placeName = place.name || `${place.lat}, ${place.lon}`;
  const month =
    birth.month === birth.purnimanta_month
      ? `${birth.month} month`
      : `${birth.month} month (${birth.purnimanta_month} in North India)`;

  const past = useMemo(() => dates.filter((d) => d.date < today), [dates, today]);
  const upcoming = useMemo(() => dates.filter((d) => d.date >= today), [dates, today]);

  const copy = async () => {
    await navigator.clipboard.writeText(location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className={s.results} aria-labelledby="result-title">
      <div className={s.summary}>
        <div className={s.summaryHead}>
          <MoonPhase className={s.summaryMoon} elongation={birth.elongation} size={128} />
          <div>
            <p className="eyebrow">Your tithi</p>
            <h2 id="result-title" ref={heading} tabIndex={-1} className={`display ${s.tithiName}`}>
              {birth.tithi}
            </h2>
            <p className={s.tithiSub}>
              Tithi {birth.number} of 30 · {birth.paksha} Paksha · {month}
            </p>
          </div>
        </div>
        <dl className={s.facts}>
          <div>
            <dt>Born</dt>
            <dd>
              {birth.moment}, {placeName}
            </dd>
          </div>
          <div>
            <dt>Your tithi ran</dt>
            <dd>
              {birth.begins} to {birth.ends}
            </dd>
          </div>
          <div>
            <dt>Panchang day</dt>
            <dd>
              {birth.panchang_date}, from sunrise at {birth.sunrise}. That day is named {birth.udaya_tithi}.
            </dd>
          </div>
        </dl>
        {birth.before_sunrise && <p className={s.note}>You were born before sunrise, so by the panchang your birth belongs to the day before.</p>}
        {noon && <p className={s.note}>We used 12 noon. If your tithi changed that day, your answer may be one tithi off.</p>}
        {result.notes.map((note) => (
          <p key={note} className={s.note}>
            {note}
          </p>
        ))}
      </div>

      {next && (
        <div className={s.next}>
          <p className={s.nextLabel}>{yearly ? "Your next moon birthday" : "Your tithi comes back on"}</p>
          <p className={`display ${s.nextDate}`}>{next.label}</p>
          <p>{inDays(daysUntil(next.date))}</p>
        </div>
      )}

      <div className={s.listHead}>
        <h2 className={`display ${s.listTitle}`}>
          {dates.length.toLocaleString("en-US")} dates, {from} to {to}
        </h2>
        <div className={s.tools}>
          <button className={s.tool} type="button" onClick={onToggle}>
            {yearly ? "Show every return" : "Show once a year"}
          </button>
          <button className={s.tool} type="button" onClick={() => void copy()}>
            <LinkIcon width={16} height={16} />
            {copied ? "Link copied" : "Copy link"}
          </button>
        </div>
      </div>

      {past.length > 0 && (
        <details className={s.pastDates}>
          <summary>Show {past.length.toLocaleString("en-US")} past dates</summary>
          <DateList dates={past} yearly={yearly} next={next} />
        </details>
      )}
      <DateList dates={upcoming} yearly={yearly} next={next} />

      <p className={s.fine}>
        Each date is the day whose sunrise falls inside your tithi, the most common modern rule. Times are local to {placeName}. A kshaya tithi is so short
        that no sunrise falls inside it. A vriddhi tithi is so long that it covers two sunrises.
      </p>
    </section>
  );
}
