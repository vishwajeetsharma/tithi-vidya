import type { Metadata } from "next";
import Link from "next/link";

import { ArrowIcon, HeartIcon, LinkIcon, LockIcon, MailIcon, SparkIcon, StarIcon } from "@/components/Icons";
import { JsonLd } from "@/components/JsonLd";
import { MoonPhase } from "@/components/MoonPhase";
import { AUTHOR, LINKEDIN_URL, PORTFOLIO_URL, SITE_NAME, pageMetadata, siteUrl } from "@/lib/site";

import s from "./about.module.css";

const DESCRIPTION = `Why ${SITE_NAME} exists, and who made it: Vishwajeet Sharma, a 22-year-old software student who couldn't find his own moon birthday.`;

export const metadata: Metadata = pageMetadata({ title: "About the Site and Its Maker", description: DESCRIPTION, path: "/about" });

const STORY = [
  {
    title: "My family told me about tithis",
    text: "Not long ago, my family told me about tithis and the panchang. I learned that I have a second birthday, one that follows the moon.",
  },
  {
    title: "I couldn't find mine",
    text: "I wanted to know two things: the tithi I was born on, and the date my moon birthday falls on this year. I could not find a simple way to get either.",
  },
  {
    title: "So I built it",
    text: `So I made ${SITE_NAME}. Enter your birth date, time and place, and it shows your tithi and your moon birthdays for 100 years. Now no one has to face that problem again.`,
  },
];

/** The tithis of the two halves of a moon month. The 15th is the full moon in the first half, and the new moon in the second. */
const TITHIS = ["Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashthi", "Saptami", "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi"];
const HALVES = [
  { name: "Shukla paksha", note: "the moon grows", last: "Purnima", start: 0 },
  { name: "Krishna paksha", note: "the moon shrinks", last: "Amavasya", start: 180 },
];

const TIMELINE = [
  {
    when: "Over 2,000 years ago",
    text: "The Vedanga Jyotisha, one of India's oldest texts on time, explains how to follow the sun and moon to set the days of rituals.",
  },
  {
    when: "499 CE",
    text: "Aryabhata, aged 23, finishes the Aryabhatiya. His figures for the sun and moon guide Indian astronomers for centuries.",
  },
  {
    when: "Today",
    text: "Panchangs are printed every year in many languages. Hundreds of millions of people use them to choose days for festivals, fasts and weddings.",
  },
  {
    when: SITE_NAME,
    text: "The same rules, with NASA's positions for the sun and moon, worked out in your browser for any place on Earth.",
  },
];

/** The calendar in four numbers. Keep in step with the How it works page. */
const NUMBERS = [
  { figure: "12°", text: "The moon moves this much further from the sun in one tithi. Thirty tithis make a moon month." },
  { figure: "20–27 h", text: "How long a tithi lasts. So one can be skipped on the calendar, or fill two days." },
  { figure: "11 days", text: "How much shorter twelve moon months are than a year of seasons." },
  { figure: "+1 month", text: "Added about every three years, adhika masa keeps Diwali in autumn and Holi in spring." },
];

const VALUES = [
  { icon: HeartIcon, title: "Free, with no sign-up", text: "No account, no payment, no app to install. Open the page and use it." },
  { icon: LockIcon, title: "Private", text: "Your birth details are worked out inside your own browser. They are never sent to me or anyone else." },
  { icon: StarIcon, title: "Carefully checked", text: "It uses astronomy data from NASA's Jet Propulsion Laboratory, and is tested against thousands of known results." },
  { icon: SparkIcon, title: "Open source", text: "All the code is public, so anyone can see exactly how it works, or help make it better." },
];

