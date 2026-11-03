// Builds the blog from content/blog. Runs before every build and dev server.
//
//   node scripts/content.mjs            every post except drafts (what Vercel runs)
//   node scripts/content.mjs --drafts   include posts marked `draft: true`
//   node scripts/content.mjs --watch    rebuild when a post or image changes
//
// A post dated in the future is built like any other, with `liveAt` set to
// 6:00 AM IST on its date. The pages hide it until then, by the visitor's
// clock. The sitemap, feed and llms.txt add it at the first build after that.
//
// Writes:
//   .content/blog.json          every post's details without its text, for lists, the sitemap and search
//   .content/posts/<slug>.json  one post with its HTML and Markdown, read by its page
//   public/blog-media/          resized WebP images, with content hashes in their names
//   public/blog/<slug>.md       a plain Markdown copy of each post, for AI tools
//   .content/contribute.json    ../CONTRIBUTING.md as HTML, for the /contribute page
//
// Each image and each post is processed once: results are kept in
// .next/cache/blog-media and .next/cache/blog-posts, which Vercel keeps between
// builds, so only new or changed posts and images cost time.
import { createHash } from "node:crypto";
import { existsSync, watch } from "node:fs";
import { copyFile, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import rehypeShiki from "@shikijs/rehype";
import matter from "gray-matter";
import { toString as hastText } from "hast-util-to-string";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import sharp from "sharp";
import { unified } from "unified";
import { visit } from "unist-util-visit";

import codeTheme from "../src/lib/code-theme.json" with { type: "json" };

const SITE = join(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_AUTHOR = "Vishwajeet Sharma";
const WIDTHS = [480, 960, 1600];
const IMAGE_VERSION = "webp-q78-v1"; // change to reprocess every image
const RASTER = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif", ".tif", ".tiff"]);
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Finds every post: content/blog/<slug>.md or content/blog/<slug>/index.md. */
async function findPosts(dir) {
  if (!existsSync(dir)) return [];
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith("_") || entry.name.startsWith(".") || entry.name.toLowerCase() === "readme.md") continue;
    if (entry.isFile() && entry.name.endsWith(".md")) {
      found.push({ slug: entry.name.slice(0, -3), file: join(dir, entry.name) });
    } else if (entry.isDirectory() && existsSync(join(dir, entry.name, "index.md"))) {
      found.push({ slug: entry.name, file: join(dir, entry.name, "index.md") });
    }
  }
  return found;
}

/** YAML turns `2026-11-03` into a Date; keep it as the plain date the author wrote. */
function asDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  return typeof value === "string" ? value.trim() : "";
}

/** A post goes live at 6:00 AM IST on its date. India has no daylight saving, so that is always 00:30 UTC. */
function liveAt(date) {
  return `${date}T00:30:00.000Z`;
}

function checkFrontMatter(slug, data, problems) {
  const where = `${slug}:`;
  if (!SLUG.test(slug)) problems.push(`${where} the file or folder name must use only lowercase letters, numbers and hyphens, like my-first-post`);
  if (typeof data.title !== "string" || !data.title.trim()) problems.push(`${where} add a title, like  title: "Why my birthday moves"`);
  if (typeof data.description !== "string" || !data.description.trim()) problems.push(`${where} add a description: one or two sentences for Google and social media`);
  if (!DATE.test(asDate(data.date))) problems.push(`${where} add a date in the form YYYY-MM-DD, like  date: 2026-11-03`);
  if (data.updated !== undefined && !DATE.test(asDate(data.updated))) problems.push(`${where} updated must be a date in the form YYYY-MM-DD`);
  if (data.cover !== undefined && (typeof data.coverAlt !== "string" || !data.coverAlt.trim())) {
    problems.push(`${where} add coverAlt: a few words describing the cover image, for people who can't see it`);
  }
  if (data.tags !== undefined && !(Array.isArray(data.tags) && data.tags.every((t) => typeof t === "string"))) {
    problems.push(`${where} tags must be a list, like  tags: [tithi, birthday]`);
  }
}

