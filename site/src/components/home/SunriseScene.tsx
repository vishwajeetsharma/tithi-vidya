import { SUNRISE } from "@/lib/examples";

import s from "./home.module.css";

const HILLS = [
  "M0 52C60 18 120 14 190 34s130 12 210-20v126H0Z",
  "M0 84c70-30 130-26 200-10s130 8 200-16v82H0Z",
];

export function SunriseScene() {
  return (
    <section className={s.sunrise} aria-labelledby="sunrise-title" data-scene="sunrise">
      <div className={s.sunriseStick}>
        <div className={`wrap ${s.sunriseInner}`}>
          <header className={s.sunriseHead}>
            <h2 id="sunrise-title" className={`display ${s.sceneTitle}`}>
              Why does the <em className="gradientText">place</em> matter?
            </h2>
            <p>
              A calendar day starts at midnight. A panchang day starts at <strong>sunrise</strong>. The tithi running at sunrise gives the day its name.
              And sunrise comes at a different time in each city.
            </p>
          </header>

          <div className={s.clockBar}>
            <p className={s.clockDate}>
              {SUNRISE.date}. A new tithi starts at {SUNRISE.change}, India time.
            </p>
            <p className={s.clockNow} aria-hidden="true">
              <span className={s.clockTime} data-clock>
                05:30
              </span>
              <span className={s.clockTithi}>
                <span>Tithi now</span>
                <b data-running>{SUNRISE.before}</b>
              </span>
            </p>
          </div>

          <ul className={s.cities}>
            {SUNRISE.cities.map((city) => (
              <li key={city.name} className={s.city} data-city={city.name} data-minutes={city.minutes}>
                <div className={s.citySky} aria-hidden="true">
                  <div className={s.cityDay} />
                  <div className={s.citySun} data-sun />
                  <svg viewBox="0 0 400 140" preserveAspectRatio="none">
                    <path d={HILLS[0]} fill="#6f63e6" />
                    <path d={HILLS[1]} fill="#3f33b8" />
                  </svg>
                </div>
                <div className={s.cityText}>
                  <h3 className={s.cityName}>{city.name}</h3>
                  <p>Sun up at {city.sunrise}</p>
                  <p className={s.cityDayName} data-day>
                    That day is <strong>{city.tithi}</strong>
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <p className={`display ${s.sunriseEnd}`} data-sunrise-end>
            Same day. Two cities. <span className="gradientText">Two tithis.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
