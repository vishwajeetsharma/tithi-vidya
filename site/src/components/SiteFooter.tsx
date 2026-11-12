"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { inLang, splitPath } from "@/i18n/config";
import { dictionary } from "@/i18n/dictionaries";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

import { CookieSettingsButton } from "./CookieSettingsButton";

export function SiteFooter() {
  // The footer follows the page's language (/hi/... is Hindi). The home page and the
  // blog exist in each language; the other pages are in English for now.
  const { lang } = splitPath(usePathname());
  const t = dictionary(lang).footer;
  const GROUPS = [
    {
      title: t.explore,
      links: [
        { href: inLang(lang, "/"), label: t.home },
        { href: "/find", label: t.find },
        { href: inLang(lang, "/blog"), label: t.blog },
        { href: "/how-it-works", label: t.how },
      ],
    },
    {
      title: t.about,
      links: [
        { href: "/about", label: t.aboutUs },
        { href: "/contribute", label: t.contribute },
        { href: "/ai-use", label: t.ai },
        { href: "/contact", label: t.contact },
        { href: "/disclaimer", label: t.disclaimer },
      ],
    },
    {
      title: t.legal,
      legal: true,
      links: [
        { href: "/privacy", label: t.privacy },
        { href: "/terms", label: t.terms },
      ],
    },
  ];
  return (
    <footer className="siteFooter" lang={lang}>
      <div className="wrap siteFooterInner">
        <p className="siteFooterCredit display">{t.credit}.</p>
        <div className="siteFooterRow">
          <div className="siteFooterAbout">
            <p>
              {SITE_NAME}. {t.promise}
            </p>
            <p>
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </p>
          </div>
          <nav className="siteFooterLinks" aria-label={t.label}>
            {GROUPS.map((group) => (
              <div key={group.title} className="siteFooterGroup">
                <p className="siteFooterHeading">{group.title}</p>
                <ul>
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href}>{link.label}</Link>
                    </li>
                  ))}
                  {group.legal && (
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
