import { FAQ } from "@/lib/faq";

import s from "./home.module.css";

export function Faq() {
  return (
    <section className={s.faq} aria-labelledby="faq-title">
      <div className={`wrap ${s.faqGrid}`}>
        <h2 id="faq-title" className={`display ${s.sceneTitle}`} data-reveal>
          Good <em className="gradientText">questions</em>
        </h2>
        <div className={s.faqList}>
          {FAQ.map((item) => (
            <details key={item.q} className={s.faqItem} data-reveal>
              <summary>
                <h3>{item.q}</h3>
                <span className={s.faqMark} aria-hidden="true" />
              </summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
