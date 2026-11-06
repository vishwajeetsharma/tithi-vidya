# tithi-vidya

Find the tithi (lunar day) for a birth moment, and the dates that tithi falls on at a place, from 1900 to 2149.

There are four parts, plus the blog:

- **`generator/`** (Python) uses JPL's DE440 ephemeris to compute every tithi boundary from 1900 to 2150 and writes `cli/data/tithi-table.bin`. You run it once, offline.
- **`cli/`** (Rust) is the `tithi` library and command line tool. The table is built in, so at runtime it only computes sunrise for your place.
- **`wasm/`** (Rust) compiles that same library to WebAssembly for the website.
- **`site/`** (Next.js) is the website. Pages are built ahead of time, and the engine runs in the visitor's browser, so birth details never leave their device. The only server code is the newsletter signup and the first visit to an older blog post (see [How posts are built](#how-posts-are-built)).

This split works because a tithi starts and ends at the same instant everywhere on Earth. Only the date it lands on depends on the place, through local sunrise.

## The website

```bash
cd site && npm install && npm run dev
```

Then open http://localhost:3010.

The pages are the animated home page, `/find` (the tool), `/how-it-works` (the method, the real code and every accuracy test), `/privacy` and `/terms`. The whole home page works without animation for visitors who ask for reduced motion.

### The blog

Posts are Markdown files in `site/content/blog/`, one folder per post. Add one on GitHub and the next deploy publishes it. All the fields, scheduling and the image rules are in [`site/content/blog/README.md`](site/content/blog/README.md).

#### Adding an article

1. On GitHub, open `site/content/blog`, click **Add file**, then **Create new file**.
2. Name it `your-article-name/index.md`. Typing the `/` makes the folder. The name becomes the address, `/blog/your-article-name`, so use lowercase letters, numbers and hyphens only.
3. Paste this, write the article, and click **Commit changes**:

   ```markdown
   ---
   title: Your article title
   description: One or two sentences, under 160 characters. Google and social media show this.
   date: 2026-11-03
   tags: [tithi, birthday]
   cover: cover.jpg
   coverAlt: A few words describing the cover image
   ---

   Your first paragraph.

   ## A section heading

   ![A few words describing the image](photo.jpg "An optional caption")
   ```

4. Upload the images: open the new `your-article-name` folder on GitHub, click **Add file**, then **Upload files**, drop in `cover.jpg`, `photo.jpg` and any others, and commit. The file names must match the ones in the article.

Vercel deploys a minute or two later. A future `date` schedules the post for 6:00 AM IST that day. To check an article on your computer first, run the site and open http://localhost:3010/blog/your-article-name.

The folder ends up like this:

```text
site/content/blog/your-article-name/
├── index.md
├── cover.jpg
└── photo.jpg
```

About images:

- **Any size works**, even a photo straight from a phone. Each one is resized to WebP in three widths, and the cover also becomes a 1200 x 630 share image.
- **Formats:** JPG, PNG, WebP, AVIF, GIF or SVG.
- **Every image needs a description** inside the `[ ]`, and the cover needs `coverAlt`. The build stops and says so if one is missing, or if a file name doesn't match.
- Keep each post's images in its own folder. Image addresses include the post's name and a hash of the file, so two posts can both have a `cover.jpg`.

#### How posts are built

Before every build, `site/scripts/content.mjs` turns the posts into files the pages read: `.content/blog.json` lists every post's details without its text, and `.content/posts/<name>.json` holds each post's HTML and Markdown. It also resizes the images and writes a Markdown copy of each post. Converted posts and images are kept in `.next/cache`, which Vercel keeps between builds, so a deploy only converts posts and images that are new or changed.

The 20 newest posts are built into HTML at deploy. An older post is built the first time someone opens it, which takes about a second, and that HTML is then kept and served to everyone (`site/src/app/blog/[slug]/page.tsx`). Posts don't change between deploys, so the kept HTML is never rebuilt. A new deploy starts afresh, so each older post is built again on its first visit after it. This keeps deploys quick as the blog grows to hundreds of posts.

Each post is automatically included in:
- `/sitemap.xml` and `/robots.txt`
- the RSS feed at `/blog/feed.xml`, which carries the 20 newest posts in full
- `/llms.txt` and `/llms-full.txt` for AI tools

A plain Markdown copy of each post is at `/blog/<name>.md`. `robots.txt` welcomes all crawlers, and names the main AI crawlers to make that explicit.

The blog page shows 12 articles a page, with search, topics and sorting, all in the browser. Its HTML holds only the first page; the rest of the list loads from `/blog/posts.json`, so the page stays small as the blog grows. Every choice is kept in the address (`/blog?q=moon&tag=tithi&page=2`), so topic links from articles, shared links and the back button all work. Its "Follow with RSS" button offers the feed address and one-click Feedly and Inoreader links.

