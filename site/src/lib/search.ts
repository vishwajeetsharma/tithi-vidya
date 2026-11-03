// Searching the blog, in the browser. Looks at each post's title, topics,
// section headings and description, forgives accents, spelling variants and
// small typing slips, and puts the best matches first.

/** Text ready to compare, and where each of its characters came from in the original, for highlighting. */
type Folded = { text: string; from: number[]; to: number[] };

type Word = { start: number; end: number; text: string };
type Field = { folded: Folded; words: Word[]; weight: number };

export type Searchable = { title: string; description: string; tags: string[]; headings: string[]; date: string };

const MARK = /\p{M}/gu;
const LETTER = /[\p{L}\p{N}]/u;

/** Ways one Indian word is written in English: Ekadashi and Ekādaśī, Poornima and Pūrṇimā, Dwadashi and Dvadasi. */
const SAME: Record<string, string> = { sh: "s", aa: "a", ee: "i", oo: "u" };

/** Words that don't tell posts apart, so "why does my birthday move" searches for "birthday move". */
const COMMON = new Set(
  "a an the is are was were be of to in on at by for from with about and or but my your our you i me we it its this that what why how when where who which does do did can should".split(" "),
);

/** Where a term is worth most: the title, then topics, section headings and the description. */
const WEIGHTS = { title: 10, tags: 7, headings: 4, description: 3 };

/**
 * Lower case, accents dropped (ā is a, ś is s), punctuation turned to spaces,
 * and the spellings above made one, so "ekadashi" finds "Ekādaśī".
 */
function fold(original: string): Folded {
  let text = "";
  const from: number[] = [];
  const to: number[] = [];
  for (let i = 0; i < original.length; ) {
    const char = String.fromCodePoint(original.codePointAt(i)!);
    const end = i + char.length;
    let plain = char.normalize("NFKD").replace(MARK, "").toLowerCase();
    if (!plain) {
      // An accent written on its own belongs to the letter before it.
      if (to.length) to[to.length - 1] = end;
      i = end;
      continue;
    }
    if (!LETTER.test(plain)) plain = " ";
    for (const letter of plain) {
      const c = letter === "w" ? "v" : letter;
      const pair = text ? SAME[text.slice(-1) + c] : undefined;
      if (pair) {
        text = text.slice(0, -1) + pair;
        to[to.length - 1] = end;
      } else {
        text += c;
        from.push(i);
        to.push(end);
      }
    }
    i = end;
  }
  return { text, from, to };
}

function words(text: string): Word[] {
  return [...text.matchAll(/\S+/g)].map((match) => ({ start: match.index, end: match.index + match[0].length, text: match[0] }));
}

function field(text: string, weight: number): Field {
  const folded = fold(text);
  return { folded, words: words(folded.text), weight };
}

/** The search terms in a query, folded. Common words go, unless that leaves none. */
export function searchTerms(query: string): string[] {
  const all = fold(query).text.split(" ").filter(Boolean);
  const telling = all.filter((term) => !COMMON.has(term));
  return [...new Set(telling.length ? telling : all)];
}

/** How many typing slips a term may have: none for short words, which would match too much. */
const slips = (term: string) => (term.length >= 8 ? 2 : term.length >= 4 ? 1 : 0);

/** Letters changed, added, dropped or swapped to turn `a` into `b`, stopping once it passes `most`. */
function distance(a: string, b: string, most: number): number {
  if (Math.abs(a.length - b.length) > most) return most + 1;
  let before = Array.from({ length: b.length + 1 }, (_, j) => j);
  let previous = before;
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let value = Math.min(previous[j] + 1, row[j - 1] + 1, previous[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) value = Math.min(value, before[j - 2] + 1);
      row.push(value);
      best = Math.min(best, value);
    }
    if (best > most) return most + 1;
    before = previous;
    previous = row;
  }
  return previous[b.length];
}

