import type { Metadata } from "next";
import Link from "next/link";

import { CONTACT_EMAIL, SITE_NAME, pageMetadata } from "@/lib/site";

import s from "../legal.module.css";
import a from "./ai-use.module.css";

export const metadata: Metadata = pageMetadata({
  title: "AI Use Statement: How We Use AI",
  description: `How ${SITE_NAME} uses AI to build the site and help with articles, and why every decision, every article and every fact check is done by people.`,
  path: "/ai-use",
});

/** A highlighted line that repeats the page's main point. */
function People({ children }: { children: React.ReactNode }) {
  return (
    <p className={a.people}>
      <strong>People decide.</strong> {children}
    </p>
  );
}

export default function AiUsePage() {
  return (
    <div className={s.page}>
      <div className={`wrap ${s.inner}`}>
        <p className="eyebrow">Transparency</p>
        <h1 className={`display ${s.title}`}>How we use AI</h1>
        <p className={s.updated}>Last updated: 6 November 2026</p>

        <p>
          We use AI tools, and we want you to know exactly how. AI helps us work faster. It does not decide what {SITE_NAME} is, what we write about, or what we
          publish. People do.
        </p>

        <div className={a.summary}>
          <p className={a.summaryTitle}>The short version</p>
          <ul>
            <li>
              <strong>Ideas, decisions and choices are made by people.</strong> AI is a tool we use, never the one in charge.
            </li>
            <li>
              <strong>Articles are researched and written by people.</strong> AI helps us find topics and makes our wording easier to read.
            </li>
            <li>
              <strong>Every fact is checked by people</strong> against trusted sources before we publish.
            </li>
            <li>
              <strong>Your tithi results do not come from AI.</strong> They come from astronomy data and tested code.
            </li>
          </ul>
        </div>

        <h2>Who we are</h2>
        <p>
          {SITE_NAME} is made by a small team of four developers and designers, including one designer. Vishwajeet Sharma started the project. You can read why on
          the <Link href="/about">About</Link> page.
        </p>

        <h2>Building the website</h2>
        <p>
          We built the website with the help of <strong>Claude Opus 5.5</strong>, from Anthropic, and other widely used software tools. AI helped us write and check
          code, find bugs, test pages and improve accessibility.
        </p>
        <People>
          The ideas behind the site, what it does, how it looks, the method it uses and every major choice were made by our team. We reviewed and tested the work
          before it went live.
        </People>

        <h2>Choosing article topics</h2>
        <p>
          To plan future articles, we use <strong>Claude Sonnet 5.5</strong>, from Anthropic, to research which subjects people are curious about, such as festivals,
          tithis and questions about the Hindu calendar.
        </p>
        <People>AI suggests subjects. Our team chooses which ones to write about, and when.</People>

        <h2>Writing articles</h2>
        <p>
          Our articles are <strong>researched and written by people</strong>. We study each topic ourselves first. We then use AI to improve readability: to make
          sentences shorter and clearer, and to keep our plain-English style.
        </p>
        <p>
          Before anything is published, we <strong>check every fact against trusted sources</strong>, such as published panchangs, astronomy data from NASA&apos;s Jet
          Propulsion Laboratory, and scholarly references, and we check dates with our own tested tool. A person reviews every article before it goes live.
        </p>
        <People>Writing, fact-checking and the choice to publish are done by people, every time.</People>

        <h2>Images</h2>
        <p>
          Images in our articles are made by our designer. Some may be created with the help of generative AI tools from <strong>Adobe</strong> or{" "}
          <strong>Claude</strong>, and some are not. Charts and diagrams are drawn from our own data. Every image is chosen and checked by our designer before it
          is used.
        </p>

        <h2>What AI never does here</h2>
        <ul>
          <li>
            <strong>It does not work out your tithi.</strong> Results come from NASA JPL astronomy data and code that is open for anyone to read on{" "}
            <Link href="/how-it-works">How it works</Link>.
          </li>
          <li>
            <strong>It does not see your birth details.</strong> They stay in your own browser and are never sent to an AI service, or to us. See our{" "}
            <Link href="/privacy">Privacy Policy</Link>.
          </li>
          <li>
            <strong>It does not publish anything on its own.</strong> Nothing goes live without a person deciding it should.
          </li>
        </ul>

        <People>
          AI is a helpful tool for us, like a calculator or a spell checker. The thinking, the research, the writing and the responsibility stay with our team.
        </People>

        <h2>Questions or mistakes</h2>
        <p>
          If you think something we published is wrong, or you have a question about how we use AI, please email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. We read every message, and we correct mistakes. See also our{" "}
          <Link href="/disclaimer">Disclaimer</Link>.
        </p>
      </div>
    </div>
  );
}