/** Resizes one image into WebP widths, reusing earlier results from the cache. */
function imageProcessor({ mediaDir, cacheDir }) {
  const done = new Map();

  async function cached(name, make) {
    const store = join(cacheDir, name);
    if (!existsSync(store)) await make(store);
    await copyFile(store, join(mediaDir, name));
    return `/blog-media/${name}`;
  }

  return function process(file, slug) {
    if (!done.has(file)) done.set(file, run(file, slug));
    return done.get(file);
  };

  async function run(file, slug) {
    const bytes = await readFile(file);
    const ext = extname(file).toLowerCase();
    const hash = createHash("sha1").update(bytes).update(IMAGE_VERSION).digest("hex").slice(0, 10);
    const stem = basename(file, extname(file)).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "image";
    const base = `${slug}-${stem}-${hash}`;

    if (ext === ".svg") {
      const meta = await sharp(bytes).metadata();
      const src = await cached(`${base}.svg`, (to) => writeFile(to, bytes));
      return { src, srcset: "", width: meta.width, height: meta.height, largest: src, og: "" };
    }
    if (!RASTER.has(ext)) throw new Error(`${relative(SITE, file)}: images must be JPG, PNG, WebP, AVIF, GIF or SVG`);

    const meta = await sharp(bytes).metadata();
    const width = meta.autoOrient?.width ?? meta.width;
    const height = meta.autoOrient?.height ?? meta.height;
    const animated = (meta.pages ?? 1) > 1;
    const sizes = [...new Set([...WIDTHS.filter((w) => w < width), Math.min(width, WIDTHS.at(-1))])].sort((a, b) => a - b);

    const urls = [];
    for (const w of sizes) {
      urls.push(
        await cached(`${base}-${w}.webp`, (to) =>
          sharp(bytes, { animated }).rotate().resize({ width: w }).webp({ quality: 78, effort: 4 }).toFile(to),
        ),
      );
    }
    const og = await cached(`${base}-og.jpg`, (to) =>
      sharp(bytes).rotate().resize(1200, 630, { fit: "cover" }).jpeg({ quality: 82, mozjpeg: true }).toFile(to),
    );
    const top = sizes.at(-1);
    return {
      src: urls.at(-1),
      srcset: urls.map((url, i) => `${url} ${sizes[i]}w`).join(", "),
      width: top,
      height: Math.round((top * height) / width),
      largest: urls.at(-1),
      og,
    };
  }
}

/** Article images fill the text column. Keep in step with IMAGE_SIZES on the post page. */
const SIZES = "(min-width: 2400px) 860px, (min-width: 2100px) 800px, (min-width: 1700px) 760px, (min-width: 760px) 720px, calc(100vw - 32px)";

/**
 * Shapes the article HTML: one h1 per page (the title), responsive images
 * with fixed sizes so nothing jumps, captions from image titles, and tables
 * that scroll on phones. Also collects the headings for "On this page".
 */
