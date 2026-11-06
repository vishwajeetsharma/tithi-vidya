# Tithi Vidya brand guidelines

How Tithi Vidya looks, sounds and stays consistent: the logo, colours, type, icons, shapes and words. Open [`index.html`](index.html) in a browser for the same guide with every asset shown.

Everything here is built from the website's own files, so the brand and the product never drift apart. See [Updating the kit](#updating-the-kit).

## The brand in one line

**Tithi Vidya helps anyone find their moon birthday, simply, privately and accurately.**

- **Tithi** is the lunar day, one of the 30 steps of the moon's cycle. **Vidya** means knowledge.
- **Personality:** calm, warm, trustworthy and modern. It is a careful tool with a sense of wonder about the moon, not a mystical or fortune-telling brand.
- **Promise:** free, no sign-up, and birth details never leave the visitor's device.

## Logo

### The mark

A moon at the start of its waxing half, Shukla Paksha. A bright crescent grows on the right of a blue-to-purple disc. It is the same icon as the site's favicon and app icon.

| File | Use it on |
| --- | --- |
| `logo/svg/mark.svg` | Light backgrounds. The main version. |
| `logo/svg/mark-ink.svg` | One-colour printing, stamps and light backgrounds where the gradient can't print. The crescent is cut out. |
| `logo/svg/mark-white.svg` | Dark or gradient backgrounds. The crescent stays the brightest part. |
| `logo/svg/mark-app-icon.svg` | App stores, social media avatars and home screens: the mark on the page colour, square. |

### Lockups

| File | Use it on |
| --- | --- |
| `logo/svg/lockup-horizontal.svg` | The default logo. Headers, documents, slides, email. |
| `logo/svg/lockup-horizontal-ink.svg` | One-colour printing on light backgrounds. |
| `logo/svg/lockup-horizontal-white.svg` | Dark or gradient backgrounds, such as the site footer. |
| `logo/svg/lockup-stacked.svg`, `-white` | Square spaces: posters, video end cards, social posts. |
| `logo/svg/wordmark-ink.svg`, `-white` | Only where the mark already appears nearby. |

Every file has a PNG twin in `logo/png/`, 1024 px on its long side, with a transparent background (except the app icon).

The proportions come from the site header: the mark is 1.5 times the type size, sits 0.55 em from the wordmark, and is centred on the capital letters. Don't rebuild a lockup by hand; use the files.

### Clear space and size

- **Clear space:** keep a gap of at least **half the mark's height** on every side, free of text, edges and other logos.
- **Smallest sizes on screen:** the mark at **16 px** (it is the favicon), the horizontal lockup at **120 px** wide, and the stacked lockup at **80 px** wide.
- **Smallest sizes in print:** the horizontal lockup at **30 mm** wide, the mark at **6 mm**.

### Don't

- Change the colours, the gradient's direction or the crescent's side. The crescent is always on the right.
- Show the moon full, empty, or as a different phase. The site's moons change phase; the logo does not.
- Stretch, rotate, outline, add shadows or effects, or put it in a different shape.
- Set "Tithi Vidya" in another font, or write it as "TithiVidya" or "Tithi-Vidya" in the logo.
- Place the colour logo on busy photos or on the brand gradient. Use the white version there.
- Use the white version on light backgrounds, or the colour version on dark ones.

## Colour

All colours are in `tokens/tokens.css` and `tokens/tokens.json`. The ratios are contrast against the page colour, `#f8f7ff`, unless noted. Text needs 4.5:1 (WCAG AA), and large text and borders need 3:1.

### Text and surfaces

| Name | Hex | Use | Contrast |
| --- | --- | --- | --- |
| Ink | `#15113d` | Headings and important text | 16.7:1 |
| Ink soft | `#3d3870` | Body text | 9.9:1 |
| Ink mute | `#524b84` | Captions, dates, hints | 7.3:1 |
| Paper | `#f8f7ff` | The page background | |
| Card | `#ffffff` | Cards and panels | |
| Line | `#e3dffb` | Dividers and card edges (decorative only) | |
| Field line | `#8a80cf` | Text box borders | 3.3:1 |

### Brand colours

| Name | Hex | Use | Contrast |
| --- | --- | --- | --- |
| Blue | `#2758ec` | Gradient start | 5.3:1 |
| Indigo | `#4a3bf0` | Links, focus rings, small labels, icons | 6.2:1 |
| Violet | `#7030e6` | Gradient middle, accents | 6.1:1 |
| Orchid | `#a23bea` | Gradient end, large accents only | 4.5:1 |
| Lilac 50, 100, 200 | `#f2efff`, `#e7e2ff`, `#d5ccff` | Soft backgrounds, chips, selection | Ink on lilac 100: 14.2:1 |
| Periwinkle 100, 200 | `#dfe6ff`, `#c6d1ff` | The sky behind pages | |
| Sun | `#ffb25e`, `#ff8a5c` | Only the sun in illustrations and charts. Never text on light backgrounds (1.7:1). | Ink on sun: 10:1 |

White text works on every brand colour: 5.7:1 on blue, 6.6:1 on indigo, 6.5:1 on violet and 4.8:1 on orchid.

### Gradients

