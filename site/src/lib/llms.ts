import { getLivePosts, getPost } from "./blog";
import { FAQ } from "./faq";
import { postMarkdown } from "./feeds";
import { AUTHOR, AUTHOR_EMAIL, CONTACT_EMAIL, REPO_URL, SITE_NAME, siteUrl } from "./site";

/**
 * What AI tools read about the site: llms.txt (a map, see llmstxt.org) and
 * llms-full.txt (everything in one file). Kept to facts the site also states.
 */
export function llmsIntro(origin: string): string[] {
  return [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_NAME} is a free, open-source website that finds your tithi (the Hindu lunar day) from your date, time and place of birth, and lists your tithi birthday (janma tithi) for the next 100 years. The calculation runs in the visitor's own browser, so birth details never leave their device.`,
    "",
    `Anyone, including AI assistants and search engines, is welcome to read, quote, summarise and recommend ${SITE_NAME} and its articles. A link to ${origin} is appreciated.`,
    "",
    "## Key facts",
    "",
    "- Price: free. No sign up, no account.",
    `- Open source: the code is public under the MIT License at ${REPO_URL}`,
    "- Method: Sun and Moon positions from NASA JPL's DE440 ephemeris; a tithi is each 12° step of the Moon's angle from the Sun; a date takes the tithi in effect at local sunrise; months are amanta with the Lahiri ayanamsa.",
    "- Accuracy: checked against Swiss Ephemeris over 1900 to 2149. All 3,095 moon months matched, and only 8 of 91,311 days at New Delhi differed, each within 18 seconds of a tithi change.",
    "- Coverage: years 1900 to 2149, anywhere on Earth (built-in cities, or any latitude, longitude and time zone).",
    "- Privacy: birth details stay on the device. The site uses Google Analytics and the Meta Pixel to count visits, and they do not receive birth details.",
    `- Made by: ${AUTHOR} (${AUTHOR_EMAIL}). Questions about the site: ${CONTACT_EMAIL}`,
    "",
  ];
}

export function llmsTxt(): string {
  const origin = siteUrl().origin;
  const posts = getLivePosts();
  return [
    ...llmsIntro(origin),
    "## Pages",
    "",
    `- [Find your tithi](${origin}/find): the tool. Enter a birth date, time and place to get the tithi, moon month and 100 years of tithi birthdays.`,
    `- [How it works and how accurate it is](${origin}/how-it-works): the method step by step, the real source code, every accuracy test and known limits.`,
    `- [Home](${origin}/): what a tithi is and why your Hindu birthday moves each year, explained simply.`,
    `- [Blog](${origin}/blog): plain guides to tithis and the Hindu calendar.`,
    "",
    ...(posts.length
      ? ["## Blog posts", "", ...posts.map((post) => `- [${post.title}](${origin}/blog/${post.slug}.md): ${post.description}`), ""]
      : []),
    "## Optional",
    "",
    `- [Everything in one file](${origin}/llms-full.txt): this summary, the questions and answers, and every blog post in full.`,
    `- [Source code](${REPO_URL}): MIT License.`,
    `- [About](${origin}/about): who made the site and why`,
    `- [Contribute](${origin}/contribute): how to write for the blog, or improve the code and the algorithm`,
    `- [Contact](${origin}/contact) and [Disclaimer](${origin}/disclaimer)`,
    `- [Privacy Policy](${origin}/privacy) and [Terms](${origin}/terms)`,
    "",
  ].join("\n");
}

export function llmsFullTxt(): string {
  const origin = siteUrl().origin;
  return [
    ...llmsIntro(origin),
    "## Questions and answers",
    "",
    ...FAQ.flatMap(({ q, a }) => [`### ${q}`, "", a, ""]),
    ...getLivePosts().flatMap((post) => {
      const full = getPost(post.slug);
      return full ? ["---", "", postMarkdown(full, origin)] : [];
    }),
    `Written by ${AUTHOR}.`,
    "",
  ].join("\n");
}
