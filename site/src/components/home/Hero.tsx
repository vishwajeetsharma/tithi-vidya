import Link from "next/link";

import { ArrowIcon, SparkIcon } from "@/components/Icons";

import { LiveTithi } from "./LiveTithi";
import s from "./home.module.css";

/** The word तिथि in Tiro Devanagari, as a shape, so one decoration needs no 120 KB font. */
const TITHI_DEVANAGARI =
  "M180 15H170L90 -37L94 -545H6L-28 -610V-620H99Q81 -648 73 -676Q65 -703 65 -729Q65 -769 86 -803Q106 -837 149 -858Q192 -880 257 -880Q316 -880 377 -860Q438 -839 507 -793Q576 -747 657 -672L630 -641Q577 -686 521 -722Q465 -759 406 -781Q348 -803 288 -803Q235 -803 202 -786Q168 -768 153 -741Q138 -714 138 -683Q138 -666 142 -651Q147 -636 155 -620H261L295 -555V-545H178Z M490 10H480Q409 -82 362 -156Q315 -230 315 -294Q315 -368 372 -402Q430 -435 525 -435H666L667 -545H273L239 -610V-620H834L868 -555V-545H751L753 10H743L663 -42L665 -360H536Q463 -360 428 -328Q392 -295 392 -248Q392 -226 398 -206Q405 -186 420 -162Q436 -138 464 -106Q491 -73 533 -25Z M1020 15H1010L930 -37L934 -545H846L812 -610V-620H939Q920 -650 912 -677Q905 -704 905 -728Q905 -796 960 -839Q1014 -882 1121 -882Q1223 -882 1345 -835Q1467 -788 1620 -677L1598 -643Q1531 -688 1455 -725Q1379 -762 1302 -784Q1225 -805 1154 -805Q1075 -805 1026 -775Q978 -745 978 -686Q978 -672 982 -655Q985 -638 995 -620H1101L1135 -555V-545H1018Z M1446 -133Q1386 -133 1336 -164Q1286 -194 1252 -246Q1217 -297 1204 -358Q1295 -384 1348 -414Q1401 -445 1401 -500Q1401 -534 1381 -548Q1361 -562 1333 -562Q1311 -562 1289 -553Q1267 -544 1253 -528Q1239 -512 1239 -490Q1239 -468 1254 -455Q1269 -442 1288 -432V-421Q1278 -420 1274 -420Q1269 -419 1263 -419Q1216 -419 1188 -448Q1161 -478 1161 -518Q1161 -565 1198 -599Q1234 -633 1293 -633Q1345 -633 1385 -605Q1425 -577 1448 -536Q1471 -494 1471 -454Q1471 -413 1448 -384Q1426 -356 1386 -336Q1346 -315 1294 -296Q1294 -266 1310 -244Q1326 -222 1352 -210Q1379 -197 1408 -197Q1452 -197 1499 -222Q1546 -248 1584 -286L1586 -545H1514L1480 -610V-620H1753L1787 -555V-545H1670L1672 10H1662L1582 -42L1583 -183Q1545 -155 1513 -144Q1481 -133 1446 -133Z";

const SPARKS = [
  { top: "16%", left: "47%", size: 22, delay: "0s" },
  { top: "26%", left: "92%", size: 16, delay: "1.2s" },
  { top: "72%", left: "54%", size: 14, delay: "2.1s" },
  { top: "84%", left: "88%", size: 24, delay: "0.6s" },
  { top: "12%", left: "72%", size: 12, delay: "1.7s" },
];

export function Hero() {
  return (
    <section className={s.hero} aria-labelledby="hero-title" data-hero>
      <svg className={s.heroGhost} viewBox="-40 -800 1840 1000" aria-hidden="true" data-hero-ghost>
        <path d={TITHI_DEVANAGARI} />
      </svg>
      {SPARKS.map((spark) => (
        <SparkIcon
          key={spark.top}
          className={s.spark}
          width={spark.size}
          height={spark.size}
          style={{ top: spark.top, left: spark.left, animationDelay: spark.delay }}
        />
      ))}
      <div className={`wrap ${s.heroInner}`}>
        <div className={s.heroCopy} data-hero-copy>
          <p className={`eyebrow ${s.intro1}`}>Free tithi birthday finder</p>
          <h1 id="hero-title" className={`display ${s.heroTitle}`}>
            <span className={s.line}>
              <span>You have</span>
            </span>{" "}
            <span className={s.line}>
              <em className={`gradientText ${s.heroAccent}`}>two birthdays.</em>
            </span>
          </h1>
          <p className={`${s.heroLead} ${s.intro2}`}>
            One is on the calendar. One is on the moon. Tell us when and where you were born, and we will find your moon
            birthday for the next 100 years.
          </p>
          <div className={`${s.heroActions} ${s.intro3}`}>
            <Link className="btn btnPrimary" href="/find">
              Find my moon birthday
              <ArrowIcon />
            </Link>
            <a className="btn btnGhost" href="#what-is-a-tithi">
              What is a tithi?
            </a>
          </div>
          <div className={s.intro4}>
            <LiveTithi />
          </div>
        </div>
      </div>
    </section>
  );
}
