# tithi-vidya

Find the tithi (lunar day) for a birth moment, and the dates that tithi falls on at a place, from 1900 to 2149.

There are four parts:

- **`generator/`** (Python) uses JPL's DE440 ephemeris to compute every tithi boundary from 1900 to 2150 and writes `cli/data/tithi-table.bin`. You run it once, offline.
- **`cli/`** (Rust) is the `tithi` library and command line tool. The table is built in, so at runtime it only computes sunrise for your place.
- **`wasm/`** (Rust) compiles that same library to WebAssembly for the website.
- **`site/`** (Next.js) is the website. It is fully static, and the engine runs in the visitor's browser, so birth details never leave their device.

This split works because a tithi starts and ends at the same instant everywhere on Earth. Only the date it lands on depends on the place, through local sunrise.

## The website

```bash
cd site && npm install && npm run dev
```

Then open http://localhost:3010.

There are three pages: the animated home page, `/find` (the tool) and `/how-it-works` (the method, the real code and every accuracy test). The whole home page works without animation for visitors who ask for reduced motion.

### Deploying to Vercel

Import the repository into Vercel. No settings are needed: `vercel.json` at the repo root tells Vercel how to build `site/` and where the output is. Vercel does not need Rust, because the compiled engine is committed.

Canonical links and the sitemap use Vercel's production address automatically. With a custom domain, set `NEXT_PUBLIC_SITE_URL` (for example `https://example.com`) in the Vercel project.

### Changing the engine or the site's data

After changing `cli/` or `wasm/`, rebuild the engine and refresh the generated files, then commit them:

```bash
rustup target add wasm32-unknown-unknown   # once
./wasm/build.sh
npm --prefix site run sync
```

`sync` copies the real source code shown on the How It Works page, so that page can't drift from the code. A test fails if you forget.

To change how the moon looks, edit the shader in `site/scripts/bake-moon.mjs` and run `npm --prefix site run bake-moon` (needs Chrome).

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
