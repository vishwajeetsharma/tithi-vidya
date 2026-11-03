import type { Metadata } from "next";
import Link from "next/link";

import { ArrowIcon, HeartIcon, LinkIcon, LockIcon, MailIcon, SparkIcon, StarIcon } from "@/components/Icons";
import { JsonLd } from "@/components/JsonLd";
import { MoonPhase } from "@/components/MoonPhase";
import { AUTHOR, LINKEDIN_URL, PORTFOLIO_URL, SITE_NAME, siteUrl } from "@/lib/site";

import s from "./about.module.css";

const DESCRIPTION = `Why ${SITE_NAME} exists, and who made it: Vishwajeet Sharma, a 22-year-old software student who couldn't find his own moon birthday.`;

export const metadata: Metadata = {
  title: "About",
  description: DESCRIPTION,
  alternates: { canonical: "/about" },
  openGraph: { title: `About | ${SITE_NAME}`, description: DESCRIPTION, url: "/about" },
};

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
