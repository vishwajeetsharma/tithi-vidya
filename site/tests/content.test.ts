import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import sharp from "sharp";
import { beforeAll, describe, expect, it } from "vitest";

import { buildContent, liveAt } from "../scripts/content.mjs";

type Built = {
  slug: string;
  html: string;
  draft: boolean;
  liveAt: string;
  toc: { id: string }[];
  cover: { src: string; width: number; height: number; og: string } | null;
};

function site(posts: Record<string, string>, images: string[] = []) {
  const root = mkdtempSync(join(tmpdir(), "tithi-blog-"));
  for (const [path, text] of Object.entries(posts)) {
    mkdirSync(join(root, "content/blog", path, ".."), { recursive: true });
    writeFileSync(join(root, "content/blog", path), text);
  }
  return { root, images };
}

const post = (extra = "", body = "Hello.") => `---\ntitle: A post\ndescription: About things.\ndate: 2026-11-03\n${extra}---\n${body}\n`;

describe("the blog build", () => {
  let root: string;
  let posts: Built[];

  beforeAll(async () => {
    ({ root } = site({
      "with-image/index.md": post(
        "tags: [moon]\ncover: photo.png\ncoverAlt: A test photo\n",
        "# Big heading\n\n![A photo](photo.png \"A caption\")\n\n## One\n\n## Two\n\n| a | b |\n| - | - |\n| 1 | 2 |\n",
      ),
      "plain-file.md": post(),
      "secret.md": post("draft: true\n"),
      "README.md": "# Not a post",
    }));
    await sharp({ create: { width: 2400, height: 1200, channels: 3, background: "#5b4bdb" } })
      .png()
      .toFile(join(root, "content/blog/with-image/photo.png"));
    posts = (await buildContent({ site: root })) as Built[];
  }, 30_000);

  it("finds folder and single-file posts, but not drafts or the README", () => {
    expect(posts.map((p) => p.slug).sort()).toEqual(["plain-file", "with-image"]);
  });

  it("makes responsive images with fixed sizes", () => {
    const html = posts.find((p) => p.slug === "with-image")!.html;
    expect(html).toMatch(/srcset="[^"]*-480\.webp 480w, [^"]*-960\.webp 960w, [^"]*-1600\.webp 1600w"/);
    expect(html).toContain('width="1600" height="800"');
    expect(html).toContain('loading="lazy"');
    expect(html).toMatch(/<figure><img[^>]+><figcaption>A caption<\/figcaption><\/figure>/);
    const files = readdirSync(join(root, "public/blog-media"));
    expect(files.filter((f) => f.endsWith(".webp"))).toHaveLength(3);
    expect(files.some((f) => f.endsWith("-og.jpg"))).toBe(true);
  });

  it("keeps one main heading, wraps tables, and lists sections", () => {
    const built = posts.find((p) => p.slug === "with-image")!;
    expect(built.html).not.toContain("<h1");
    expect(built.html).toContain('<h2 id="big-heading">');
    expect(built.html).toContain('<div data-table="" tabindex="0" role="region" aria-label="Table">');
    expect(built.toc.map((h) => h.id)).toEqual(["big-heading", "one", "two"]);
  });

  it("writes a Markdown copy that points at the published images", () => {
    const copy = readFileSync(join(root, "public/blog/with-image.md"), "utf8");
    expect(copy).toMatch(/^# A post/);
    expect(copy).toMatch(/!\[A photo\]\(\/blog-media\/with-image-photo-[0-9a-f]+-1600\.webp/);
  });

  it("includes drafts when asked", async () => {
    const all = (await buildContent({ site: root, drafts: true })) as Built[];
    expect(all.find((p) => p.slug === "secret")?.draft).toBe(true);
  });
});

describe("scheduled posts", () => {
  it("go live at 6:00 AM India time on their date", () => {
    expect(Date.parse(liveAt("2026-11-10"))).toBe(Date.parse("2026-11-10T06:00:00+05:30"));
  });

  it("are built ahead, with when they go live and when the site was built", async () => {
    const { root } = site({ "later.md": post().replace("2026-11-03", "2099-01-01") });
    const now = new Date("2026-11-03T10:00:00Z");
    const built = (await buildContent({ site: root, now })) as Built[];
    expect(built.map((p) => [p.slug, p.liveAt])).toEqual([["later", "2099-01-01T00:30:00.000Z"]]);
    expect(JSON.parse(readFileSync(join(root, ".content/blog.json"), "utf8")).builtAt).toBe(now.toISOString());
  });
});

describe("blog mistakes", () => {
  it("names every problem in plain words", async () => {
    const { root } = site({
      "Bad Name.md": post(),
      "no-details.md": "---\ntitle: Only a title\n---\nText\n",
      "lost-image.md": post("", "![](missing.jpg)"),
    });
    const message = await buildContent({ site: root }).then(
      () => "",
      (error: Error) => error.message,
    );
    for (const words of ["lowercase letters", "add a description", "add a date", "needs alt text", '"missing.jpg" was not found']) {
      expect(message).toContain(words);
    }
    expect(existsSync(join(root, ".content/blog.json"))).toBe(false);
  });
});
