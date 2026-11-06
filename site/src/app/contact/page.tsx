import type { Metadata } from "next";
import Link from "next/link";

import { CopyEmail } from "@/components/CopyEmail";
import { ArrowIcon, MailIcon } from "@/components/Icons";
import { JsonLd } from "@/components/JsonLd";
import { CONTACT_EMAIL, LINKEDIN_URL, SITE_NAME, pageMetadata, siteUrl } from "@/lib/site";

import s from "../legal.module.css";
import c from "./contact.module.css";

const DESCRIPTION = `Questions, feedback or a result that looks wrong? Email ${CONTACT_EMAIL}. Every message about tithis, moon birthdays or the site is read.`;

export const metadata: Metadata = pageMetadata({ title: "Contact: Questions and Feedback", description: DESCRIPTION, path: "/contact" });

const TOPICS = [
  "A result that looks wrong",
  "An idea or feedback",
  "An ad that looks wrong or harmful",
  "Removing your newsletter signup or other data",
  "Working together",
];

export default function ContactPage() {
  return (
    <div className={s.page}>
      <JsonLd
        data={{
          "@type": "ContactPage",
          name: `Contact ${SITE_NAME}`,
          url: `${siteUrl().origin}/contact`,
          mainEntity: { "@type": "Organization", name: SITE_NAME, email: CONTACT_EMAIL },
        }}
      />
      <div className={`wrap ${s.inner}`}>
        <p className="eyebrow">Contact</p>
        <h1 className={`display ${s.title}`}>
          Say <em className="gradientText">hello</em>
        </h1>
        <p className={c.lead}>Questions, ideas, or a result that looks wrong? Send an email. I read every one.</p>

        <div className={c.card}>
          <span className={c.icon}>
            <MailIcon />
          </span>
          <a className={c.email} href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          <div className={c.actions}>
            <a className="btn btnPrimary" href={`mailto:${CONTACT_EMAIL}`}>
              Send an email
              <ArrowIcon />
            </a>
            <CopyEmail email={CONTACT_EMAIL} className="btn btnGhost" />
          </div>
        </div>

        <h2>What you can write about</h2>
        <ul>
          {TOPICS.map((topic) => (
            <li key={topic}>{topic}</li>
          ))}
        </ul>

        <h2>If a result looks wrong</h2>
        <p>
          Tell us the date, time and place you entered, what the site showed, and what your panchang says. Only share what you are happy to share: the site never sends
          your birth details anywhere, but an email does. The <Link href="/disclaimer">Disclaimer</Link> lists the common reasons results differ.
        </p>

        <h2>Elsewhere</h2>
        <p>
          You can also reach Vishwajeet on{" "}
          <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer">
            LinkedIn
          </a>
          , or read more <Link href="/about">about the site</Link>.
        </p>
      </div>
    </div>
  );
}