/** A word close enough to the term: the whole word, or its start while someone is still typing. Same first letter, since slips there are rare. */
function near(word: string, term: string): boolean {
  const most = slips(term);
  if (!most || word[0] !== term[0]) return false;
  return distance(term, word, most) <= most || (word.length > term.length && distance(term, word.slice(0, term.length), most) <= most);
}

type Match = { ranges: [number, number][]; score: number };

/** Where a term is in a field, and how good the match is: a whole word beats the start of a word, which beats the middle of one. */
function match({ folded, words, weight }: Field, term: string): Match | null {
  const ranges: [number, number][] = [];
  let quality = 0;
  for (let at = folded.text.indexOf(term); at !== -1; at = folded.text.indexOf(term, at + 1)) {
    ranges.push([at, at + term.length]);
    const starts = at === 0 || folded.text[at - 1] === " ";
    const whole = starts && (at + term.length === folded.text.length || folded.text[at + term.length] === " ");
    quality = Math.max(quality, whole ? 3 : starts ? 2 : 1);
  }
  if (!ranges.length) {
    for (const word of words) if (near(word.text, term)) ranges.push([word.start, word.end]);
    if (ranges.length) quality = 0.75;
  }
  return ranges.length ? { ranges, score: weight * quality } : null;
}

type Prepared = Field[];
const prepared = new WeakMap<object, Prepared>();

function prepare(post: Searchable): Prepared {
  let fields = prepared.get(post);
  if (!fields) {
    fields = [
      field(post.title, WEIGHTS.title),
      field(post.tags.join(" · "), WEIGHTS.tags),
      field(post.headings.join(" · "), WEIGHTS.headings),
      field(post.description, WEIGHTS.description),
    ];
    prepared.set(post, fields);
  }
  return fields;
}

export type Found<T> = {
  posts: T[];
  /** The folded terms searched for, to highlight in the results. */
  terms: string[];
  /** True when no post had every term, so these are posts with some of them. */
  partial: boolean;
};

const newestFirst = (a: Searchable, b: Searchable) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title);

/**
 * Posts with every term, best first. When none has them all, posts with the
 * most of them instead, so a long question still finds something.
 */
export function searchPosts<T extends Searchable>(posts: T[], query: string): Found<T> {
  const terms = searchTerms(query);
  if (!terms.length) return { posts, terms, partial: false };

  const scored = posts.map((post) => {
    const fields = prepare(post);
    let score = 0;
    let found = 0;
    for (const term of terms) {
      let points = 0;
      for (const f of fields) points += match(f, term)?.score ?? 0;
      if (points) found++;
      score += points;
    }
    return { post, score, found };
  });
  const byScore = (a: (typeof scored)[number], b: (typeof scored)[number]) => b.found - a.found || b.score - a.score || newestFirst(a.post, b.post);

  const complete = scored.filter((hit) => hit.found === terms.length).sort(byScore);
  if (complete.length || terms.length === 1) return { posts: complete.map((hit) => hit.post), terms, partial: false };
  const some = scored.filter((hit) => hit.found > 0).sort(byScore);
  return { posts: some.map((hit) => hit.post), terms, partial: some.length > 0 };
}

/** The parts of `text` to highlight for these terms, as [start, end) in the original text, in order. */
export function highlights(text: string, terms: string[]): [number, number][] {
  if (!terms.length) return [];
  const f = field(text, 1);
  const ranges = terms
    .flatMap((term) => match(f, term)?.ranges ?? [])
    .map(([start, end]): [number, number] => [f.folded.from[start], f.folded.to[end - 1]])
    .sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const range of ranges) {
    const last = merged.at(-1);
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
    else merged.push([...range]);
  }
  return merged;
}

/** The one of `texts` (section headings, or topics) that matches the most terms, to show why a post was found. */
export function bestMatch(texts: string[], terms: string[]): string | undefined {
  let best: string | undefined;
  let most = 0;
  for (const text of texts) {
    const f = field(text, 1);
    const count = terms.filter((term) => match(f, term)).length;
    if (count > most) [best, most] = [text, count];
  }
  return best;
}
