"use client";

import { useEffect, useState } from "react";

import { MoonPhase } from "@/components/MoonPhase";
import { moonState } from "@/lib/moon-state";
import { tithiNow, type TithiNow } from "@/lib/tithi-now";

import s from "./home.module.css";

function until(unix: number): string {
  const hours = Math.round((unix - Date.now() / 1000) / 3600);
  if (hours < 1) return "ends within the hour";
  return `ends in ${hours} hour${hours === 1 ? "" : "s"}`;
}

/** Today's real tithi, the same everywhere on Earth. Loads after the page is ready. */
export function LiveTithi() {
  const [now, setNow] = useState<TithiNow | null>(null);

  useEffect(() => {
    let live = true;
    const load = () => {
      tithiNow()
        .then((value) => {
          if (!live || !value) return;
          setNow(value);
          moonState.onToday?.(value.elongation);
        })
        .catch(() => {});
    };
    const idle = window.requestIdleCallback?.(load, { timeout: 2500 }) ?? window.setTimeout(load, 1200);
    return () => {
      live = false;
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
    };
  }, []);

  return (
    <p className={s.live} data-ready={now ? "true" : undefined}>
      {now && (
        <>
          <MoonPhase elongation={now.elongation} size={26} />
          <span>
            Right now it is <strong>{now.tithi}</strong>
            <span className={s.liveEnds}> · {until(now.ends)}</span>
          </span>
        </>
      )}
    </p>
  );
}
