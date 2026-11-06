// Builds every file in brand/ from the site's own sources, so the brand kit
// always matches the product:
//   site/src/app/icon.svg          the mark
//   brand/tools/wordmark.json      the wordmark as outlines (make-wordmark.py)
//   site/src/components/Icons.tsx  the UI icons
//   site/src/app/globals.css       the colour tokens
//
//   node brand/tools/make-assets.mjs        (uses sharp from site/node_modules)
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const BRAND = join(ROOT, "brand");
const sharp = createRequire(join(ROOT, "site/package.json"))("sharp");

const INK = "#15113d";
const PAPER = "#f8f7ff";
const WHITE = "#ffffff";

// ---------- The mark: a moon at the start of its waxing half (Shukla Paksha) ----------

const CIRCLE = "M32 2a30 30 0 1 0 0 60a30 30 0 1 0 0-60Z";
const CRESCENT = "M32 8a24 24 0 0 1 0 48 34 34 0 0 0 0-48Z";
const GRADIENT = (id) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2758ec"/><stop offset="1" stop-color="#8f35e8"/></linearGradient>`;

/** The mark at (x, y), `size` wide. `tone` is "colour", or a single colour with the crescent cut out. */
function mark(x, y, size, tone, id = "g") {
  const t = `transform="translate(${x} ${y}) scale(${size / 64})"`;
  if (tone === "colour") return `<g ${t}><defs>${GRADIENT(id)}</defs><path d="${CIRCLE}" fill="url(#${id})"/><path d="${CRESCENT}" fill="${WHITE}"/></g>`;
  // On dark backgrounds the lit crescent stays the brightest part, so the moon never looks inverted.
  if (tone === WHITE) return `<g ${t}><path d="${CIRCLE} ${CRESCENT}" fill="${WHITE}" fill-opacity="0.3" fill-rule="evenodd"/><path d="${CRESCENT}" fill="${WHITE}"/></g>`;
  // One colour on light backgrounds: the crescent is cut out, so the paper shows as the lit part.
  return `<g ${t}><path d="${CIRCLE} ${CRESCENT}" fill="${tone}" fill-rule="evenodd"/></g>`;
}

// ---------- The wordmark ----------

const word = JSON.parse(await readFile(join(BRAND, "tools/wordmark.json"), "utf8"));
const W = word.bounds;
/** The wordmark with its baseline at (x, y), at font size `size`. */
const wordmark = (x, y, size, colour) =>
  `<path transform="translate(${x} ${y}) scale(${size / word.fontSize})" d="${word.path}" fill="${colour}"/>`;

const svg = (width, height, body, title) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${round(width)} ${round(height)}" width="${round(width)}" height="${round(height)}" role="img" aria-label="${title}"><title>${title}</title>${body}</svg>\n`;
const round = (n) => Math.round(n * 100) / 100;

// Proportions from the site header: the mark is 1.5 times the type size, 0.55 em away,
// centred on the capital letters.
const FONT = 100;
const MARK = FONT * 1.5;
const GAP = FONT * 0.55;
const CAP = word.capHeight * (FONT / word.fontSize);

function horizontal(tone) {
  const top = Math.min(-(CAP / 2) - MARK / 2, W.y);
  const bottom = Math.max(-(CAP / 2) + MARK / 2, W.y + W.height);
  const baseline = -top;
  const markTone = tone === "colour" ? "colour" : tone;
  const text = tone === "colour" ? INK : tone;
  const body = mark(0, baseline - CAP / 2 - MARK / 2, MARK, markTone, "gh") + wordmark(MARK + GAP - W.x, baseline, FONT, text);
  return svg(MARK + GAP + W.width, bottom - top, body, "Tithi Vidya");
}

function stacked(tone) {
  const size = FONT * 2;
  const gap = FONT * 0.35;
  const width = Math.max(size, W.width);
  const baseline = size + gap - W.y;
  const text = tone === "colour" ? INK : tone;
  const body = mark((width - size) / 2, 0, size, tone === "colour" ? "colour" : tone, "gs") + wordmark((width - W.width) / 2 - W.x, baseline, FONT, text);
  return svg(width, baseline + W.y + W.height, body, "Tithi Vidya");
}

