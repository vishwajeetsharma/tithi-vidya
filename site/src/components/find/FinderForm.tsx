"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { ArrowIcon } from "@/components/Icons";
import places from "@/generated/places.json";
import type { BirthQuery } from "@/lib/engine";
import { holdQuery } from "@/lib/query";

import s from "./find.module.css";

const OTHER = "__other";
const NOON = "12:00";
const INDIA = places.filter((p) => p.tz === "Asia/Kolkata");
const WORLD = places.filter((p) => p.tz !== "Asia/Kolkata");

type Props = {
  /** The short home page form, which sends you to the finder page. */
  compact?: boolean;
  initial?: BirthQuery | null;
  busy?: boolean;
  onFind?: (query: BirthQuery) => void;
};

export function FinderForm({ compact = false, initial, busy = false, onFind }: Props) {
  const router = useRouter();
  const [date, setDate] = useState(initial?.date ?? "");
  const [time, setTime] = useState(initial?.time ?? "");
  const [noTime, setNoTime] = useState(false);
  const [place, setPlace] = useState(initial ? (initial.place ?? OTHER) : "New Delhi");
  const [lat, setLat] = useState(initial?.lat === undefined ? "" : String(initial.lat));
  const [lon, setLon] = useState(initial?.lon === undefined ? "" : String(initial.lon));
  const [tz, setTz] = useState(initial?.tz ?? "");
  const [yearly, setYearly] = useState(initial?.yearly ?? true);
  const id = compact ? "home" : "find";
  const custom = place === OTHER;

  const choosePlace = (value: string) => {
    setPlace(value);
    if (value === OTHER && !tz) setTz(Intl.DateTimeFormat().resolvedOptions().timeZone);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const when = { date, time: noTime ? NOON : time, yearly };
    const query: BirthQuery = custom ? { ...when, lat: Number(lat), lon: Number(lon), tz: tz.trim() } : { ...when, place };
    if (onFind) onFind(query);
    else {
      holdQuery(query);
      router.push("/find");
    }
  };

  return (
    // autoComplete="off" stops Firefox refilling the fields after a refresh, which should start over.
    <form className={s.form} onSubmit={submit} autoComplete="off">
      <div className={s.fields}>
        <div className={s.field}>
          <label htmlFor={`${id}-date`}>Birth date</label>
          <input
            id={`${id}-date`}
            className={s.input}
            type="date"
            min="1900-01-01"
            max="2149-12-31"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className={s.field}>
          <label htmlFor={`${id}-time`}>Birth time</label>
          <input
            id={`${id}-time`}
            className={s.input}
            type="time"
            required={!noTime}
            disabled={noTime}
            value={noTime ? NOON : time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
      </div>
      <label className={s.check}>
        <input type="checkbox" checked={noTime} onChange={(e) => setNoTime(e.target.checked)} />I do not know my birth time
      </label>

      <div className={s.field}>
        <label htmlFor={`${id}-place`}>Birth place</label>
        <select id={`${id}-place`} className={s.input} value={place} onChange={(e) => choosePlace(e.target.value)}>
          <optgroup label="India">
            {INDIA.map((p) => (
              <option key={p.name}>{p.name}</option>
            ))}
          </optgroup>
          <optgroup label="Around the world">
            {WORLD.map((p) => (
              <option key={p.name}>{p.name}</option>
            ))}
          </optgroup>
          <option value={OTHER}>Somewhere else (enter coordinates)</option>
        </select>
      </div>

      {custom && (
        <div className={s.fields}>
          <div className={s.field}>
            <label htmlFor={`${id}-lat`}>Latitude</label>
            <input
              id={`${id}-lat`}
              className={s.input}
              type="number"
              step="any"
              min="-90"
              max="90"
              required
              placeholder="28.6139"
              aria-describedby={`${id}-lat-hint`}
              value={lat}
              onChange={(e) => setLat(e.target.value)}
            />
            <p id={`${id}-lat-hint`} className={s.hint}>
              North is positive.
            </p>
          </div>
          <div className={s.field}>
            <label htmlFor={`${id}-lon`}>Longitude</label>
            <input
              id={`${id}-lon`}
              className={s.input}
              type="number"
              step="any"
              min="-180"
              max="180"
              required
              placeholder="77.2090"
              aria-describedby={`${id}-lon-hint`}
              value={lon}
              onChange={(e) => setLon(e.target.value)}
            />
            <p id={`${id}-lon-hint`} className={s.hint}>
              East is positive.
            </p>
          </div>
          <div className={s.field}>
            <label htmlFor={`${id}-tz`}>Time zone</label>
            <input
              id={`${id}-tz`}
              className={s.input}
              type="text"
              required
              autoComplete="off"
              spellCheck={false}
              placeholder="Asia/Kolkata"
              aria-describedby={`${id}-tz-hint`}
              value={tz}
              onChange={(e) => setTz(e.target.value)}
            />
            <p id={`${id}-tz-hint`} className={s.hint}>
              A name like Asia/Kolkata.
            </p>
          </div>
        </div>
      )}

      {!compact && (
        <fieldset className={s.fieldset}>
          <legend className={s.legend}>Show me</legend>
          <div className={s.modes}>
            <label className={s.mode}>
              <input type="radio" name="mode" checked={yearly} onChange={() => setYearly(true)} />
              <span>My moon birthday</span>
              <small>Once a year, in my moon month</small>
            </label>
            <label className={s.mode}>
              <input type="radio" name="mode" checked={!yearly} onChange={() => setYearly(false)} />
              <span>Every return of my tithi</span>
              <small>About 12 dates a year</small>
            </label>
          </div>
        </fieldset>
      )}

      <button className={`btn btnPrimary ${s.submit}`} type="submit" disabled={busy}>
        {busy ? "Finding your dates…" : "Find my dates"}
        <ArrowIcon />
      </button>
    </form>
  );
}
