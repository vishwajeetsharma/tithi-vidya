import { TITHI_WORDS } from "@/lib/moon";

import s from "./home.module.css";

/** The tithi names on a curve, sliding as you scroll. Decoration only. */
export function Ribbon() {
  const words = [...TITHI_WORDS, ...TITHI_WORDS, ...TITHI_WORDS].join("   ✦   ");
  return (
    <div className={s.ribbon} aria-hidden="true" data-ribbon>
      <svg viewBox="0 0 1440 300" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="ribbonInk" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#2758ec" />
            <stop offset="0.55" stopColor="#5a38ee" />
            <stop offset="1" stopColor="#a12fd8" />
          </linearGradient>
          <path id="ribbonCurve" d="M-200 210C80 40 330 50 620 150s560 130 1020-40" />
        </defs>
        <text className={s.ribbonText} fill="url(#ribbonInk)">
          <textPath href="#ribbonCurve" startOffset="-140" data-ribbon-text>
            {words}
          </textPath>
        </text>
      </svg>
    </div>
  );
}