const wordOnly = (colour) => svg(W.width, W.height, wordmark(-W.x, -W.y, FONT, colour), "Tithi Vidya");
const markOnly = (tone) => svg(64, 64, mark(0, 0, 64, tone, "gm"), "Tithi Vidya mark");
// For app stores, social avatars and home screens: the mark at 75% on the page colour, edge to edge.
const appIcon = () => svg(1024, 1024, `<rect width="1024" height="1024" fill="${PAPER}"/>${mark(128, 128, 768, "colour", "ga")}`, "Tithi Vidya app icon");

const LOGOS = {
  "mark": markOnly("colour"),
  "mark-ink": markOnly(INK),
  "mark-white": markOnly(WHITE),
  "mark-app-icon": appIcon(),
  "wordmark-ink": wordOnly(INK),
  "wordmark-white": wordOnly(WHITE),
  "lockup-horizontal": horizontal("colour"),
  "lockup-horizontal-ink": horizontal(INK),
  "lockup-horizontal-white": horizontal(WHITE),
  "lockup-stacked": stacked("colour"),
  "lockup-stacked-white": stacked(WHITE),
};

await rm(join(BRAND, "logo"), { recursive: true, force: true });
await mkdir(join(BRAND, "logo/svg"), { recursive: true });
await mkdir(join(BRAND, "logo/png"), { recursive: true });
for (const [name, file] of Object.entries(LOGOS)) {
  await writeFile(join(BRAND, `logo/svg/${name}.svg`), file);
  // PNGs 1024 px on the long side, transparent except the app icon.
  const width = Number(file.match(/width="([\d.]+)"/)[1]);
  const height = Number(file.match(/height="([\d.]+)"/)[1]);
  const scale = 1024 / Math.max(width, height);
  await sharp(Buffer.from(file), { density: 72 * scale * 2 })
    .resize(Math.round(width * scale), Math.round(height * scale))
    .png({ compressionLevel: 9 })
    .toFile(join(BRAND, `logo/png/${name}.png`));
}

// ---------- The icon system ----------

const BASE = `xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
const icons = {};
const source = await readFile(join(ROOT, "site/src/components/Icons.tsx"), "utf8");
for (const [, name, inner] of source.matchAll(/export function (\w+)Icon\([^)]*\) \{\s*return \(\s*<Icon \{\.\.\.props\}>([\s\S]*?)<\/Icon>/g)) {
  const kebab = name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
  icons[kebab] = inner.trim().replace(/\s+/g, " ").replace(/strokeWidth=/g, "stroke-width=");
}
// Icons drawn inside other components, and Spark, which is filled rather than outlined.
Object.assign(icons, {
  spark: `<path d="M12 1.5c.9 6 3.6 9.6 10.5 10.5C15.6 12.9 12.9 16.5 12 22.5c-.9-6-3.6-9.6-10.5-10.5C8.4 11.1 11.1 7.5 12 1.5Z" fill="currentColor" stroke="none" />`,
  bell: `<path d="M6 9a6 6 0 1 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9M10 20a2.2 2.2 0 0 0 4 0" />`,
  "bell-off": `<path d="M6 9a6 6 0 1 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9M10 20a2.2 2.2 0 0 0 4 0" /><path d="m4 4 16 16" />`,
  share: `<path d="M12 3v12M7.5 7.5 12 3l4.5 4.5M5 12v6.5A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5V12" />`,
  translate: `<path d="M4 5h9M8.5 3v2M6 5c.6 3.4 2.9 6.2 6 7.6M11 5c-.8 3.6-3.4 6.6-7 8" /><path d="m12.5 21 4-9 4 9M14 17.5h5" />`,
  play: `<path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.6-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" fill="currentColor" stroke="none" />`,
  pause: `<rect x="6" y="5" width="4" height="14" rx="1.2" fill="currentColor" stroke="none" /><rect x="14" y="5" width="4" height="14" rx="1.2" fill="currentColor" stroke="none" />`,
  stop: `<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none" />`,
});
await rm(join(BRAND, "icons"), { recursive: true, force: true });
await mkdir(join(BRAND, "icons"), { recursive: true });
for (const [name, inner] of Object.entries(icons)) await writeFile(join(BRAND, `icons/${name}.svg`), `<svg ${BASE} aria-hidden="true">${inner}</svg>\n`);