Search (`site/src/lib/search.ts`) looks at each article's title, topics, section headings and description, and:
- forgives accents and the usual English spellings of Indian words: "ekadashi", "ekadasi" and "Ekādaśī" all match, as do "poornima" and "Pūrṇimā"
- forgives a typing slip in longer words, and finds words still being typed
- ignores common words, so "why does my birthday move" works, and shows articles with some of the words when none has them all
- puts title matches first, highlights the words found, and names the section or topic that matched

Press `/` to jump to the search box. Each article also has a search box under its recent posts. Google Analytics records searches as `view_search_results`, so you can see what readers look for.

The eight most used topics show as buttons (four on phones), and the rest are under "All topics", A to Z, with a box to find one.

**Scheduled posts:** a post with a future `date` is built now and goes live at 6:00 AM IST that day. The pages decide by the visitor's clock (`site/src/components/blog/useLivePosts.ts`), so no build is needed at that moment. The sitemap, feed and llms.txt can't check the clock, so they add the post at the next deploy after that.

### Analytics and privacy

Google Analytics and the Meta Pixel load by default so ad landings are measured, and stop if a visitor declines. The cookie box appears on `/find` (`site/src/components/CookieConsent.tsx`). Their IDs are in `site/src/lib/site.ts`.

The site promises that birth details never leave the device, and analytics tags read the full page address. So birth details must never stay in the address: a script in `site/src/app/layout.tsx` moves them out of shared links before any tag loads, and the pixel's automatic form scanning is off. Keep Automatic Advanced Matching off in Meta Events Manager too.

### Deploying to Vercel

Import the repository into Vercel and set **Root Directory** to `site`. Vercel reads `site/vercel.json` for the rest. Vercel does not need Rust, because the compiled engine is committed.

