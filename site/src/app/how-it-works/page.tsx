import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import Link from "next/link";

import { CodeBlock } from "@/components/how/CodeBlock";
import s from "@/components/how/how.module.css";
import { TocSpy } from "@/components/how/TocSpy";
import { ArrowIcon, ForkIcon, HeartIcon, StarIcon } from "@/components/Icons";
import { JsonLd } from "@/components/JsonLd";
import { MoonPhase } from "@/components/MoonPhase";
import { AUTHOR, CREDIT, REPO_URL, SITE_NAME, siteUrl } from "@/lib/site";

const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

const TITLE = "How It Works and How Accurate It Is";
const DESCRIPTION =
  "See exactly how Tithi Vidya finds your tithi: the NASA JPL data, the real code, every accuracy test, and where it can be wrong.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/how-it-works" },
  openGraph: { type: "article", title: `${TITLE} | ${SITE_NAME}`, description: DESCRIPTION, url: "/how-it-works" },
};

const SECTIONS = [
  { id: "idea", label: "The big idea" },
  { id: "step-1", label: "1. Find the sun and moon" },
  { id: "step-2", label: "2. Find every tithi change" },
  { id: "step-3", label: "3. Look up your moment" },
  { id: "step-4", label: "4. Work out sunrise" },
  { id: "step-5", label: "5. Give each tithi a date" },
  { id: "step-6", label: "6. Name the moon month" },
  { id: "accuracy", label: "How accurate is it?" },
  { id: "simple", label: "Why not a simple formula?" },
  { id: "limits", label: "Where it can be wrong" },
  { id: "choices", label: "Choices we made" },
  { id: "privacy", label: "How the site runs" },
  { id: "open-source", label: "Open for everyone" },
];

const TESTS = [
  ["Tithi at 3,019 moments, half of them within 10 minutes of a change", "JPL DE440, read directly", "All match"],
  ["5,856 sunrises in 8 cities, 1900 to 2149", "JPL DE440, read directly", "Worst gap: 2.7 seconds"],
  ["All 92,839 tithi changes", "Swiss Ephemeris, a separate astronomy system", "Half are within 1.7 seconds. Up to 2026, the worst is 6.5 seconds. The worst of all, near 2150, is 31.7 seconds"],
  ["Tithi at sunrise in New Delhi, every day for 250 years (91,311 days)", "Swiss Ephemeris", "8 days differ. All 8 are within 18 seconds of a tithi change"],
  ["All 3,095 moon month names", "Swiss Ephemeris, with Lahiri ayanamsa", "No differences"],
  ["Sunrise and the end of Purnima on 26 October 2026, New Delhi", "Drik Panchang, one day checked by hand", "Sunrise 06:28:47 against 06:29. Purnima ends 09:41:49 against 09:41"],
  ["The extra months of 2012, 2015, 2018, 2020, 2023 and 2026", "Published calendars", "All match"],
  ["Ugadi dates, 2023 to 2026", "Published dates", "All match, including 2026, when the tithi covers no sunrise"],
];

const BARS = [
  { label: "A simple moon formula with 6 terms", value: 429 },
  { label: "The same data, but sunrise taken at the sun's centre, not its top edge", value: 222 },
  { label: "astronomy-engine, a good free library", value: 20 },
];

const OPEN_SOURCE = [
  { href: REPO_URL, icon: StarIcon, title: "Star it", body: "Like this project? A star on GitHub helps more people find it." },
  { href: `${REPO_URL}/fork`, icon: ForkIcon, title: "Fork it", body: "Make your own copy and build something new with it." },
  { href: `${REPO_URL}/issues`, icon: HeartIcon, title: "Contribute", body: "We are open for contributions. Share an idea, report a bug, or send a fix." },
];

const PHASES = Array.from({ length: 30 }, (_, i) => (i + 0.5) * 12);