// ---------- Tokens ----------

const css = await readFile(join(ROOT, "site/src/app/globals.css"), "utf8");
const root = css.match(/:root\s*\{([\s\S]*?)\n\}/)[1];
const tokens = Object.fromEntries([...root.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, k, v]) => [k, v.trim()]));
await mkdir(join(BRAND, "tokens"), { recursive: true });
await writeFile(join(BRAND, "tokens/tokens.css"), `/* Copied from site/src/app/globals.css by brand/tools/make-assets.mjs. Edit there. */\n:root {${root}\n}\n`);
await writeFile(join(BRAND, "tokens/tokens.json"), JSON.stringify({ source: "site/src/app/globals.css", fonts: { display: "Fraunces (soft display cut, opsz 144, SOFT 100, WONK 1), 400 to 700", body: "Plus Jakarta Sans, 400 to 800" }, tokens }, null, 2) + "\n");

console.log(`brand: ${Object.keys(LOGOS).length} logos (SVG and PNG), ${Object.keys(icons).length} icons, ${Object.keys(tokens).length} tokens`);

// ---------- index.html: the guide, with every asset shown ----------

const SWATCHES = [
  ["Ink", "ink", "Headings, important text", "16.7:1"],
  ["Ink soft", "ink-soft", "Body text", "9.9:1"],
  ["Ink mute", "ink-mute", "Captions, dates, hints", "7.3:1"],
  ["Paper", "paper", "Page background", ""],
  ["Line", "line", "Dividers, card edges", ""],
  ["Field line", "field-line", "Text box borders", "3.3:1"],
  ["Blue", "blue", "Gradient start", "5.3:1"],
  ["Indigo", "indigo", "Links, focus, icons", "6.2:1"],
  ["Violet", "violet", "Gradient middle", "6.1:1"],
  ["Orchid", "orchid", "Gradient end, large accents", "4.5:1"],
  ["Lilac 100", "lilac-100", "Soft backgrounds, chips", ""],
  ["Periwinkle 200", "peri-200", "The sky", ""],
  ["Sun", "sun", "The sun in charts only", ""],
];
const dark = new Set(["ink", "ink-soft", "ink-mute", "blue", "indigo", "violet", "orchid", "field-line"]);
const tile = (file, bg, label, dark = false) =>
  `<figure class="tile${dark ? " dark" : ""}" style="background:${bg}"><img src="logo/svg/${file}.svg" alt="${label}"><figcaption>${label}<a href="logo/svg/${file}.svg" download>SVG</a><a href="logo/png/${file}.png" download>PNG</a></figcaption></figure>`;

