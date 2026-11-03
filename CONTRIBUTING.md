# Contributing to Tithi Vidya

Thank you for wanting to help. Tithi Vidya is free and open source, and every kind of help is welcome: a bug report, a fix, a better algorithm, or an article for the blog.

This guide is also on the website at [tithividya.org/contribute](https://www.tithividya.org/contribute).

## Ways to help

- **Share the site** with family and friends. It is the easiest help, and it matters most.
- **Report a result that looks wrong.** [Open an issue](https://github.com/vishwajeetsharma/tithi-vidya/issues/new) with the details listed under [Reporting a wrong result](#reporting-a-wrong-result).
- **Fix a bug or improve the website.** See [Contributing code](#contributing-code).
- **Improve the tithi engine.** See [Improving the algorithm](#improving-the-algorithm).
- **Write an article for the blog.** See [Writing an article](#writing-an-article). You don't need to know how to code.

## Ground rules

- **Birth details never leave the visitor's device.** This is the site's main promise. No change may send them to a server, put them in the page address, or show them to analytics.
- **Plain English.** Short sentences and everyday words, on the site and in articles.
- **Accuracy needs evidence.** A change to results must show where the right answer comes from.
- **Be kind.** Everyone here is helping for free.

For a large change, please [open an issue](https://github.com/vishwajeetsharma/tithi-vidya/issues/new) first, so we can agree on the idea before you spend time on it.

## Raising a pull request

A pull request (PR) is how you suggest a change. You make the change in your own copy of the project, and ask for it to be added.

### On the GitHub website (no install needed)

This works well for articles and small text fixes.

1. Open the file or folder you want to change on GitHub.
2. Click the pencil icon to edit a file, or **Add file** to add one. GitHub makes your own copy (a "fork") for you.
3. Make your change, then click **Commit changes** and **Propose changes**.
4. On the next page, click **Create pull request**. Write what you changed and why.

### On your computer

1. Fork the project on GitHub, then clone your fork:

   ```bash
   git clone https://github.com/YOUR-NAME/tithi-vidya.git
   cd tithi-vidya
   ```

2. Make a branch with a short name:

   ```bash
   git checkout -b fix-sunrise-label
   ```

3. Make your change, and run the checks in [Before you open a PR](#before-you-open-a-pr).
4. Commit, push, and open a pull request from your branch:

   ```bash
   git add -A
   git commit -m "Fix the sunrise label on phones"
   git push -u origin fix-sunrise-label
   ```

### What to write in a PR

- What you changed, and why.
- How you checked it: tests you ran, and screenshots for anything you can see.
- For a change to results, the evidence: see [Improving the algorithm](#improving-the-algorithm).

## Contributing code

### Set up

You need [Node.js 24](https://nodejs.org/). Then:

```bash
cd site
npm ci
npm run dev
```

Open http://localhost:3010. Pages update as you save.

### Where things are

| Folder | What it is |
| --- | --- |
| `site/` | The website (Next.js). Pages are in `site/src/app`, parts of pages in `site/src/components`. |
| `site/content/blog/` | Blog posts, one Markdown file or folder each. |
| `cli/` | The tithi engine and command line tool, in Rust. |
| `wasm/` | The same engine, compiled to WebAssembly for the website. |
| `generator/` | Python scripts that build the tithi table from NASA JPL's DE440 data. You rarely need these. |

The [README](README.md) explains how the parts fit together.

### Before you open a PR

Run these in `site/`. All of them must pass:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Also check your change on a phone-sized screen. The site has a light theme only, in blue and purple.

### Changing the engine

You need [Rust](https://rustup.rs/) 1.85 or newer. After changing `cli/` or `wasm/`:

```bash
cd cli && cargo test && cd ..
cd wasm && cargo test && cd ..
rustup target add wasm32-unknown-unknown   # once
./wasm/build.sh
npm --prefix site run sync
```

Commit the rebuilt `site/src/engine/tithi.wasm` too. Vercel can't build Rust, so the website uses the committed file.

## Improving the algorithm

The engine follows the conventions of most modern panchangs, listed in the [README](README.md#conventions). The [How it works](https://www.tithividya.org/how-it-works) page shows the method, the real code and every accuracy test.

A change to results is welcome when it is backed by evidence. Please:

1. **Show the problem.** Give a date, time and place where the result is wrong, and what the right answer is.
2. **Show where the right answer comes from.** For example:
   - a printed or published panchang (name it, with the date and place);
   - an astronomy source, such as JPL's DE440 data or the Swiss Ephemeris;
   - a written rule from a recognised tradition.

   Please check panchang websites by hand. Don't write scripts that scrape them.
3. **Add a test** that fails before your change and passes after it. Tests live in `cli/tests/`, and the data in `cli/tests/fixtures/` is computed from DE440 by `generator/make_fixtures.py`.
4. **Keep the other tests passing.** If a change moves existing results, explain why in the PR.
5. **Say if it changes a convention**, such as how a skipped (kshaya) tithi is dated. These choices affect everyone, so they need discussion in an issue first.

### Rebuilding the tithi table

Only needed if you change the generator. You need Python 3:

```bash
cd generator
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python generate_table.py --ephemeris de440s.bsp --out ../cli/data/tithi-table.bin
.venv/bin/python make_fixtures.py --ephemeris de440s.bsp --out ../cli/tests/fixtures
```

The first run downloads `de440s.bsp` (33 MB) from JPL.

## Writing an article

Anyone can write for the blog. Good topics are tithis, the panchang, moon birthdays, festivals and their dates, and how the Hindu calendar works.

### What makes a good article

- **Original.** Written by you, not copied.
- **Plain English.** Short sentences and everyday words. Explain any Sanskrit term the first time you use it.
- **Accurate.** Check facts, and link to your sources. You can check dates with [Find my tithi](https://www.tithividya.org/find).
- **Your own images**, or images you are allowed to use. Say where an image comes from in its caption.
- **No adverts** or links that are there only to promote something.

### Add your article (no install needed)

1. Open [`site/content/blog`](site/content/blog) on GitHub.
2. Click **Add file**, then **Create new file**. GitHub makes your own copy (a fork) for you.
3. Name the file `your-article-name/index.md`. Use lowercase letters, numbers and hyphens. Typing the `/` makes the folder.
4. Paste this template and write your article:

   ```markdown
   ---
   title: Your article title
   description: One or two sentences about the article, under 160 characters.
   date: 2026-11-03
   author: Your Name
   tags: [tithi, festivals]
   cover: cover.jpg
   coverAlt: A few words describing the cover image
   ---

   Your first paragraph.

   ## A section heading

   More text. Add an image like this:

   ![A few words describing the image](photo.jpg "An optional caption")
   ```

5. Click **Commit changes**, then **Propose changes**, then **Create pull request**.
6. To add images, open your fork on GitHub, switch to the branch GitHub made (it is named in your pull request), open your article's folder, and click **Add file**, then **Upload files**. Commit to the same branch, and the pull request updates by itself.

All the fields and image rules are in the [blog guide](site/content/blog/README.md).

### Preview it on your computer (optional)

Follow [Set up](#set-up), then open http://localhost:3010/blog/your-article-name. The build tells you in plain words if a field or an image is missing.

### What happens next

- We read every article, and may suggest changes or edit it for plain English.
- We pick the publish date. A post with a future date goes live at 6:00 AM India time on that day.
- Your name appears on the article as its author.
- Articles are published under the same [MIT License](LICENSE) as the rest of this project.

## Reporting a wrong result

[Open an issue](https://github.com/vishwajeetsharma/tithi-vidya/issues/new) and include:

- the date, time and place you entered;
- what Tithi Vidya showed;
- what your panchang says, and which panchang it is.

Only share birth details you are happy to make public, since issues are public. A made-up example that shows the same problem works just as well. The [Disclaimer](https://www.tithividya.org/disclaimer) lists common reasons results differ.

## After you open a pull request

We will review it as soon as we can. We may ask questions or suggest changes. Once it is ready, we merge it, and the website updates by itself a few minutes later.

## Questions

Ask in an issue, or email [contact@tithividya.org](mailto:contact@tithividya.org).
