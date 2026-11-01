import { MoonPhase } from "@/components/MoonPhase";

import s from "./home.module.css";

const CENTER = 320;
const RADIUS = 268;

function arc(fromDeg: number, toDeg: number, radius: number): string {
  const point = (deg: number) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return `${(CENTER + radius * Math.cos(a)).toFixed(2)} ${(CENTER + radius * Math.sin(a)).toFixed(2)}`;
  };
  const large = toDeg - fromDeg > 180 ? 1 : 0;
  return `M${point(fromDeg)}A${radius} ${radius} 0 ${large} 1 ${point(toDeg)}`;
}

/** Each stage's `start` is the share of the moon month where its words appear. */
const STAGES = [
  {
    start: 0,
    title: "It starts at new moon.",
    body: "The moon sits next to the sun, so we can not see it. Then it starts to move away.",
  },
  {
    start: 0.06,
    title: "Every 12° is one tithi.",
    body: "Think of the gap between the sun and the moon. Each time the gap grows by 12°, a new tithi starts. One tithi lasts about a day, from 20 to 27 hours.",
  },
  {
    start: 0.2,
    title: "First, the moon grows.",
    body: "The first 15 tithis are Shukla Paksha, the bright half. The moon gets bigger each night, up to the full moon, called Purnima.",
  },
  {
    start: 0.52,
    title: "Then, the moon shrinks.",
    body: "The next 15 tithis are Krishna Paksha, the dark half. The moon gets smaller each night, down to the new moon, called Amavasya.",
  },
  {
    start: 0.93,
    title: "30 tithis. One moon month.",
    body: "12° × 30 = 360°, one full circle. It takes about 29.5 days. Then it all starts again.",
  },
];

export function TithiScene() {
  return (
    <section id="what-is-a-tithi" className={s.tithi} aria-labelledby="tithi-title" data-scene="tithi">
      <div className={s.tithiStick} data-sticky>
        <div className={`wrap ${s.tithiGrid}`}>
          <div className={s.tithiCopy}>
            <h2 id="tithi-title" className={`display ${s.sceneTitle}`}>
              What is a <em className="gradientText">tithi?</em>
            </h2>
            <ol className={s.stages}>
              {STAGES.map((stage) => (
                <li key={stage.start} className={s.stage} data-stage={stage.start}>
                  <h3 className={s.stageTitle}>{stage.title}</h3>
                  <p>{stage.body}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className={s.dialColumn}>
            <div className={s.dial} data-dial>
              <svg viewBox="0 0 640 640" aria-hidden="true">
                <defs>
                  <path id="pakshaBright" d={arc(14, 166, 306)} />
                  <path id="pakshaDark" d={arc(194, 346, 306)} />
                  <linearGradient id="segOn" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#2758ec" />
                    <stop offset="1" stopColor="#8f35e8" />
                  </linearGradient>
                </defs>
                <text className={s.dialLabel}>
                  <textPath href="#pakshaBright" startOffset="50%" textAnchor="middle">
                    Shukla Paksha · the moon grows
                  </textPath>
                </text>
                <text className={s.dialLabel}>
                  <textPath href="#pakshaDark" startOffset="50%" textAnchor="middle">
                    Krishna Paksha · the moon shrinks
                  </textPath>
                </text>
                {Array.from({ length: 30 }, (_, i) => (
                  <path key={i} className={s.segment} d={arc(i * 12 + 1.9, (i + 1) * 12 - 1.9, RADIUS)} data-seg />
                ))}
                <g className={s.dialSun} transform={`translate(${CENTER} 20)`}>
                  <circle r="15" />
                  {Array.from({ length: 8 }, (_, i) => (
                    <path key={i} d="M0 -21V-27" transform={`rotate(${i * 45})`} />
                  ))}
                </g>
                <g data-head>
                  <circle className={s.dialHead} cx={CENTER} cy={CENTER - RADIUS} r="15" />
                </g>
              </svg>
              <MoonPhase className={s.dialStaticMoon} elongation={125} size={200} />
            </div>
            <p className={s.readout} aria-hidden="true">
              <span className={s.readoutCount}>
                Tithi <b data-tithi-number>1</b> of 30
              </span>
              <span className={`display ${s.readoutName}`} data-tithi-name>
                Shukla Pratipada
              </span>
              <span className={s.readoutGap}>
                Gap from the sun: <b data-tithi-gap>0°</b>
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