function rehypeArticle({ file, slug, processImage, images, toc, problems }) {
  return () => async (tree) => {
    const jobs = [];
    visit(tree, "element", (node, index, parent) => {
      if (node.tagName === "h1") node.tagName = "h2";

      if (node.tagName === "img") {
        const raw = String(node.properties.src ?? "");
        node.properties.loading = "lazy";
        node.properties.decoding = "async";
        if (!node.properties.alt) problems.push(`${slug}: every image needs alt text, like ![A full moon over Delhi](moon.jpg)`);
        if (/^https?:\/\//.test(raw) || raw.startsWith("/")) return;
        const path = resolve(dirname(file), decodeURIComponent(raw));
        if (!existsSync(path)) {
          problems.push(`${slug}: image "${raw}" was not found next to the post`);
          return;
        }
        jobs.push(
          processImage(path, slug).then((image) => {
            images.set(raw, image);
            Object.assign(node.properties, { src: image.src, width: image.width, height: image.height });
            if (image.srcset) Object.assign(node.properties, { srcSet: image.srcset, sizes: SIZES });
          }),
        );
      }

      // ![Alt](photo.jpg "Caption") becomes a figure with a caption.
      if (node.tagName === "p" && parent && index !== undefined) {
        const kids = node.children.filter((child) => !(child.type === "text" && !child.value.trim()));
        const image = kids.length === 1 && kids[0].type === "element" && kids[0].tagName === "img" ? kids[0] : null;
        if (image) {
          const caption = image.properties.title;
          delete image.properties.title;
          parent.children[index] = {
            type: "element",
            tagName: "figure",
            properties: {},
            children: caption ? [image, { type: "element", tagName: "figcaption", properties: {}, children: [{ type: "text", value: String(caption) }] }] : [image],
          };
        }
      }

      if (node.tagName === "table" && parent && index !== undefined && !(parent.type === "element" && parent.properties?.dataTable)) {
        parent.children[index] = {
          type: "element",
          tagName: "div",
          properties: { dataTable: "", tabIndex: 0, role: "region", ariaLabel: "Table" },
          children: [node],
        };
      }
    });
    await Promise.all(jobs);
    visit(tree, "element", (node) => {
      if (node.tagName === "h2" && node.properties.id) toc.push({ id: String(node.properties.id), text: hastText(node) });
    });
  };
}

async function renderPost({ slug, file, source }, processImage, problems) {
  const { data, content } = matter(source);
  const before = problems.length;
  checkFrontMatter(slug, data, problems);

  const images = new Map();
  const toc = [];
  const html = String(
    await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype)
      .use(rehypeSlug)
      .use(rehypeArticle({ file, slug, processImage, images, toc, problems }))
      .use(rehypeShiki, SHIKI)
      .use(rehypeStringify)
      .process(content),
  );

  let cover = null;
  if (typeof data.cover === "string") {
    const path = resolve(dirname(file), data.cover);
    if (!existsSync(path)) problems.push(`${slug}: cover image "${data.cover}" was not found next to the post`);
    else cover = { ...(await processImage(path, slug)), alt: String(data.coverAlt ?? "") };
  }
  if (problems.length > before) return null;

  // The Markdown copy points at the published images, so it reads well on its own.
  let markdown = content.trim();
  for (const [raw, image] of images) markdown = markdown.split(`](${raw}`).join(`](${image.largest}`);
  const words = content.split(/\s+/).filter(Boolean).length;
  const date = asDate(data.date);

  return {
    slug,
    title: data.title.trim(),
    description: data.description.trim(),
    date,
    liveAt: liveAt(date),
    updated: data.updated ? asDate(data.updated) : date,
    author: typeof data.author === "string" && data.author.trim() ? data.author.trim() : DEFAULT_AUTHOR,
    tags: Array.isArray(data.tags) ? data.tags : [],
    draft: data.draft === true,
    cover,
    toc,
    words,
    minutes: Math.max(1, Math.round(words / 200)),
    html,
    markdown,
  };
}

/**
 * What every post's HTML depends on besides its own files: this script, the
 * code colours and the installed packages. Changing any of them builds every
 * post again.
 */
async function rendererKey() {
  const hash = createHash("sha1");
  for (const file of [fileURLToPath(import.meta.url), join(SITE, "src/lib/code-theme.json"), join(SITE, "package-lock.json")]) {
    if (existsSync(file)) hash.update(await readFile(file));
  }
  return hash.digest("hex");
}

/**
 * Turning Markdown into HTML is most of the blog's build time, so each post's
 * result is kept in the cache and reused while the post, its images and the
 * renderer are unchanged. A post with a problem is never kept.
 */
async function cachedRender({ slug, file }, { site, cacheDir, renderer, processImage, problems }) {
  const source = await readFile(file, "utf8");
  const key = createHash("sha1").update(renderer).update(source).digest("hex");
  const store = join(cacheDir, `${slug}.json`);
  try {
    const saved = JSON.parse(await readFile(store, "utf8"));
    if (saved.key === key) {
      // Processing an image again is quick, checks it hasn't changed, and copies it into public/blog-media.
      const images = await Promise.all(saved.images.map((image) => processImage(join(site, image.file), slug)));
      if (images.every((image, i) => image.src === saved.images[i].src)) return saved.post;
    }
  } catch {
    // Not kept yet, or an image went missing: build the post, which names any problem.
  }
  const used = [];
  const track = (path, slug) =>
    processImage(path, slug).then((image) => {
      used.push({ file: relative(site, path), src: image.src });
      return image;
    });
  const post = await renderPost({ slug, file, source }, track, problems);
  if (post) await writeFile(store, JSON.stringify({ key, images: used, post }));
  return post;
}