export default function AboutPage() {
  const origin = siteUrl().origin;
  return (
    <div className={s.page}>
      <JsonLd
        data={{
          "@type": "AboutPage",
          name: `About ${SITE_NAME}`,
          url: `${origin}/about`,
          description: DESCRIPTION,
          mainEntity: { "@type": "Person", name: AUTHOR, url: PORTFOLIO_URL, sameAs: [LINKEDIN_URL, PORTFOLIO_URL] },
        }}
      />
      <div className="wrap">
        <header className={s.hero}>
          <div className={s.heroText}>
            <p className="eyebrow">About</p>
            <h1 className={`display ${s.title}`}>
              Hi, I&apos;m <em className="gradientText">Vishwajeet</em>.
            </h1>
            <p className={s.lead}>
              I&apos;m a 22-year-old software student, and I made {SITE_NAME} because I couldn&apos;t find my own moon birthday.
            </p>
          </div>

          <aside className={s.profile} aria-label="About me">
            <MoonPhase className={s.profileMoon} elongation={75} size={112} />
            <p className={`display ${s.profileName}`}>{AUTHOR}</p>
            <ul className={s.profileFacts}>
              <li>22 years old</li>
              <li>Software student</li>
              <li>Loves DevOps</li>
            </ul>
            <div className={s.profileLinks}>
              <a className="btn btnGhost" href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer me">
                LinkedIn
                <ArrowIcon />
              </a>
              <a className="btn btnGhost" href={PORTFOLIO_URL} target="_blank" rel="noopener noreferrer me">
                Portfolio
                <ArrowIcon />
              </a>
            </div>
          </aside>
        </header>

        <section className={s.section} aria-labelledby="story-title">
          <h2 id="story-title" className={`display ${s.sectionTitle}`}>
            Why I made this
          </h2>
          <ol className={s.story}>
            {STORY.map((step, i) => (
              <li key={step.title} className={s.storyStep}>
                <span className={s.storyNumber} aria-hidden="true">
                  {i + 1}
                </span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className={s.section} aria-labelledby="me-title">
          <div className={s.split}>
            <h2 id="me-title" className={`display ${s.sectionTitle}`}>
              Who I am
            </h2>
            <div className={s.prose}>
              <p>
                I&apos;m Vishwajeet Sharma. I&apos;m 22, and I study software. The part I enjoy most is DevOps: building things, shipping them, and keeping them running
                smoothly.
              </p>
              <p>
                {SITE_NAME} is a small project built with a lot of care. The tithi engine is written in Rust and runs right in your browser, and the{" "}
                <Link href="/how-it-works">How it works</Link> page shows the real code and every test.
              </p>
            </div>
          </div>
        </section>

        <section className={s.sky} aria-labelledby="culture-title">
          <div className={s.skyIntro}>
            <p className={`eyebrow ${s.skyEyebrow}`}>Why I want to share it</p>
            <h2 id="culture-title" className={`display ${s.skyTitle}`}>
              India has timed its festivals by the moon for over 2,000 years. <em>I want the world to see how.</em>
            </h2>
            <div className={s.skyText}>
              <p>
                When my family told me about tithis, I was surprised by how clever the idea is. The calendar was worked out by watching the sky, written down by
                astronomers, and is still printed in panchangs found in millions of homes. It decides when Diwali, Holi and Navratri fall, and when your moon
                birthday comes round.
              </p>
              <p>
                Yet most people outside India have never heard of it, and many of us who use it couldn&apos;t explain it. {SITE_NAME} is my way of changing that:
                plain words, real astronomy, and a free tool anyone in the world can use.
              </p>
            </div>
          </div>

          <figure className={s.month}>
            {HALVES.map((half) => (
              <div key={half.name} className={s.half}>
                <p className={s.halfName}>
                  <strong>{half.name}</strong> {half.note}
                </p>
                <ol className={s.moons}>
                  {[...TITHIS, half.last].map((name, i) => (
                    <li key={name} title={name}>
                      <MoonPhase elongation={half.start + i * 12 + 6} size={26} />
                      <span className="visuallyHidden">{name}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
            <figcaption>One moon month, from new moon to new moon: 30 tithis.</figcaption>
          </figure>

          <div className={s.skyGrid}>
            <div>
              <h3 className={s.skyHeading}>From the sky to your screen</h3>
              <ol className={s.timeline}>
                {TIMELINE.map((step) => (
                  <li key={step.when}>
                    <p className={s.when}>{step.when}</p>
                    <p>{step.text}</p>
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <h3 className={s.skyHeading}>The idea in four numbers</h3>
              <dl className={s.numbers}>
                {NUMBERS.map((n) => (
                  <div key={n.figure}>
                    <dt className="display">{n.figure}</dt>
                    <dd>{n.text}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <div className={s.actions}>
            <Link className="btn btnLight" href="/how-it-works">
              See how it works
              <ArrowIcon />
            </Link>
            <Link className={`btn ${s.btnOutline}`} href="/blog">
              Read the blog
              <ArrowIcon />
            </Link>
          </div>
        </section>

        <section className={s.section} aria-labelledby="values-title">
          <h2 id="values-title" className={`display ${s.sectionTitle}`}>
            What I care about
          </h2>
          <ul className={s.values}>
            {VALUES.map(({ icon: Icon, title, text }) => (
              <li key={title} className={s.value}>
                <span className={s.valueIcon}>
                  <Icon />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className={s.goal} aria-labelledby="goal-title">
          <p className="eyebrow">The goal</p>
          <h2 id="goal-title" className={`display ${s.goalText}`}>
            My vision is simple: I want people to <em className="gradientText">actually use it.</em>
          </h2>
          <p className={s.lead}>If it helped you, share it with your family and friends. That is the biggest help you can give.</p>
          <div className={s.actions}>
            <Link className="btn btnPrimary" href="/find">
              Find my tithi
              <ArrowIcon />
            </Link>
            <Link className="btn btnGhost" href="/contribute">
              Help build it
              <LinkIcon />
            </Link>
          </div>
        </section>

        <section className={s.hello} aria-labelledby="hello-title">
          <div>
            <h2 id="hello-title" className={`display ${s.helloTitle}`}>
              Say hello
            </h2>
            <p>Check out the other projects I&apos;ve built, connect with me on LinkedIn, or send me a message.</p>
          </div>
          <div className={s.actions}>
            <a className="btn btnLight" href={PORTFOLIO_URL} target="_blank" rel="noopener noreferrer me">
              See my other projects
              <ArrowIcon />
            </a>
            <a className={`btn ${s.btnOutline}`} href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer me">
              LinkedIn
              <ArrowIcon />
            </a>
            <Link className={`btn ${s.btnOutline}`} href="/contact">
              Contact me
              <MailIcon />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
