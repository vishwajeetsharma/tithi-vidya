"use client";

import { useState } from "react";

import { DRIFT } from "@/lib/examples";

import s from "./home.module.css";

const DAY = 86400000;
const parse = (iso: string) => new Date(`${iso}T12:00:00Z`);
const longDate = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** Days after 15 May in the same year, so every year shares one scale. */
const dayOf = (iso: string) => {
  const d = parse(iso);
  return (d.getTime() - Date.UTC(d.getUTCFullYear(), 4, 15, 12)) / DAY;
};

const TOP = dayOf("2026-07-01");
const BOTTOM = dayOf("2026-05-20");
const POINTS = DRIFT.map((iso, i) => ({
  iso,
  year: parse(iso).getUTCFullYear(),
  x: 3 + (i / (DRIFT.length - 1)) * 94,
  y: 100 - ((dayOf(iso) - BOTTOM) / (TOP - BOTTOM)) * 100,
}));
const GRID = [
  { label: "1 Jun", y: 100 - ((dayOf("2026-06-01") - BOTTOM) / (TOP - BOTTOM)) * 100 },
  { label: "15 Jun", y: 100 - ((dayOf("2026-06-15") - BOTTOM) / (TOP - BOTTOM)) * 100 },
  { label: "1 Jul", y: 0 },
];
const CURVE = POINTS.reduce((path, p, i) => {
  if (i === 0) return `M${p.x} ${p.y}`;
  const q = POINTS[i - 1];
  const mid = (q.x + p.x) / 2;
  return `${path}C${mid} ${q.y} ${mid} ${p.y} ${p.x} ${p.y}`;
}, "");

export function DriftChart() {
  const [active, setActive] = useState<number | null>(null);
  const shown = active === null ? null : POINTS[active];

  return (
    <figure className={s.chart}>
      <div className={s.chartPlot} role="img" aria-label="Line chart. The date of one tithi from 2026 to 2037 falls about 11 days each year, then jumps back about 19 days every 2 or 3 years. It stays between 27 May and 24 June.">
        {GRID.map((line) => (
          <div key={line.label} className={s.chartGrid} style={{ top: `${line.y}%` }}>
            <span>{line.label}</span>
          </div>
        ))}
        <svg className={s.chartLine} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" data-drift-line>
          <path d={CURVE} vectorEffect="non-scaling-stroke" />
        </svg>
        {POINTS.map((p, i) => (
          <span key={p.iso} className={s.chartDotWrap} style={{ left: `${p.x}%`, top: `${p.y}%` }} data-drift-dot>
            <span className={s.chartDot} onPointerEnter={() => setActive(i)} onPointerLeave={() => setActive(null)} />
          </span>
        ))}
        {shown && (
          <div className={s.chartTip} style={{ left: `${Math.min(Math.max(shown.x, 16), 84)}%`, top: `${shown.y}%` }}>
            {longDate.format(parse(shown.iso))}
          </div>
        )}
        <span className={s.chartNote} style={{ left: "6.5%", top: "9%" }} data-drift-note="1.2">
          24 June 2026
        </span>
        <span className={`${s.chartNote} ${s.chartNoteSoft}`} style={{ left: "3%", top: "83%" }} data-drift-note="2.6">
          11 days sooner, each year
        </span>
        <span className={`${s.chartNote} ${s.chartNoteJump}`} style={{ left: "31%", top: "3%" }} data-drift-note="3.6">
          Extra month: the date jumps back
        </span>
      </div>
      <div className={s.chartYears} aria-hidden="true">
        {POINTS.map((p) => (
          <span key={p.year} style={{ left: `${p.x}%` }}>
            {p.year}
          </span>
        ))}
      </div>
      <figcaption className="visuallyHidden">The date of one tithi at New Delhi, year by year.</figcaption>
      <ul className="visuallyHidden">
        {POINTS.map((p) => (
          <li key={p.iso}>{longDate.format(parse(p.iso))}</li>
        ))}
      </ul>
    </figure>
  );
}