function markdownCopy(post) {
  const lines = [`# ${post.title}`, "", `> ${post.description}`, "", `Published ${post.date}${post.updated !== post.date ? `, updated ${post.updated}` : ""}, by ${post.author}.`, ""];
  if (post.cover) lines.push(`![${post.cover.alt}](${post.cover.largest})`, "");
  lines.push(post.markdown, "");
  return lines.join("\n");
}

// Grammars load only for languages a page actually uses; loading them all takes
// seconds. Each code block becomes a labelled group that the keyboard can
// reach, so code wider than a phone can still be scrolled. A group, not a
// region, so many code blocks don't crowd the page's list of landmarks.
const SHIKI = {
  theme: codeTheme,
  langs: [],
  lazy: true,
  defaultLanguage: "text",
  fallbackLanguage: "text",
  transformers: [
    {
      pre(node) {
        const lang = this.options.lang;
        Object.assign(node.properties, { tabindex: 0, role: "group", "aria-label": lang && lang !== "text" ? `Code example, ${lang}` : "Code example" });
      },
    },
  ],
};

// Keep in step with SITE_ORIGIN and REPO_URL in src/lib/site.ts.
const LIVE_ORIGIN = "https://www.tithividya.org";
const REPO_FILES = "https://github.com/vishwajeetsharma/tithi-vidya/blob/main/";

/**
 * Links in CONTRIBUTING.md are written to work on GitHub. On the site, links
 * to the live site become local, and paths in the repository go to GitHub.
 * The opening title and the "this guide is also on the website" line go,
 * since the page has its own.
 */
