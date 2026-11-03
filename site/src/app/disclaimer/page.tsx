import type { Metadata } from "next";
import Link from "next/link";

import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

import s from "../legal.module.css";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: `What ${SITE_NAME}'s results are, and are not. For general information, not religious or astrological advice.`,
  alternates: { canonical: "/disclaimer" },
};

export default function DisclaimerPage() {
  return (
    <div className={s.page}>
      <div className={`wrap ${s.inner}`}>
        <h1 className={`display ${s.title}`}>Disclaimer</h1>
        <p className={s.updated}>Last updated: 3 November 2026</p>

        <p>
          {SITE_NAME} works out tithis and moon birthdays from astronomy data. Please read this page before you rely on a result for anything important.
        </p>

        <h2>General information only</h2>
        <p>
          Everything on this site, including the tool, the blog and the newsletter, is for general information. It is not religious, astrological, legal, medical or
          financial advice. For a ceremony, a muhurat or an important decision, please check with your priest, your family panchang, or someone you trust.
        </p>

        <h2>Results can differ from your panchang</h2>
        <p>We follow the method of most modern panchangs, and we test it carefully. Even so, a result can differ from another source, for example:</p>
        <ul>
          <li>When a tithi starts or ends within a few minutes of sunrise. A tiny difference in method can move it to the next day.</li>
          <li>
            For old birth times. Some cities used their own local time in the past, such as Bombay Time until 1955 and Calcutta Time until 1948. Check how your birth
            time was written down.
          </li>
          <li>
            For other traditions. Panchangs that use the Surya Siddhanta, or special timing rules for some festivals, can give a different day. Panchangs that use
            purnimanta months, common in North India, give some dates a different month name.
          </li>
          <li>For dates far in the future, where the Earth&apos;s rotation adds about a minute of uncertainty.</li>
        </ul>
        <p>
          The <Link href="/how-it-works">How it works</Link> page explains the method and shows every accuracy test. We do not promise that any result is correct.
        </p>

        <h2>Not linked to any temple or panchang</h2>
        <p>
          {SITE_NAME} is an independent project. It is not part of, or approved by, any temple, religious body or panchang publisher. Names of other panchangs are
          used only to describe how our results compare.
        </p>

        <h2>Ads and other websites</h2>
        <p>
          The site may show ads from Google and its partners. Ads are chosen by the ad service, not by us, and an ad is not a recommendation. Links to other websites
          are for convenience, and we are not responsible for what those sites say or do.
        </p>

        <h2>Use at your own risk</h2>
        <p>
          As far as the law allows, we are not responsible for any loss that comes from using the site or relying on its results. The full terms are in our{" "}
          <Link href="/terms">Terms of Use</Link>, and how we handle data is in our <Link href="/privacy">Privacy Policy</Link>.
        </p>

        <h2>Found a mistake?</h2>
        <p>
          If a result looks wrong, please tell us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. See the <Link href="/contact">Contact</Link> page for
          what to include.
        </p>
      </div>
    </div>
  );
}
