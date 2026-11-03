import Link from "next/link";

import { CONTACT_EMAIL, CREDIT, SITE_NAME } from "@/lib/site";

import { CookieSettingsButton } from "./CookieSettingsButton";

const GROUPS = [
  {
    title: "Explore",
    links: [
      { href: "/", label: "Home" },
      { href: "/find", label: "Find my tithi" },
      { href: "/blog", label: "Blog" },
      { href: "/how-it-works", label: "How it works" },
    ],
  },
  {
    title: "About",
    links: [
      { href: "/about", label: "About" },
      { href: "/contribute", label: "Contribute" },
      { href: "/contact", label: "Contact" },
      { href: "/disclaimer", label: "Disclaimer" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="siteFooter">
      <div className="wrap siteFooterInner">
        <p className="siteFooterCredit display">{CREDIT}.</p>
        <div className="siteFooterRow">
          <div className="siteFooterAbout">
            <p>{SITE_NAME}. Your details stay on your device.</p>
            <p>
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </p>
          </div>
          <nav className="siteFooterLinks" aria-label="Footer">
            {GROUPS.map((group) => (
              <div key={group.title} className="siteFooterGroup">
                <p className="siteFooterHeading">{group.title}</p>
                <ul>
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href}>{link.label}</Link>
                    </li>
                  ))}
                  {group.title === "Legal" && (
                    <li>
                      <CookieSettingsButton className="siteFooterButton" />
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
