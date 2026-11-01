import { codeToHtml, type ThemeRegistrationRaw } from "shiki";

import snippets from "@/generated/snippets.json";

import s from "./how.module.css";

/** Light only, and every colour passes AA contrast on its background. */
const THEME: ThemeRegistrationRaw = {
  name: "tithi-light",
  type: "light",
  colors: { "editor.background": "#fbfaff", "editor.foreground": "#231e52" },
  settings: [
    { settings: { foreground: "#231e52" } },
    { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: "#615c8c", fontStyle: "italic" } },
    { scope: ["keyword", "storage", "storage.type", "storage.modifier"], settings: { foreground: "#6426d8" } },
    { scope: ["entity.name.function", "support.function", "meta.function-call"], settings: { foreground: "#1f49d6" } },
    { scope: ["string", "string.quoted"], settings: { foreground: "#0b6e5a" } },
    { scope: ["constant.numeric", "constant.language", "constant.character"], settings: { foreground: "#a11f73" } },
    { scope: ["entity.name.type", "support.type", "entity.name.class", "support.class"], settings: { foreground: "#0f6596" } },
    { scope: ["variable.language", "variable.parameter"], settings: { foreground: "#8a3a12" } },
  ],
};

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
