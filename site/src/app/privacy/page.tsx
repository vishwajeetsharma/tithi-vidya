import type { Metadata } from "next";
import Link from "next/link";

import { CookieSettingsButton } from "@/components/CookieSettingsButton";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

import s from "../legal.module.css";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${SITE_NAME} treats your data. Your birth details stay on your device.`,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className={s.page}>
      <div className={`wrap ${s.inner}`}>
        <h1 className={`display ${s.title}`}>Privacy Policy</h1>
        <p className={s.updated}>Last updated: 3 November 2026</p>

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

        <h2>Analytics and advertising cookies</h2>
        <p>
          We load two services to count visits and measure our own ads. They start when you open the site. We ask for your choice on the finder page, and if you click Decline, or decline later in Cookie settings, they stop and their cookies are cleared.
        </p>
        <ul>
          <li>
            <strong>Google Analytics</strong>, from Google, shows us how many people visit and which pages they open.
          </li>
          <li>
            <strong>Meta Pixel</strong>, from Meta, shows us whether our Facebook and Instagram ads bring visitors, and can be used to show ads to people who visited.
          </li>
        </ul>
        <p>
          These services can receive things like the page you opened, your device and browser type, your IP address, and how you reached the site. They handle that
          data under their own privacy policies:{" "}
          <a href="https://policies.google.com/privacy">Google</a> and <a href="https://www.facebook.com/privacy/policy">Meta</a>. We set up the site so they do not
          receive your birth details.
        </p>

        <h2>Ads on this site</h2>
        <p>
          To keep the site free, we may show ads from Google (Google AdSense) on some pages. Ads are always marked as ads. We do not choose the individual ads you
          see, and showing an ad does not mean we recommend it.
        </p>
        <ul>
          <li>
            Google and other ad companies working with Google use cookies to show ads. These can be based on your earlier visits to this site and to other websites.
          </li>
          <li>
            Google&apos;s advertising cookies let Google and its partners show you ads based on those visits. Google explains this in{" "}
            <a href="https://policies.google.com/technologies/partner-sites">how Google uses information from sites that use its services</a>.
          </li>
          <li>
            Ad services can receive the same kind of data as above: the page, your device and browser, your IP address and a rough location. They never receive your
            birth details or your email address.
          </li>
          <li>
            If you decline cookies, you will see only general ads that are not based on your visits, or no ads at all.
          </li>
        </ul>
        <p>
          You can turn off personalised ads from Google in <a href="https://myadcenter.google.com/">My Ad Center</a>, and from many other ad companies at{" "}
          <a href="https://optout.aboutads.info/">aboutads.info</a> or, in Europe, <a href="https://www.youronlinechoices.eu/">youronlinechoices.eu</a>.
        </p>

        <h2>Translating and listening to the blog</h2>
        <p>
          The Translate button on the blog opens the page in Google Translate. Only if you use it, Google receives the page&apos;s address and text, and handles
          your visit under its <a href="https://policies.google.com/privacy">privacy policy</a>. The button is only on the blog, never on the finder.
        </p>
        <p>
          The Listen button reads an article aloud with your device&apos;s own voices. Some browsers use online voices from their maker, such as Google or
          Microsoft, which then receive the article&apos;s text. Your birth details are never read or sent.
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

        <h2>Cookies and browser storage</h2>
        <div className={s.tableWrap} tabIndex={0} role="region" aria-label="Cookies and browser storage">
          <table className={s.table}>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">From</th>
                <th scope="col">What it does</th>
                <th scope="col">Stops if you decline?</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>tithi-cookie-choice</td>
                <td>This site</td>
                <td>Remembers your cookie choice</td>
                <td>Needed</td>
              </tr>
              <tr>
                <td>tithi-birth</td>
                <td>This site</td>
                <td>Keeps your details in this tab only, and is never sent anywhere</td>
                <td>Needed</td>
              </tr>
              <tr>
                <td>_ga, _ga_*</td>
                <td>Google Analytics</td>
                <td>Tells one visitor from another</td>
                <td>Yes</td>
              </tr>
              <tr>
                <td>__gads, __gpi, __eoi</td>
                <td>Google ads (when ads are on)</td>
                <td>Shows ads, limits how often you see the same one, and measures them</td>
                <td>Yes, for ads based on your visits</td>
              </tr>
              <tr>
                <td>_fbp, _fbc</td>
                <td>Meta Pixel</td>
                <td>Measures ads and tells one visitor from another</td>
                <td>Yes</td>
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

        <h2>Your choices</h2>
        <ul>
          <li>Decline cookies on the finder page, or change your mind with Cookie settings.</li>
          <li>Clear the site&apos;s data in your browser at any time.</li>
          <li>Unsubscribe from the newsletter with the link in any email.</li>
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
