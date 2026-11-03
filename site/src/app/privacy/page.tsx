import type { Metadata } from "next";
import Link from "next/link";

import { CookieSettingsButton } from "@/components/CookieSettingsButton";
import { SITE_NAME } from "@/lib/site";

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
          While you use the site, your browser keeps your details for that tab so a refresh still works. They are removed when you close the tab. If you use Copy
          link, the details are inside that link, so anyone you share it with can see them.
        </p>

        <h2>Analytics and advertising cookies</h2>
        <p>
          We load two services to count visits and measure our ads. They start when you open the site. We ask for your choice on the finder page, and if you click Decline, or decline later in Cookie settings, they stop and their cookies are cleared.
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

        <h2>The newsletter</h2>
        <p>
          If you subscribe, we keep your email address and, if you give it, your first name. They are stored by{" "}
          <a href="https://www.brevo.com/legal/privacypolicy/">Brevo</a>, which sends the newsletter for us. We use them only to send you the newsletter, and we
          never sell them. Brevo can record whether an email was opened or a link in it was clicked.
        </p>
        <p>
          Every email has an unsubscribe link. You can also email <a href="mailto:contact@thevishwa.in">contact@thevishwa.in</a> and we will remove you.
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
          <li>To ask about data held by Google or Meta, use the controls those companies provide.</li>
        </ul>

        <h2>Children</h2>
        <p>The site is not aimed at children, and we do not knowingly collect their data.</p>

        <h2>Changes and contact</h2>
        <p>
          If this policy changes, we will update this page and its date. For questions, email <a href="mailto:contact@thevishwa.in">contact@thevishwa.in</a>. See also our{" "}
          <Link href="/terms">Terms</Link>.
        </p>
      </div>
    </div>
  );
}
