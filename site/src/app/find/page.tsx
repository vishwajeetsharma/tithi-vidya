import type { Metadata } from "next";

import { Finder } from "@/components/find/Finder";
import { JsonLd } from "@/components/JsonLd";
import { pageMetadata, siteUrl } from "@/lib/site";

import s from "./page.module.css";

const TITLE = "Find Your Tithi by Date of Birth";
const DESCRIPTION =
  "Enter your birth date, time and place to find your tithi, your moon month and your tithi birthday for the next 100 years. Free and private.";

export const metadata: Metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, path: "/find" });

export default function FindPage() {
  const origin = siteUrl().origin;
  return (
    <div className={s.page}>
      <JsonLd
        data={{
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: origin },
            { "@type": "ListItem", position: 2, name: "Find my tithi", item: `${origin}/find` },
          ],
        }}
      />
      <div className={`wrap ${s.inner}`}>
        <header className={s.head}>
          <p className="eyebrow">Free. No sign up. Your details stay on your device.</p>
          <h1 className={`display ${s.title}`}>
            Find your <em className="gradientText">moon birthday</em>
          </h1>
          <p className={s.lead}>Tell us when and where you were born. We will find your tithi and the dates it comes back on.</p>
        </header>
        <Finder />
      </div>
    </div>
  );
}