function rehypeGuide({ toc }) {
  return () => (tree) => {
    visit(tree, "element", (node, index, parent) => {
      if (node.tagName === "h1" && parent && index !== undefined) {
        parent.children.splice(index, 1);
        return index;
      }
      if (node.tagName === "a") {
        const href = String(node.properties.href ?? "");
        if (href.startsWith(LIVE_ORIGIN)) node.properties.href = href.slice(LIVE_ORIGIN.length) || "/";
        else if (!/^(https?:|mailto:|#)/.test(href)) node.properties.href = REPO_FILES + href;
        if (node.properties.href === "/contribute" && parent?.type === "element" && parent.tagName === "p") parent.properties.dataDrop = "";
      }
      if (node.tagName === "table" && parent && index !== undefined && !(parent.type === "element" && parent.properties?.dataTable)) {
        parent.children[index] = {
          type: "element",
          tagName: "div",
          properties: { dataTable: "", tabIndex: 0, role: "region", ariaLabel: "Table" },
          children: [node],
        };
      }
    });
    visit(tree, "element", (node, index, parent) => {
      if (node.properties?.dataDrop !== undefined && parent && index !== undefined) {
        parent.children.splice(index, 1);
        return index;
      }
      if (node.tagName === "h2" && node.properties.id) toc.push({ id: String(node.properties.id), text: hastText(node) });
    });
  };
}

/** The contributing guide at the repository root, for the /contribute page. One source, so the two never differ. */
async function buildGuide(site, outDir) {
  const file = join(site, "..", "CONTRIBUTING.md");
  const out = join(outDir, "contribute.json");
  if (!existsSync(file)) {
    // Vercel includes files outside the Root Directory unless that setting is turned off.
    console.warn("blog: CONTRIBUTING.md was not found next to site/, so /contribute links to GitHub instead");
    await writeFile(out, JSON.stringify(null));
    return;
  }
  const toc = [];
  const html = String(
    await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype)
      .use(rehypeSlug)
      .use(rehypeGuide({ toc }))
      .use(rehypeShiki, SHIKI)
      .use(rehypeStringify)
      .process(await readFile(file, "utf8")),
  );
  await writeFile(out, JSON.stringify({ html, toc }));
}

export async function buildContent({ site = SITE, drafts = false, now = new Date() } = {}) {
  const started = performance.now();
  const contentDir = join(site, "content/blog");
  const outDir = join(site, ".content");
  const mediaDir = join(site, "public/blog-media");
  const postsDir = join(outDir, "posts");
  const copyDir = join(site, "public/blog");
  const cacheDir = join(site, ".next/cache/blog-media");
  const postCacheDir = join(site, ".next/cache/blog-posts");

  await rm(mediaDir, { recursive: true, force: true });
  await rm(copyDir, { recursive: true, force: true });
  await Promise.all([outDir, postsDir, mediaDir, copyDir, cacheDir, postCacheDir].map((dir) => mkdir(dir, { recursive: true })));

  const problems = [];
  const processImage = imageProcessor({ mediaDir, cacheDir });
  const renderer = await rendererKey();
  const found = await findPosts(contentDir);
  const slugs = new Set();
  for (const { slug } of found) {
    if (slugs.has(slug)) problems.push(`${slug}: two posts share this name; rename one`);
    slugs.add(slug);
  }
  const rendered = await Promise.all(
    found.map((post) => cachedRender(post, { site, cacheDir: postCacheDir, renderer, processImage, problems })),
  );
  if (problems.length) {
    throw new Error(`The blog could not be built. Please fix:\n${problems.map((p) => `  - ${p}`).join("\n")}`);
  }

  const posts = rendered
    .filter((post) => post && (drafts || !post.draft))
    .sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
  // builtAt lets every page agree on which posts were live when the HTML was made.
  const TEXT = new Set(["html", "markdown"]);
  const details = posts.map((post) => Object.fromEntries(Object.entries(post).filter(([key]) => !TEXT.has(key))));
  await writeFile(join(outDir, "blog.json"), JSON.stringify({ builtAt: now.toISOString(), posts: details }));
  await Promise.all(
    posts.flatMap((post) => [
      writeFile(join(postsDir, `${post.slug}.json`), JSON.stringify(post)),
      writeFile(join(copyDir, `${post.slug}.md`), markdownCopy(post)),
    ]),
  );
  // Written over in place, not emptied first, so a running dev server never finds a post missing.
  // Then deleted, renamed and draft posts go, here and in the cache.
  const files = (list) => new Set(list.map((post) => `${post.slug}.json`));
  for (const [dir, wanted] of [[postsDir, files(posts)], [postCacheDir, files(found)]]) {
    await Promise.all((await readdir(dir)).filter((name) => !wanted.has(name)).map((name) => rm(join(dir, name), { force: true })));
  }
  await buildGuide(site, outDir);

  const images = (await readdir(mediaDir)).length;
  console.log(`blog: ${posts.length} post${posts.length === 1 ? "" : "s"}, ${images} image files, ${Math.round(performance.now() - started)} ms`);
  for (const post of posts.filter((p) => new Date(p.liveAt) > now)) {
    console.log(`blog: "${post.slug}" is scheduled, and goes live on ${post.date} at 6:00 AM IST`);
  }
  return posts;
}

const isCli = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const drafts = process.argv.includes("--drafts");
  const run = () =>
    buildContent({ drafts }).catch((error) => {
      console.error(`\n${error.message}\n`);
      if (!process.argv.includes("--watch")) process.exit(1);
    });
  if (!process.argv.includes("--skip-initial")) await run();
  if (process.argv.includes("--watch")) {
    let timer;
    const dir = join(SITE, "content/blog");
    await mkdir(dir, { recursive: true });
    watch(dir, { recursive: true }, () => {
      clearTimeout(timer);
      timer = setTimeout(run, 200);
    });
    console.log("blog: watching content/blog for changes");
  }
}

// Exposed for tests.
export { asDate, findPosts, liveAt };
