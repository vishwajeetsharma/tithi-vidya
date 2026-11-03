import Link from "next/link";

import { ArrowIcon } from "@/components/Icons";

import s from "./home.module.css";

export function Credit() {
  return (
    <section className={s.credit} aria-labelledby="credit-title" data-credit>
      <div className={`wrap ${s.creditInner}`}>
        <h2 id="credit-title" className="eyebrow" data-reveal>
          Who made this?
        </h2>
        <p className={`display ${s.creditText}`} data-reveal>
          Built with <em className="gradientText">belief and love</em> by <em className="gradientText">Vishwajeet Sharma</em>.
        </p>
        <div data-reveal>
          <Link className="btn btnGhost" href="/how-it-works">
            See how it was made
            <ArrowIcon />
          </Link>
        </div>
      </div>
    </section>
  );
}