export default function HowItWorksPage() {
  const origin = siteUrl().origin;
  return (
    <div className={`${s.page} ${mono.variable}`}>
      <JsonLd
        data={{
          "@graph": [
            {
              "@type": "TechArticle",
              headline: `${TITLE}: ${SITE_NAME}`,
              description: DESCRIPTION,
              url: `${origin}/how-it-works`,
              author: { "@type": "Person", name: AUTHOR },
              inLanguage: "en",
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: origin },
                { "@type": "ListItem", position: 2, name: "How it works", item: `${origin}/how-it-works` },
              ],
            },
          ],
        }}
      />
      <TocSpy ids={SECTIONS.map((section) => section.id)} />

      <header className={`wrap ${s.hero}`}>
        <p className="eyebrow">The full story</p>
        <h1 className={`display ${s.title}`}>
          How it works. <em className="gradientText">No secrets.</em>
        </h1>
        <p className={s.lead}>
          This page shows what the site does, how we tested it, and where it can be wrong. All the code you see here is the real code that runs.
        </p>
        <div className={s.phases} aria-hidden="true">
          {PHASES.map((phase) => (
            <MoonPhase key={phase} elongation={phase} size={34} />
          ))}
        </div>
      </header>

      <div className={`wrap ${s.layout}`}>
        <nav className={s.toc} aria-label="On this page">
          <p className={s.tocTitle}>On this page</p>
          <ol>
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`}>{section.label}</a>
              </li>
            ))}
          </ol>
        </nav>

        <div className={s.content}>
          <section id="idea" className={s.section}>
            <h2 className={`display ${s.h2}`}>The big idea</h2>
            <p>A tithi comes from one number: the gap between the moon and the sun, as seen from Earth. Cut that gap into steps of 12°, and each step is one tithi.</p>
            <p className={s.formula}>tithi = floor((moon − sun) ÷ 12°) + 1</p>
            <p>
              Here is the trick that makes this site work. <strong>A tithi starts at the same moment everywhere on Earth.</strong> Only the date depends on where you are, because each place has its own sunrise.
            </p>
            <p>So we work out every tithi once, ahead of time, and keep the answers in one small file. Your device reads that file and works out sunrise for your place.</p>
            <ol className={s.flow}>
              <li className={s.flowStep}>
                <strong>NASA JPL data</strong>
                Exact sun and moon positions
              </li>
              <li className={s.flowStep}>
                <strong>Python script</strong>
                Finds every tithi change, once
              </li>
              <li className={s.flowStep}>
                <strong>A 367 KB table</strong>
                92,839 moments, 1899 to 2150
              </li>
              <li className={`${s.flowStep} ${s.flowLast}`}>
                <strong>Your device</strong>
                Rust engine, run as WebAssembly
              </li>
            </ol>
          </section>

          <section id="step-1" className={s.section}>
            <span className={s.stepNumber} aria-hidden="true">1</span>
            <h2 className={`display ${s.h2}`}>Find the sun and the moon</h2>
            <p>
              Positions come from <strong>DE440</strong>, made by NASA&apos;s Jet Propulsion Laboratory. It is the kind of data used to fly spacecraft. We read it with Skyfield, a free Python library. We use the moon and sun as they appear from the centre of the Earth.
            </p>
            <CodeBlock name="tithiIndex" label="Finding the tithi from sun and moon positions" />
          </section>

          <section id="step-2" className={s.section}>
            <span className={s.stepNumber} aria-hidden="true">2</span>
            <h2 className={`display ${s.h2}`}>Find every tithi change</h2>
            <p>
              The script steps through 250 years, 12 hours at a time. The shortest tithi is about 20 hours, so it can not miss one. When the tithi changes between two steps, it closes in on the exact second.
            </p>
            <CodeBlock name="findBoundaries" label="Searching for every tithi change" />
            <p>
              That gives <strong>92,839 moments</strong>. The script stops if the tithis ever come out of order, and they never do. Each one lasts between 20 and 27 hours, just as it should. Each moment is saved as the seconds since the one before, so the whole table is only 367 KB.
            </p>
          </section>

          <section id="step-3" className={s.section}>
            <span className={s.stepNumber} aria-hidden="true">3</span>
            <h2 className={`display ${s.h2}`}>Look up your moment</h2>
            <p>Your birth date, time and place become one exact moment. The engine finds where that moment falls in the table. Halving the list again and again takes about 17 steps.</p>
            <CodeBlock name="tithiAt" label="Looking up the tithi for a moment" />
          </section>

          <section id="step-4" className={s.section}>
            <span className={s.stepNumber} aria-hidden="true">4</span>
            <h2 className={`display ${s.h2}`}>Work out sunrise</h2>
            <p>
              A panchang day starts at sunrise, so we need sunrise for your place. We use a standard formula from Jean Meeus&apos;s book <em>Astronomical Algorithms</em>. Sunrise here means the moment the <strong>top edge of the sun</strong> appears, with the bending of light by the air counted in. That is what Drik Panchang appears to use too.
            </p>
            <CodeBlock name="sunrise" label="Calculating sunrise" />
          </section>

          <section id="step-5" className={s.section}>
            <span className={s.stepNumber} aria-hidden="true">5</span>
            <h2 className={`display ${s.h2}`}>Give each tithi a date</h2>
            <p>A tithi gets the date whose sunrise falls inside it. Usually that is one date. Two cases need care:</p>
            <ul className={s.limits}>
              <li className={s.limit}>
                <h3>Kshaya: no sunrise inside</h3>
                The tithi is so short that it starts and ends between two sunrises. We list it on the day it falls in.
              </li>
              <li className={s.limit}>
                <h3>Vriddhi: two sunrises inside</h3>
                The tithi is so long that it covers two sunrises. We list the first day and show the second.
              </li>
            </ul>
            <CodeBlock name="assignDate" label="Assigning a date to a tithi" />
          </section>

          <section id="step-6" className={s.section}>
            <span className={s.stepNumber} aria-hidden="true">6</span>
            <h2 className={`display ${s.h2}`}>Name the moon month</h2>
            <p>
              A moon month runs from one new moon to the next. Its name comes from the zodiac sign the sun is in at the start, using the <strong>Lahiri ayanamsa</strong>, India&apos;s official standard. If the sun is still in the same sign at the next new moon, that month is an extra one, called <strong>adhika</strong>.
            </p>
            <CodeBlock name="masaAt" label="Naming the moon month" />
          </section>

          <section id="accuracy" className={s.section}>
            <h2 className={`display ${s.h2}`}>How accurate is it?</h2>
            <p>We did not only check our work against the data we used to make it. We also checked it against a completely separate astronomy system, and against published calendars.</p>
            <div className={s.tableWrap} tabIndex={0} role="region" aria-labelledby="tests-caption">
              <table className={s.table}>
                <caption id="tests-caption">Every test, and what it found</caption>
                <thead>
                  <tr>
                    <th scope="col">What we checked</th>
                    <th scope="col">Against</th>
                    <th scope="col">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {TESTS.map(([what, against, result]) => (
                    <tr key={what}>
                      <th scope="row">{what}</th>
                      <td>{against}</td>
                      <td>{result}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className={s.note}>The Swiss Ephemeris checks used its built-in Moshier model. The test suite and the check scripts are part of the project, so anyone with the code can run them again.</p>
          </section>

          <section id="simple" className={s.section}>
            <h2 className={`display ${s.h2}`}>Why not a simple formula?</h2>
            <p>
              We tried one. A short formula for the moon puts a tithi change about 7 minutes off, and sometimes 36 minutes off. That is enough to name the wrong tithi on about 2 days a year. A good library is far better: usually about 4 seconds off, and under 2 minutes at worst. Exact data is better still, so we use that.
            </p>
            <figure className={s.chart}>
              <figcaption>
                <strong>Days that get a different tithi from exact JPL data</strong>
                Tithi at sunrise in New Delhi, 73,049 days from 1900 to 2100
              </figcaption>
              <ul className={s.bars}>
                {BARS.map((bar) => (
                  <li key={bar.label} className={s.bar}>
                    <span className={s.barLabel}>{bar.label}</span>
                    <span className={s.barTrack}>
                      <span className={s.barFill} style={{ "--share": bar.value / BARS[0].value } as React.CSSProperties} />
                      <span className={s.barValue}>{bar.value} days</span>
                    </span>
                  </li>
                ))}
              </ul>
            </figure>
            <p>The middle bar is worth a look. Choosing the wrong meaning of &quot;sunrise&quot; changes more days than a good library&apos;s small errors. Rules matter as much as maths.</p>
          </section>

          <section id="limits" className={s.section}>
            <h2 className={`display ${s.h2}`}>Where it can be wrong</h2>
            <p>No tool is perfect. Here is what to watch for.</p>
            <ul className={s.limits}>
              <li className={s.limit}>
                <h3>Very close calls</h3>
                If a tithi changes within seconds of sunrise, any two good systems can disagree. This is rare: 8 days in 250 years in our test.
              </li>
              <li className={s.limit}>
                <h3>The far future</h3>
                The Earth&apos;s spin slowly changes in ways nobody can predict exactly. We include the expected drift, about 27 seconds by 2100, but times that far ahead can be off by a minute or more.
              </li>
              <li className={s.limit}>
                <h3>Old birth times</h3>
                Mumbai kept its own Bombay Time until 1955, and Kolkata kept Calcutta Time until 1948. Our time data treats all of India as one zone, so an old time from those cities can be up to 39 minutes off. Check how the time was written down.
              </li>
              <li className={s.limit}>
                <h3>Other traditions</h3>
                Older panchangs use different maths, and many festivals use their own rules, such as the tithi at noon or at night. Your family panchang can be a day apart, and it is not wrong.
              </li>
              <li className={s.limit}>
                <h3>Near the poles</h3>
                In some places the sun does not rise for days at a time. There is no sunrise to use, so the site tells you and stops.
              </li>
            </ul>
          </section>

          <section id="choices" className={s.section}>
            <h2 className={`display ${s.h2}`}>Choices we made</h2>
            <p>A panchang involves choices, not only maths. Here are ours, so you can see them.</p>
            <ul className={s.limits}>
              <li className={s.limit}>
                <h3>Your tithi</h3>
                The tithi at your exact moment of birth, even if you were born before sunrise. We also show the tithi that names the panchang day.
              </li>
              <li className={s.limit}>
                <h3>Your moon birthday</h3>
                The same tithi in the same moon month each year. If that month has an extra copy that year, we use the regular one.
              </li>
              <li className={s.limit}>
                <h3>Month names</h3>
                We count months from new moon to new moon (amanta), and also show the name used in much of North India (purnimanta).
              </li>
            </ul>
          </section>

          <section id="privacy" className={s.section}>
            <h2 className={`display ${s.h2}`}>How the site runs</h2>
            <p>
              There is no server doing the work. The engine is written in Rust and compiled to <strong>WebAssembly</strong>, so it runs inside your browser. Your birth details are never sent anywhere. When you share a result, the details sit after the # in the link, and browsers do not send that part to servers. The site then removes them from the address as soon as the link opens.
            </p>
            <p>We use Google Analytics and the Meta Pixel to count visits and measure our ads. They see which pages are opened, but we keep your birth details out of their reach. You can decline them on the finder page or with Cookie settings in the footer.</p>
            <p>The site is built with Next.js and hosted on Vercel as plain files. The moon is drawn live with WebGL, and its light comes from the real angle between the sun and the moon.</p>
            <div className={s.cta}>
              <p className={`display ${s.ctaTitle}`}>{CREDIT}.</p>
              <Link className="btn btnLight" href="/find">
                Find my moon birthday
                <ArrowIcon />
              </Link>
            </div>
          </section>

          <section id="open-source" className={s.section}>
            <h2 className={`display ${s.h2}`}>Open for everyone</h2>
            <p>
              All the code is on <a href={REPO_URL}>GitHub</a>. Star it, fork it, or help make it better.
            </p>
            <ul className={s.openCards}>
              {OPEN_SOURCE.map((card) => (
                <li key={card.title}>
                  <a className={s.openCard} href={card.href}>
                    <card.icon />
                    <strong>{card.title}</strong>
                    <span>{card.body}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
