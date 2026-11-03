import { codeToHtml, type ThemeRegistrationRaw } from "shiki";

import snippets from "@/generated/snippets.json";
import codeTheme from "@/lib/code-theme.json";

import s from "./how.module.css";

/** Light only, and every colour passes AA contrast on its background. Shared with blog posts. */
const THEME = codeTheme as ThemeRegistrationRaw;

export async function CodeBlock({ name, label }: { name: keyof typeof snippets; label: string }) {
  const snippet = snippets[name];
  const html = await codeToHtml(snippet.code, {
    lang: snippet.lang,
    theme: THEME,
    transformers: [
      {
        pre(node) {
          node.properties["aria-label"] = `${label}. Code from ${snippet.file}`;
        },
      },
    ],
  });
  return (
    <figure className={s.code}>
      <figcaption>
        <span>{snippet.file}</span>
        <span className={s.codeLang}>{snippet.lang === "rust" ? "Rust" : "Python"}</span>
      </figcaption>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </figure>
  );
}
