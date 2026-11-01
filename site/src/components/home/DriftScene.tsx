import { DriftChart } from "./DriftChart";
import s from "./home.module.css";

export function DriftScene() {
  return (
    <section className={s.drift} aria-labelledby="drift-title" data-scene="drift">
      <div className={s.driftStick}>
        <div className={`wrap ${s.driftGrid}`}>
          <div className={s.driftCopy}>
            <h2 id="drift-title" className={`display ${s.sceneTitle}`}>
              Why does the <em className="gradientText">date</em> change?
            </h2>
            <p>
              A calendar year has 365 days. Twelve moon months have only 354. So your tithi comes about{" "}
              <strong className={s.mark} data-drift-mark="0.8">
                11 days sooner
              </strong>{" "}
              each year.
            </p>
            <p>
              Every 2 or 3 years, the calendar adds{" "}
              <strong className={s.mark} data-drift-mark="3.2">
                one extra moon month
              </strong>
              . Then your date jumps back. This is why Diwali and Holi move around too.
            </p>
          </div>
          <div className={s.driftChart}>
            <p className={s.chartTitle}>One tithi, year by year, in New Delhi</p>
            <DriftChart />
          </div>
        </div>
      </div>
    </section>
  );
}
