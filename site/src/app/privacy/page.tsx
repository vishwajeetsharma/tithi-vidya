import type { Metadata } from "next";
import Link from "next/link";

import { CookieSettingsButton } from "@/components/CookieSettingsButton";
import { CONTACT_EMAIL, SITE_NAME, pageMetadata } from "@/lib/site";

import s from "../legal.module.css";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description: `How ${SITE_NAME} treats your data. Your birth details never leave your device, and analytics and ad cookies load only if you say yes.`,
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <div className={s.page}>
      <div className={`wrap ${s.inner}`}>
        <h1 className={`display ${s.title}`}>Privacy Policy</h1>
        <p className={s.updated}>Last updated: 20 November 2026</p>

        <p>
          {SITE_NAME} is run by Vishwajeet Sharma. This page explains what data the site uses, in plain words. The short version:{" "}
          <strong>your birth details stay on your device.</strong>
        </p>

        <h2>Your birth details</h2>
        <p>
          The date, time and place you enter are used only inside your own browser, by the tithi engine that runs there. We do not receive them, and we do not store
          them on any server. There are no accounts.
        </p>
        <p>
          While you use the site, your browser keeps your details for that tab, so they can move from the home page to the finder. They are removed when you refresh the page or close the tab. If you use Copy
          link, the details are inside that link, so anyone you share it with can see them.
        </p>

        <h2 id="cookies">Cookies, only with your OK</h2>
        <p>
          Nothing that sets analytics or ad cookies loads until you say yes. On your first visit a small box asks, once you start scrolling or after a few seconds.
          You can accept, decline, or choose what to allow. If you don&apos;t answer, nothing loads.
        </p>
        <ul>
          <li>
            <strong>Visit counts: Google Analytics</strong>, from Google, shows us how many people visit and which pages they open.
          </li>
          <li>
            <strong>Ads: Google AdSense</strong>, from Google, shows the ads that keep the site free. <strong>Meta Pixel</strong>, from Meta, shows us whether our
            Facebook and Instagram ads bring visitors, and can be used to show our ads to people who visited.
          </li>
        </ul>
        <p>
          Your browser keeps your choice for 12 months, then we ask again. You can change it at any time with <CookieSettingsButton className={s.link} />, which is
          also at the bottom of every page. If you take back a yes, we delete those cookies and reload the page, so the services stop.
        </p>
        <p>
          These services can receive things like the page you opened, your device and browser type, your IP address, and how you reached the site. They handle that
          data under their own privacy policies:{" "}
          <a href="https://policies.google.com/privacy">Google</a> and <a href="https://www.facebook.com/privacy/policy">Meta</a>. We set up the site so they never
          receive your birth details.
        </p>

        <h2>Ads on this site</h2>
        <p>
          To keep the site free, we may show ads from Google (Google AdSense) on some pages. Ads are always marked as ads. We do not choose the individual ads you
          see, and showing an ad does not mean we recommend it.
        </p>
        <ul>
          <li>Google ads load only if you allow Ads. If you decline, or don&apos;t answer, Google ads don&apos;t load at all.</li>
          <li>
            Google and other ad companies working with Google use cookies to show ads. These can be based on your earlier visits to this site and to other websites.
            Google explains this in{" "}
            <a href="https://policies.google.com/technologies/partner-sites">how Google uses information from sites that use its services</a>.
          </li>
          <li>
            In the European Economic Area, the UK and Switzerland, Google may show only limited ads, which don&apos;t use your personal data to choose them.
          </li>
          <li>
            Ad services can receive the same kind of data as above: the page, your device and browser, your IP address and a rough location. They never receive your
            birth details or your email address.
          </li>
        </ul>
        <p>
          You can turn off personalised ads from Google in <a href="https://myadcenter.google.com/">My Ad Center</a>, and from many other ad companies at{" "}
          <a href="https://optout.aboutads.info/">aboutads.info</a> or, in Europe, <a href="https://www.youronlinechoices.eu/">youronlinechoices.eu</a>.
        </p>

        <h2>The newsletter</h2>
        <p>
          If you subscribe, we keep your email address and, if you give it, your first name. They are stored by{" "}
          <a href="https://www.brevo.com/legal/privacypolicy/">Brevo</a>, which sends the newsletter for us. We use them only to send you the newsletter, and we
          never sell them. Brevo can record whether an email was opened or a link in it was clicked.
        </p>
        <p>
          Every email has an unsubscribe link. You can also email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and we will remove you.
        </p>

        <h2>Article notifications</h2>
        <p>
          If you press &quot;Get notified of new articles&quot; and allow it, your browser gives us an address at its maker&apos;s notification service, such as
          Google, Apple or Mozilla, and two keys to encrypt messages. We store only that, with no name or email, in a database run by{" "}
          <a href="https://upstash.com/trust/privacy.pdf">Upstash</a>, and use it only to tell you about new articles. Press &quot;Turn off notifications&quot;, or
          block them in your browser&apos;s settings, and we stop. Addresses that stop working are deleted.
        </p>

        <h2>Cookies and browser storage</h2>
        <div className={s.tableWrap} tabIndex={0} role="region" aria-label="Cookies and browser storage">
          <table className={s.table}>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">From</th>
                <th scope="col">What it does</th>
                <th scope="col">Needs your OK?</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>tithi-consent</td>
                <td>This site</td>
                <td>Remembers your cookie choice for 12 months</td>
                <td>No, it&apos;s needed</td>
              </tr>
              <tr>
                <td>tithi-birth</td>
                <td>This site</td>
                <td>Keeps your details in this tab only, and is never sent anywhere</td>
                <td>No, it&apos;s needed</td>
              </tr>
              <tr>
                <td>_ga, _ga_*</td>
                <td>Google Analytics</td>
                <td>Tells one visitor from another. Lasts up to 13 months</td>
                <td>Yes: Visit counts</td>
              </tr>
              <tr>
                <td>__gads, __gpi, __eoi</td>
                <td>Google AdSense</td>
                <td>Shows ads, limits how often you see the same one, and measures them</td>
                <td>Yes: Ads</td>
              </tr>
              <tr>
                <td>_fbp, _fbc</td>
                <td>Meta Pixel</td>
                <td>Measures ads and tells one visitor from another</td>
                <td>Yes: Ads</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          You can change your choice at any time: <CookieSettingsButton className={s.link} />. The same link is in the footer of every page.
        </p>

        <h2>Hosting</h2>
        <p>
          The site is hosted by <a href="https://vercel.com/legal/privacy-policy">Vercel</a>. Like most web hosts, Vercel handles basic technical data, such as IP
          addresses, to deliver pages and keep the service secure.
        </p>

        <h2 id="europe">If you&apos;re in Europe or the UK</h2>
        <p>
          This part is for visitors in the European Economic Area, the UK and Switzerland, where the GDPR and laws like it apply. Everything above applies to you
          too.
        </p>
        <ul>
          <li>
            <strong>Who is responsible.</strong> Vishwajeet Sharma runs {SITE_NAME} and is its &quot;controller&quot;, the person who decides how its data is used.
            Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </li>
          <li>
            <strong>Why we use data.</strong> Analytics and ad cookies: only with your consent. The newsletter and article notifications: your consent, which you give
            when you sign up or turn them on. Hosting and security: our legitimate interest in keeping the site running and safe.
          </li>
          <li>
            <strong>You don&apos;t have to agree to anything.</strong> The finder, the blog and every other page work the same if you decline.
          </li>
          <li>
            <strong>How long we keep it.</strong> Your cookie choice: 12 months, in your browser. Google Analytics cookies: up to 13 months. Your newsletter signup:
            until you unsubscribe. A notification address: until you turn notifications off or it stops working.
          </li>
          <li>
            <strong>Your rights.</strong> You can ask to see, correct or delete your data, to limit or object to its use, and to get a copy to take elsewhere. You can
            take back your consent at any time, which doesn&apos;t affect what happened before. Email us, and we&apos;ll reply within one month.
          </li>
          <li>
            <strong>Complaints.</strong> You can complain to the data protection authority where you live.
          </li>
          <li>
            <strong>Data outside Europe.</strong> Google, Meta, Vercel and Upstash may handle data in the United States and other countries. They say they protect it
            with safeguards the GDPR allows, such as the EU-U.S. Data Privacy Framework and the European Commission&apos;s standard contractual clauses. Brevo is based
            in France.
          </li>
          <li>
            <strong>No automated decisions.</strong> We make no decisions about you by computer alone.
          </li>
        </ul>

        <h2>Your choices</h2>
        <ul>
          <li>Accept, decline or choose in the cookie box, and change your mind with Cookie settings at the bottom of any page.</li>
          <li>Clear the site&apos;s data in your browser at any time.</li>
          <li>Unsubscribe from the newsletter with the link in any email.</li>
          <li>Turn off article notifications on the blog, or in your browser&apos;s settings.</li>
          <li>Turn off personalised ads in Google&apos;s My Ad Center, or at aboutads.info.</li>
          <li>To ask about data held by Google or Meta, use the controls those companies provide.</li>
          <li>Email us to ask what we hold about you, or to have it removed. The only data we can hold about you is your newsletter signup.</li>
        </ul>

        <h2>What we never do</h2>
        <p>We never sell your email address, and we never receive your birth details, so we can not sell or share them.</p>

        <h2>Children</h2>
        <p>The site is not aimed at children, and we do not knowingly collect their data.</p>

        <h2>Changes and contact</h2>
        <p>
          If this policy changes, we will update this page and its date. For questions, email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. See also our{" "}
          <Link href="/terms">Terms</Link>.
        </p>
      </div>
    </div>
  );
}
