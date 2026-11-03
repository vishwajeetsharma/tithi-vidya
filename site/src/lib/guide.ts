import { readFileSync } from "node:fs";
import { join } from "node:path";

export type Guide = { html: string; toc: { id: string; text: string }[] };

/** CONTRIBUTING.md as HTML, built by scripts/content.mjs. Null if the build could not see the file. */
export function getGuide(): Guide | null {
  try {
    return JSON.parse(readFileSync(join(process.cwd(), ".content/contribute.json"), "utf8")) as Guide | null;
  } catch {
    return null;
  }
}