const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Tithi Vidya brand guidelines</title>
<link rel="icon" href="logo/svg/mark.svg">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT,WONK@0,9..144,400..700,100,1;1,9..144,400..700,100,1&family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
:root {${root}
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--paper); color: var(--ink-soft); font: 400 17px/1.6 "Plus Jakarta Sans", system-ui, sans-serif; }
main { width: min(100% - 32px, 1120px); margin: 0 auto; padding: 56px 0 96px; }
h1, h2, .display { font-family: Fraunces, Georgia, serif; font-weight: 600; color: var(--ink); letter-spacing: -0.008em; line-height: 1.06; font-variation-settings: "SOFT" 100, "WONK" 1; }
h1 { font-size: clamp(2.6rem, 6vw, 4.5rem); margin: 18px 0 12px; }
h1 em { font-style: italic; background: var(--grad-text); -webkit-background-clip: text; background-clip: text; color: transparent; padding-inline: .1em; margin-inline: -.1em; }
h2 { font-size: clamp(1.9rem, 3.4vw, 2.6rem); margin: 72px 0 8px; }
h3 { color: var(--ink); font-size: 1.1rem; margin: 28px 0 8px; }
.eyebrow { color: var(--indigo); font-size: .78rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
.lead { max-width: 40rem; font-size: 1.2rem; }
a { color: #3b2fc4; }
.hero { display: grid; gap: 8px; padding: 40px; border-radius: 32px; background: radial-gradient(70% 120% at 100% 0%, #c9d4ff, transparent 70%), linear-gradient(160deg, #f4f1ff, #ebe4ff); }
.hero img { width: min(420px, 100%); }
.grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); margin-top: 20px; }
.tile { margin: 0; display: grid; place-items: center; min-height: 200px; padding: 28px 20px 52px; border-radius: 24px; position: relative; box-shadow: inset 0 0 0 1.5px var(--line); }
.tile img { max-width: 100%; max-height: 110px; }
.tile figcaption { position: absolute; left: 16px; right: 16px; bottom: 12px; display: flex; gap: 10px; font-size: .82rem; font-weight: 600; color: var(--ink-mute); }
.tile figcaption a { margin-left: auto; font-weight: 700; } .tile figcaption a + a { margin-left: 0; }
.tile.dark figcaption, .tile.dark figcaption a { color: #fff; }
.rules { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-top: 16px; }
.card { padding: 24px; border-radius: 24px; background: #fff; box-shadow: var(--shadow); }
.card ul { margin: 8px 0 0; padding-left: 1.2em; }
.space { display: grid; place-items: center; padding: 20px; border-radius: 20px; background: #fff; box-shadow: var(--shadow); }
.space div { padding: 40px; outline: 2px dashed #a79cf0; outline-offset: -2px; background: repeating-linear-gradient(45deg, #f2efff 0 8px, #fff 8px 16px); }
.space img { display: block; width: 320px; max-width: 70vw; background: var(--paper); }
.swatches { display: grid; gap: 14px; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); margin-top: 20px; }
.swatch { border-radius: 20px; overflow: hidden; background: #fff; box-shadow: var(--shadow); }
.swatch .chip { height: 96px; padding: 12px 14px; display: flex; align-items: flex-end; justify-content: space-between; font-weight: 700; font-size: .85rem; }
.swatch p { margin: 0; padding: 12px 14px 14px; font-size: .85rem; line-height: 1.4; }
.swatch strong { display: block; color: var(--ink); font-size: .95rem; }
code { font-family: ui-monospace, Menlo, monospace; font-size: .85em; }
.gradients { display: grid; gap: 14px; margin-top: 20px; }
.gradients div { padding: 22px; border-radius: 20px; color: #fff; font-weight: 700; }
.type { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); margin-top: 20px; }
.type .card .display { font-size: 3.2rem; margin: 6px 0; }
.icons { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(112px, 1fr)); margin-top: 20px; }
.icon { display: grid; justify-items: center; gap: 10px; padding: 20px 8px 14px; border-radius: 18px; background: #fff; box-shadow: inset 0 0 0 1.5px var(--line); color: var(--indigo); font-size: .8rem; font-weight: 600; }
.icon span { color: var(--ink-mute); }
.do { color: #146c43; font-weight: 700; } .dont { color: #b42318; font-weight: 700; }
</style>
</head>
<body>
<main>
<section class="hero">
  <span class="eyebrow">Brand guidelines</span>
  <img src="logo/svg/lockup-horizontal.svg" alt="Tithi Vidya">
  <h1>Moon days, <em>made simple</em></h1>
  <p class="lead">Tithi Vidya helps anyone find their moon birthday, simply, privately and accurately. Calm, warm, trustworthy and modern, with a sense of wonder about the moon.</p>
</section>

<h2>Logo</h2>
<p>A moon at the start of its waxing half, Shukla Paksha: a bright crescent grows on the right of a blue-to-purple disc. Use the files as they are.</p>
<div class="grid">
  ${tile("lockup-horizontal", "var(--paper)", "Horizontal, colour")}
  ${tile("lockup-horizontal-ink", "#fff", "Horizontal, one colour")}
  ${tile("lockup-horizontal-white", "linear-gradient(115deg,#2546cf,#4a32dc 46%,#7f2fd6)", "Horizontal, white", true)}
  ${tile("lockup-stacked", "var(--paper)", "Stacked, colour")}
  ${tile("lockup-stacked-white", "var(--ink)", "Stacked, white", true)}
  ${tile("mark", "#fff", "Mark, colour")}
  ${tile("mark-ink", "#fff", "Mark, one colour")}
  ${tile("mark-white", "var(--indigo)", "Mark, white", true)}
  ${tile("mark-app-icon", "#fff", "App icon and avatar")}
  ${tile("wordmark-ink", "#fff", "Wordmark")}
</div>

<h3>Clear space</h3>
<p>Keep at least half the mark's height clear on every side. Smallest sizes: the mark at 16 px, the horizontal lockup at 120 px wide (30 mm in print), the stacked lockup at 80 px.</p>
<div class="space"><div><img src="logo/svg/lockup-horizontal.svg" alt="The logo with its clear space shown"></div></div>

<div class="rules">
  <div class="card"><span class="do">Do</span><ul><li>Use the colour logo on light backgrounds.</li><li>Use the white logo on dark or gradient backgrounds.</li><li>Use the one-colour logo where the gradient can't print.</li></ul></div>
  <div class="card"><span class="dont">Don't</span><ul><li>Change colours, stretch, rotate or add effects.</li><li>Change the moon's phase or put the crescent on the left.</li><li>Retype "Tithi Vidya" in another font.</li><li>Put the colour logo on photos or the brand gradient.</li></ul></div>
</div>

<h2>Colour</h2>
<p>Light only. Ratios are contrast against the page colour; text needs 4.5:1.</p>
<div class="swatches">
${SWATCHES.map(([name, token, use, ratio]) => `  <div class="swatch"><div class="chip" style="background:var(--${token});color:${dark.has(token) ? "#fff" : "var(--ink)"}"><span>${ratio}</span><span>Aa</span></div><p><strong>${name}</strong><code>${tokens[token]}</code> · ${use}</p></div>`).join("\n")}
</div>
<div class="gradients">
  <div style="background:var(--grad)">Brand gradient · buttons, the mark <code>${tokens.grad}</code></div>
  <div style="background:linear-gradient(115deg,#2546cf 0%,#4a32dc 46%,#7f2fd6 100%)">Deep gradient · footer and call-to-action panels, white text</div>
</div>

<h2>Typography</h2>
<div class="type">
  <div class="card"><span class="eyebrow">Display · Fraunces, soft, 600</span><p class="display">Two birthdays</p><p>Headings, the wordmark and big numbers. Sentence case. One italic accent word per heading, in the text gradient.</p></div>
  <div class="card"><span class="eyebrow">Body · Plus Jakarta Sans</span><p style="font-size:1.6rem;color:var(--ink);font-weight:700;margin:12px 0 4px">Find my tithi</p><p>Body text at 400, labels and buttons at 600 to 700. At least 16 px, about 70 characters a line.</p></div>
</div>

<h2>Icons</h2>
<p>24 px grid, 2 px round stroke, no fill, in the colour of the text around them. Shown here in indigo.</p>
<div class="icons">
${Object.entries(icons).map(([name, inner]) => `  <div class="icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg><span>${name}</span></div>`).join("\n")}
</div>

<h2>Voice</h2>
<div class="rules">
  <div class="card"><span class="do">Like this</span><p>"Your tithi birthday falls on a different date each year. Here is the simple reason."</p><p>Plain English, short sentences, warm and honest about limits.</p></div>
  <div class="card"><span class="dont">Not like this</span><p>"Unlock the cosmic secrets hidden in your stars."</p><p>No mystical language, hype or fortune-telling.</p></div>
</div>

<p style="margin-top:56px">The full rules are in <a href="README.md">README.md</a>. Questions: <a href="mailto:contact@tithividya.org">contact@tithividya.org</a></p>
</main>
</body>
</html>
`;
await writeFile(join(BRAND, "index.html"), page);
console.log("brand: index.html");