Pages are built ahead of time. Two things run on Vercel: the first visit to an older blog post, which builds its HTML once (see [How posts are built](#how-posts-are-built)), and `site/src/app/api/subscribe/route.ts`, the newsletter signup, which keeps the Brevo key off the browser. The signup needs these environment variables, described in `site/.env.example`:

- `BREVO_API_KEY` and `BREVO_LIST_ID`: required for signups. Without them the form says signups are not open yet.
- `BREVO_DOI_TEMPLATE_ID`: optional. When set, people confirm by email first and land on `/subscribed`.

**Article notifications** (`site/src/app/api/push`, `site/public/sw.js`): the blog's "Get notified" button saves a browser's subscription in a free Upstash Redis database. A daily Vercel cron at 6:00 AM IST (`crons` in `site/vercel.json`) announces each post once, in the two days after it goes live. A post published directly goes out the next morning, or straight away with `curl -H "Authorization: Bearer $CRON_SECRET" https://www.tithividya.org/api/push/send`. It needs:

- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`, made with `npx web-push generate-vapid-keys`. The button stays hidden without them.
- `CRON_SECRET`, any long random string.
- The database: add Upstash Redis from Vercel's Marketplace, which sets `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (or the `KV_REST_API_` names) itself.

For local testing, put the same names in `site/.env`, which git ignores.

The site lives at https://www.tithividya.org; Vercel's domain settings redirect tithividya.org there. Canonical links, the sitemap and the feeds use `SITE_ORIGIN` in `site/src/lib/site.ts` on every Vercel build, previews included, and localhost on your computer. `NEXT_PUBLIC_SITE_URL` overrides both. Keep `SITE_ORIGIN` the same as the main domain in Vercel, or the two redirects can loop. `site/vercel.json` also permanently redirects the old address, tithi-vidya.thevishwa.in, as long as it stays added to the Vercel project.

### Changing the engine or the site's data

After changing `cli/` or `wasm/`, rebuild the engine and refresh the generated files, then commit them:

```bash
rustup target add wasm32-unknown-unknown   # once
./wasm/build.sh
npm --prefix site run sync
```

`sync` copies the real source code shown on the How It Works page, so that page can't drift from the code. A test fails if you forget.

To change how the moon looks, edit the shader in `site/scripts/bake-moon.mjs` and run `npm --prefix site run bake-moon` (needs Chrome).

To change the site icon, edit `site/src/app/icon.svg` and run `npm --prefix site run icons`. It makes `favicon.ico`, the PNG sizes Google and phones need, and the app manifest icons, all from that one file.

## Contributing

Articles, fixes and algorithm improvements are welcome. [CONTRIBUTING.md](CONTRIBUTING.md) explains how, and the website shows the same guide at `/contribute`, built from that file.

## Using the CLI

```bash
cd cli && cargo build --release
```

The binary is `cli/target/release/tithi`.

**Tithi at a moment** (leave out `--time` to get the tithi at sunrise):

```bash
tithi at --date 2000-01-01 --time 06:30 --place delhi
```

**Every date a tithi falls on**, here every Shukla Tritiya in 2026:

```bash
tithi dates --tithi "Shukla Tritiya" --place delhi --from 2026
```

**Tithi birthday, once a year for 100 years after birth.** `--yearly` keeps only the birth lunar month. Without it you get all ~12 occurrences a year.

```bash
tithi dates --date 2000-01-01 --time 06:30 --place delhi --yearly
```

**A given tithi in a given month**, for example Ugadi (Chaitra Shukla Pratipada) as CSV:

```bash
tithi dates --tithi "Shukla Pratipada" --month Chaitra --place mumbai --from 2026 --to 2035 --csv
```

Places: run `tithi places` for the built-in list. For anywhere else, pass `--lat 12.97 --lon 77.59 --tz Asia/Kolkata` (east and north are positive; the time zone is an IANA name). Tithis can be written as `"Shukla Tritiya"`, `"krishna 8"`, `S3`, `K14`, `Purnima`, `Amavasya` or `1`–`30`.

## Conventions

These follow Drik Panchang:

- **Positions:** apparent geocentric Sun and Moon from JPL DE440.
- **Tithi:** (Moon − Sun) ÷ 12°. Tithi 1–15 is Shukla (15 = Purnima), 16–30 is Krishna (30 = Amavasya).
- **Sunrise:** the moment the Sun's upper edge clears the horizon, with standard refraction (−0.8333°).
- **Day assignment:** a date gets the tithi in effect at its sunrise (udaya tithi). So an occurrence of a tithi is listed on the date whose sunrise falls inside it.
  - **Kshaya** (no sunrise inside it): listed on the day it falls in, and marked as kshaya.
  - **Vriddhi** (two sunrises inside it): listed on the first day, with the second day also shown.
- **Month:** amanta (new moon to new moon), named after the Lahiri sidereal sign the Sun is in at the starting new moon. A month with no sankranti is adhika. `--month` and `--yearly` match the regular month, never the adhika one. The `at` command also prints the purnimanta name.

## How it is checked

Run `cargo test` in `cli/` and `wasm/`, and `npm test` in `site/`.

- **Data computed directly from DE440** (`cli/tests/fixtures/`, written by `generator/make_fixtures.py`):
  - the tithi at 3,000+ instants, half of them within 10 minutes of a boundary;
  - 5,800+ sunrises in 8 cities across 1900–2149, to within 10 s (worst measured: 2.7 s);
  - New Delhi's sunrise tithi for every day of 1950, 2026 and 2100.
- **Published panchang facts:**
  - Drik Panchang's 26 Oct 2026 sunrise and Purnima end time for New Delhi;
  - the adhika months of 2012, 2015, 2018, 2020, 2023 and 2026;
  - Ugadi dates for 2023–2026.

Two one-off comparisons back the numbers on the How It Works page. They are in `generator/checks/` with their own `requirements.txt`, and are not part of the site:

- `crosscheck_swiss.py` compares the table with Swiss Ephemeris: 92,839 boundaries (median 1.7 s apart), 3,095 lunar months (no differences) and 91,311 New Delhi sunrises (8 differ, all within 18 s of a boundary).
- `compare_models.py` measures how far simpler models are from DE440.

## Limits

- **Times are good to about a minute**, which is the precision panchangs publish. A tithi that ends within seconds of sunrise can go either way under any method.
- **Future dates have about ±1 minute of real uncertainty**, because the Earth's rotation can't be predicted exactly. The table includes a predicted drift, which reaches −27 s by 2100.
- **Before 1972, clock times are read as mean solar time (UT1).** That is what civil clocks followed then.
- **Historical local time:** the IANA time zone data covers India's offsets since 1906, including wartime +06:30. But IANA has a single zone for all of India. It does not know that Mumbai kept Bombay Time (+04:51) until 1955 or that Kolkata kept Calcutta Time (+05:53:20) until 1948. Check how an old birth certificate's time was recorded.
- **Other traditions:** Surya Siddhanta panchangs, and festivals with their own timing rules (pradosh, nishita), can differ from these dates by a day.

## Regenerating the table

You only need to do this if you change the generator.

```bash
cd generator
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python generate_table.py --ephemeris de440s.bsp --out ../cli/data/tithi-table.bin
.venv/bin/python make_fixtures.py --ephemeris de440s.bsp --out ../cli/tests/fixtures
```

On the first run, Skyfield downloads `de440s.bsp` (33 MB) from JPL. `generate_table.py` takes about 3 minutes and documents the binary format at the top of the file.
