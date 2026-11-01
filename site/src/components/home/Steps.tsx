import { CalendarIcon, ClockIcon, PinIcon, SparkIcon } from "@/components/Icons";

import s from "./home.module.css";

const CARDS = [
  { icon: CalendarIcon, title: "Your birth date", body: "This tells us the moon month you were born in." },
  { icon: ClockIcon, title: "Your birth time", body: "A tithi can change at any hour. On 1 January 2000, a baby born in India at 10 am and a baby born at noon have different tithis." },
  { icon: PinIcon, title: "Your birth place", body: "Sunrise comes at a different time in each city, so your dates can change too." },
  { icon: SparkIcon, title: "Your answer", body: "Your tithi, your moon month, and your moon birthday for the next 100 years.", answer: true },
];

export function Steps() {
  return (
    <section className={s.steps} aria-labelledby="steps-title" data-steps>
      <div className="wrap">
        <h2 id="steps-title" className={`display ${s.sceneTitle}`} data-reveal>
          Three small things. <em className="gradientText">One big answer.</em>
        </h2>
        <div className={s.stepsArea}>
          <ol className={s.stepCards}>
            {CARDS.map((card) => (
              <li key={card.title} className={`${s.stepCard} ${card.answer ? s.stepAnswer : ""}`} data-reveal>
                <span className={s.stepIcon}>
                  <card.icon />
                </span>
                <h3 className={s.stepTitle}>{card.title}</h3>
                <p>{card.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
