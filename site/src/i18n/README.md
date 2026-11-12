# Languages

How Tithi Vidya speaks more than English. Everything here is free to run: no
paid translation service, no audio hosting, nothing new to sign up for.

## Three parts

**1. Our own translations (`/hi`, `/mr`).** Real pages on our own addresses,
written and checked by people (or drafted by an AI assistant and then read by a
native speaker). Google can list these for searches made in that language,
which is where most new readers will come from: far more people search
"तुलसी विवाह कब है" than "Tulsi Vivah date".

**2. Every other language, through Google Translate.** The language menu
lists 33 more languages. Each opens the same page inside Google Translate, in
a new tab. It costs nothing and needs no upkeep. A machine translates these,
they are not our pages, and Google does not list them in search. When one of
these languages starts bringing readers, move it up to a real translation.

**3. "Listen to this article".** Every article, in every language, can be read
aloud by the reader's own phone or computer (the browser's speech synthesis).
Nothing is recorded, uploaded or paid for. The voice is the device's own, so
its quality depends on the device. Nearly all phones have English and Hindi
voices. Where a language has no voice, a close one in the same script stands in
(Hindi reads Marathi), and the reader is told.

## What is translated so far

| | English | हिन्दी | मराठी |
| --- | --- | --- | --- |
| Top bar, footer, language menu | yes | yes | yes |
| Front page | full | short version | short version |
| Blog list | yes | yes | yes |
| Articles | all | 2 | 1 |
| The tithi finder (`/find`) | yes | not yet | not yet |
| How it works, About, legal pages | yes | not yet | not yet |

The finder is the next thing to translate. Its form and results are short, but
the engine writes a few notes in English, so the engine needs to send codes
instead of sentences first (a small change in `wasm/`).

## Adding a language

1. Add it to `languages.json`, under `translated`: its code, its own name, and
   the voice to read it with (`speech`, like `ta-IN`).
2. Add its words to `dictionaries.ts`. TypeScript reports any that are missing.
3. Translate posts: put `index.<code>.md` beside a post's `index.md`. It needs
   only `title`, `description` and `coverAlt` at the top, then the text. The
   date, tags and pictures come from the English post.

That is all. The page, its address (`/<code>/blog/<slug>`), the links between
languages, the sitemap and the tags search engines read (`hreflang`) follow by
themselves. `npm run content` says how many translations it found.

Remove a language from `more` in `languages.json` once it is under `translated`.

## Translating a post well

- Translate the meaning, not the words. Use the names people really search:
  "देवउठनी एकादशी", "तुळशी विवाह".
- Make it local where that helps: the Marathi Tulsi Vivah post gives Mumbai's
  sunset, and the offerings Maharashtra uses.
- Link to other posts in the same language when they exist (`/hi/blog/...`).
  Otherwise link the English post and say so: "(अंग्रेज़ी में)".
- Have a native speaker read it before it goes live. A date site is trusted
  only as far as its language is.

## How it is built

- `config.ts`: the list of languages and small helpers (addresses, dates).
- `dictionaries.ts`: the site's own words in each language.
- `scripts/content.mjs`: builds each `index.<code>.md` into
  `.content/posts/<slug>.<code>.json`, and lists a post's languages on it.
- `src/app/[lang]/`: the translated pages. English pages stay exactly where
  they are, at addresses with no prefix.
- `components/LanguageMenu.tsx`, `components/blog/ReadIn.tsx`: the menu, and
  the "Read this in" line under an article's title.
- `components/blog/Listen.tsx`: reading aloud.

One shortcut to know about: the site has a single `<html>` element that says
`lang="en"`, so translated pages mark their content with the right language
and correct `<html>` with a script. Moving every page under `app/[lang]`, as
the Next.js guide describes, would make that exact. It is worth doing when the
finder and the other pages are translated.
