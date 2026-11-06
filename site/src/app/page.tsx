import type { Metadata } from "next";

import { NewsletterSignup } from "@/components/blog/NewsletterSignup";
import { Credit } from "@/components/home/Credit";
import { DriftScene } from "@/components/home/DriftScene";
import { Faq } from "@/components/home/Faq";
import { FromTheBlog } from "@/components/home/FromTheBlog";
import { Hero } from "@/components/home/Hero";
import { HomeMotion } from "@/components/home/HomeMotion";
import { Proof } from "@/components/home/Proof";
import { Ribbon } from "@/components/home/Ribbon";
import { Statement } from "@/components/home/Statement";
import { Steps } from "@/components/home/Steps";
import { SunriseScene } from "@/components/home/SunriseScene";
import { TithiScene } from "@/components/home/TithiScene";
import { TryIt } from "@/components/home/TryIt";
import s from "@/components/home/home.module.css";
import { JsonLd } from "@/components/JsonLd";
import { getBuiltAt, latestPosts } from "@/lib/blog";
import { FAQ } from "@/lib/faq";
import { AUTHOR, CONTACT_EMAIL, SITE_DESCRIPTION, SITE_NAME, siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  const url = siteUrl().origin;
  return (
    <>
      <JsonLd
        data={{
          "@graph": [
            // Google uses these for the site name and logo shown in search results.
            { "@type": "WebSite", name: SITE_NAME, alternateName: "TithiVidya", url: `${url}/` },
            { "@type": "Organization", name: SITE_NAME, url: `${url}/`, logo: `${url}/icon-512.png`, email: CONTACT_EMAIL },
            {
              "@type": "WebApplication",
              name: SITE_NAME,
              url,
              description: SITE_DESCRIPTION,
              applicationCategory: "LifestyleApplication",
              operatingSystem: "Any",
              browserRequirements: "Requires a modern web browser",
              inLanguage: "en",
              offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
              author: { "@type": "Person", name: AUTHOR },
            },
            {
              "@type": "FAQPage",
              mainEntity: FAQ.map(({ q, a }) => ({
                "@type": "Question",
                name: q,
                acceptedAnswer: { "@type": "Answer", text: a },
              })),
            },
          ],
        }}
      />
      <HomeMotion />
      <div style={{ position: "relative", zIndex: 2 }}>
        <Hero />
        <Statement />
        <Ribbon />
        <TithiScene />
        <DriftScene />
        <SunriseScene />
        <Steps />
        <TryIt />
        <Proof />
        <FromTheBlog posts={latestPosts(3)} builtAt={getBuiltAt()} />
        <div className={`wrap ${s.newsletter}`} data-reveal>
          <NewsletterSignup />
        </div>
        <Faq />
        <Credit />
      </div>
    </>
  );
}
