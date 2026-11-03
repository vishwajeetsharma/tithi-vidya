import type { Post } from "./blog";

/** Escapes text for XML and HTML. */
export const escape = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Makes a post's site-relative links and images absolute, for feeds and AI tools. */
export function absoluteHtml(html: string, origin: string): string {
  return html
    .replace(/(src|href)="\//g, `$1="${origin}/`)
    .replace(/srcset="([^"]*)"/g, (_, set: string) => `srcset="${set.replace(/(^|, )\//g, `$1${origin}/`)}"`);
}

export const absoluteMarkdown = (markdown: string, origin: string) => markdown.replace(/\]\(\//g, `](${origin}/`);

/** One post as Markdown, the same shape as the /blog/<slug>.md copies. */
export function postMarkdown(post: Post, origin: string): string {
  const lines = [`# ${post.title}`, "", `> ${post.description}`, "", `Published ${post.date} by ${post.author}. ${origin}/blog/${post.slug}`, ""];
  if (post.cover) lines.push(`![${post.cover.alt}](${origin}${post.cover.largest})`, "");
  lines.push(absoluteMarkdown(post.markdown, origin), "");
  return lines.join("\n");
}