- **Brand gradient:** `linear-gradient(105deg, #2758ec 0%, #5138ee 48%, #8f35e8 100%)`. Primary buttons, the mark, highlights.
- **Text gradient:** `linear-gradient(100deg, #2758ec 0%, #5a38ee 45%, #a12fd8 100%)`. One accent word in a heading, in italic, such as "*two birthdays*". Never a whole sentence.
- **Deep gradient:** `linear-gradient(115deg, #2546cf 0%, #4a32dc 46%, #7f2fd6 100%)`. The footer and large call-to-action panels, with white text.

The site is light only. There is no dark theme; dark surfaces are always the deep gradient or ink.

## Typography

| Role | Font | Settings |
| --- | --- | --- |
| Display: headings, the wordmark, big numbers | **Fraunces**, the soft display cut | Weight 600 (500 to 700). Optical size 144, SOFT 100, WONK 1. Line height about 1.04, letter spacing −0.008 em. |
| Body: everything else | **Plus Jakarta Sans** | 400 for text, 600 to 700 for labels and buttons, 800 for tiny numbers. Line height about 1.6. |

- Both fonts are free under the SIL Open Font License. The site uses a trimmed Fraunces in `site/src/fonts/`. Download the full families from Google Fonts for design work.
- Headings use sentence case. Labels above headings ("eyebrows") are small, bold, letter-spaced capitals in indigo.
- The accent word in a heading is Fraunces italic with the text gradient. One per heading at most.
- Keep body text at 16 px or larger on screen, with lines no longer than about 70 characters.

## Icons

The 20 interface icons are in `icons/`, one SVG each.

- **Grid:** 24 × 24, drawn inside a 2 px margin.
- **Stroke:** 2 px, round caps and round joins, no fill. Play, pause, stop and spark are the filled exceptions.
- **Colour:** `currentColor`, so an icon takes the colour of its text. Usually indigo, or white on gradients.
- **Size:** 22 px next to text by default, 17 to 20 px in small buttons. Never below 16 px.
- **Meaning:** an icon always comes with a word, except Stop and the menu, which have a spoken label. Icons are hidden from screen readers (`aria-hidden`).
- **New icons:** draw them on the same grid with the same stroke, simple and rounded, and add them to `site/src/components/Icons.tsx`.

## The moon

The moon is the brand's main image.

- **Small moons** (`MoonPhase` on the site) show a real phase: a deep indigo disc `#3a2fb0`, a pale lit part `#f4f1ff` and a thin rim `#7a6cf0`. Use them to show a tithi or progress, never as decoration with a made-up phase.
- **The big moon** on the home page is a real lunar surface in brand blue and lilac, with a soft violet glow.
- Waxing moons light up on the right, waning moons on the left, as seen from India.

## Shape, depth and motion

- **Corners:** pills (`999px`) for buttons, chips and inputs; 22 to 36 px for cards; 16 to 24 px for small panels.
- **Depth:** one soft, violet-tinted shadow (`--shadow`). No hard or grey shadows.
- **Backgrounds:** soft sky gradients of periwinkle and lilac behind pages, with plenty of space.
- **Motion:** slow and gentle, with the `--ease-out` curve. Everything works with motion turned off, and the site respects "reduce motion".

## Images

- Calm skies, the real moon, and clear charts made from real data. Avoid stock photos of astrologers, zodiac wheels, flames or fortune-telling imagery.
- Charts use the brand colours, with the sun in sun orange. Every chart needs a short written description.
- Some images may be made with help from generative AI by our designer. See [How we use AI](https://www.tithividya.org/ai-use).

## Voice and writing

- **Plain English.** Short sentences and everyday words, as if explaining to a family member. Explain any Sanskrit term the first time it appears.
- **Warm and confident, never mystical.** "Your tithi birthday falls on a different date each year. Here is why." Not "Unlock the cosmic secrets of your birth."
- **Honest about limits.** Say when results can differ, and why.
- **Name things the same way everywhere:** "moon birthday", "tithi birthday", "Find my tithi", "Tithi Vidya" (two words, both capitalised).
- **Indian English spellings and dates:** "colour", "3 November 2026", times in IST.

## Accessibility

- Text meets WCAG 2.2 AA contrast, as listed above.
- The focus ring is a 3 px indigo outline with a 3 px gap, white on dark surfaces.
- Never use colour alone to carry meaning.
- Every image has a written description, and decorative images are hidden from screen readers.

## Updating the kit

The files are generated, so they stay in step with the site:

```bash
# After changing the wordmark's font or text (needs Python)
python3 -m venv .venv && .venv/bin/pip install fonttools brotli uharfbuzz
.venv/bin/python brand/tools/make-wordmark.py

# After changing the mark, the icons or the colours (uses the site's packages)
node brand/tools/make-assets.mjs
```

| Folder | What it holds | Made from |
| --- | --- | --- |
| `logo/svg`, `logo/png` | 11 logo files, each as SVG and PNG | `site/src/app/icon.svg` and `tools/wordmark.json` |
| `icons/` | 20 interface icons | `site/src/components/Icons.tsx` |
| `tokens/` | Colours and other design values, as CSS and JSON | `site/src/app/globals.css` |
| `tools/` | The two scripts above, and the wordmark's outlines | |

Questions about the brand: [contact@tithividya.org](mailto:contact@tithividya.org).
