import Link from "next/link";

import { ArrowIcon, LockIcon, SparkIcon } from "@/components/Icons";

import s from "./home.module.css";

export function Proof() {
  return (
    <section className={s.proof} aria-labelledby="proof-title">
      <div className="wrap">
        <h2 id="proof-title" className={`display ${s.sceneTitle}`} data-reveal>
          We did not guess. <em className="gradientText">We checked.</em>
        </h2>
        <ul className={s.bento}>
          <li className={`${s.bentoCard} ${s.bentoWide}`} data-reveal>
            <p className={`display ${s.bentoNumber}`}>
              <span data-count="92839">92,839</span>
            </p>
            <p>tithi start times worked out from NASA JPL data, the same kind of data used to fly spacecraft. They cover the years 1900 to 2149.</p>
          </li>
          <li className={s.bentoCard} data-reveal>
            <p className={`display ${s.bentoNumber}`}>
              <span data-count="99.99" data-decimals="2">99.99</span>%
            </p>
            <p>of 91,311 days at New Delhi matched a second, separate astronomy system. The other 8 days were all within 18 seconds of a tithi change.</p>
          </li>
          <li className={s.bentoCard} data-reveal>
            <p className={`display ${s.bentoNumber}`}>
              <span data-count="3095">3,095</span>
            </p>
            <p>moon month names checked the same way, with no differences.</p>
          </li>
          <li className={`${s.bentoCard} ${s.bentoPrivate}`} data-reveal>
            <span className={s.stepIcon}>
              <LockIcon />
            </span>
            <p>
              <strong>Private by design.</strong> It runs on your own phone or computer. We never see your birth details.
            </p>
          </li>
          <li className={`${s.bentoCard} ${s.bentoLink}`} data-reveal>
            <SparkIcon className={s.bentoSpark} />
            <p className="display">No secrets. See the real code and every test.</p>
            <Link className="btn btnLight" href="/how-it-works">
              How it works
              <ArrowIcon />
            </Link>
          </li>
        </ul>
      </div>
    </section>
  );
}
