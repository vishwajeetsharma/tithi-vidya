import type { Metadata } from "next";
import Link from "next/link";

import { CONTACT_EMAIL, REPO_URL, SITE_NAME, pageMetadata } from "@/lib/site";

import s from "../legal.module.css";

export const metadata: Metadata = pageMetadata({
  title: "Terms of Use",
  description: `The terms for using ${SITE_NAME}, a free tithi and moon birthday finder: what results mean, accuracy, ads, the newsletter and the open source code.`,
  path: "/terms",
});

export default function TermsPage() {
  return (
    <div className={s.page}>
      <div className={`wrap ${s.inner}`}>
        <h1 className={`display ${s.title}`}>Terms of Use</h1>
        <p className={s.updated}>Last updated: 3 November 2026</p>

        <p>By using {SITE_NAME}, you agree to these terms. If you do not agree, please do not use the site.</p>

        <h2>What this site is</h2>
        <p>{SITE_NAME} is a free tool that works out tithis and moon birthdays from astronomy data. There is no account and nothing to buy. It may show ads to help pay for it.</p>

        <h2>For general information</h2>
        <p>
          Results are for general information. They are not religious, astrological, legal, medical or financial advice. For a ceremony or an important decision, please
          check with your priest, your family panchang, or someone you trust.
        </p>

        <h2>Accuracy</h2>
        <p>
          We work hard to be accurate, and we show how on our <Link href="/how-it-works">How it works</Link> page. But results can differ from other panchangs, and they
          can be wrong, for example if a tithi changes close to sunrise or an old birth time used local time. We do not promise that any result is correct.
        </p>

        <h2>No warranty</h2>
        <p>
          The site is provided as it is, with no warranty of any kind. As far as the law allows, we are not responsible for any loss that comes from using it or relying
          on its results. The site may change or stop at any time.
        </p>

        <h2>Open source</h2>
        <p>
          The code is on <a href={REPO_URL}>GitHub</a> under the MIT License. The license in the repository covers your use of the code, and these terms cover your use of
          this website.
        </p>

        <h2>Fair use</h2>
        <p>Please do not try to break, overload or misuse the site.</p>

        <h2>Ads</h2>
        <p>
          The site may show ads from Google and its partners. Advertisers are responsible for their ads and what they offer. An ad is not a recommendation from us,
          and we are not part of anything you buy or sign up for through one. If you see an ad that looks wrong or harmful, please tell us at{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. How ads use data is explained in our <Link href="/privacy">Privacy Policy</Link>.
        </p>

        <h2>Newsletter</h2>
        <p>The newsletter is free. You can unsubscribe at any time with the link in every email, and we may stop or change it at any time.</p>

        <h2>Other websites</h2>
        <p>Links to other websites, including ads, are for convenience. We do not control those sites.</p>

        <h2>Changes and contact</h2>
        <p>
          If these terms change, we will update this page and its date. For questions, email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. See also our{" "}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
