import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";

import b from "@/components/blog/blog.module.css";
import { TocSpy } from "@/components/how/TocSpy";
import { ArrowIcon, ForkIcon, HeartIcon, SparkIcon, StarIcon } from "@/components/Icons";
import { getGuide } from "@/lib/guide";
import { REPO_URL, SITE_NAME, pageMetadata } from "@/lib/site";

import s from "./contribute.module.css";

const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap", preload: false });

const DESCRIPTION = `How to help ${SITE_NAME}: write an article for the blog, improve the code or the tithi algorithm, or report a result that looks wrong.`;

export const metadata: Metadata = pageMetadata({ title: "Contribute: Write Articles or Improve the Code", description: DESCRIPTION, path: "/contribute" });

const GUIDE_ON_GITHUB = `${REPO_URL}/blob/main/CONTRIBUTING.md`;

// The ids come from the headings in CONTRIBUTING.md.
const WAYS = [
  { href: "#writing-an-article", icon: HeartIcon, title: "Write an article", text: "Share what you know about tithis, festivals or the panchang. No coding needed." },
  { href: "#contributing-code", icon: ForkIcon, title: "Improve the code", text: "Fix a bug or make the website better. It is Next.js and TypeScript." },
  { href: "#improving-the-algorithm", icon: StarIcon, title: "Improve the algorithm", text: "Make results more accurate, with evidence and a test." },
  { href: "#reporting-a-wrong-result", icon: SparkIcon, title: "Report a wrong result", text: "Tell us where a result differs from your panchang." },
];

export default function ContributePage() {
  const guide = getGuide();
  return (
    <div className={`${s.page} ${mono.variable}`}>
      <div className="wrap">
        <header className={s.hero}>
          <p className="eyebrow">Contribute</p>
          <h1 className={`display ${s.title}`}>
            Help make {SITE_NAME} <em className="gradientText">better</em>
          </h1>
          <p className={s.lead}>
            {SITE_NAME} is free and open source. You can write for the blog, improve the code, or make the results more accurate. Every change starts as a pull
            request on GitHub, and this page shows how.
          </p>
          <div className={s.actions}>
            <a className="btn btnPrimary" href={REPO_URL} target="_blank" rel="noopener noreferrer">
              Open on GitHub
              <ArrowIcon />
            </a>
            <a className="btn btnGhost" href={`${REPO_URL}/issues/new`} target="_blank" rel="noopener noreferrer">
              Open an issue
            </a>
          </div>
        </header>

        <ul className={s.ways}>
          {WAYS.map(({ href, icon: Icon, title, text }) => (
            <li key={href}>
              <a className={s.way} href={guide ? href : GUIDE_ON_GITHUB}>
                <span className={s.wayIcon}>
                  <Icon />
                </span>
                <span className={s.wayTitle}>{title}</span>
                <span className={s.wayText}>{text}</span>
              </a>
            </li>
          ))}
        </ul>

        {guide ? (
          <div className={s.layout}>
            <article className={`${b.prose} ${s.guide}`} dangerouslySetInnerHTML={{ __html: guide.html }} />
            <aside className={s.rail}>
              <nav className={b.toc} aria-label="On this page" data-toc>
                <p>On this page</p>
                <ol>
                  {guide.toc.map((heading) => (
                    <li key={heading.id}>
                      <a href={`#${heading.id}`}>{heading.text}</a>
                    </li>
                  ))}
                </ol>
              </nav>
            </aside>
            <TocSpy ids={guide.toc.map((heading) => heading.id)} within="[data-toc]" />
          </div>
        ) : (
          <p className={s.lead}>
            The full guide is in <a href={GUIDE_ON_GITHUB}>CONTRIBUTING.md on GitHub</a>.
          </p>
        )}
      </div>
    </div>
  );
}
