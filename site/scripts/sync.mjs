// Writes src/generated/: the place list (from the WebAssembly engine) and the
// real source code shown on the How It Works page, so that page can't drift.
//   npm run sync          rewrite the files
//   npm run sync -- --check   fail if they are out of date
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const site = join(dirname(fileURLToPath(import.meta.url)), "..");
const repo = join(site, "..");
const SOON_FROM = 2026;

/** The text from the line containing `from` through the line containing `to`. */
function slice(file, from, to) {
  const lines = readFileSync(join(repo, file), "utf8").split("\n");
  const start = lines.findIndex((l) => l.includes(from));
  const end = lines.findIndex((l, i) => i >= start && l.includes(to));
  if (start < 0 || end < 0) throw new Error(`${file}: cannot find ${from} .. ${to}`);
  const block = lines.slice(start, end + 1);
  const indent = Math.min(...block.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
  return block.map((l) => l.slice(indent)).join("\n");
}

const snippets = {
  tithiIndex: { lang: "python", file: "generator/ephem.py", code: slice("generator/ephem.py", "def longitudes(self, t):", "return (((moon - sun) % 360.0) // 12.0)") },
  findBoundaries: { lang: "python", file: "generator/generate_table.py", code: slice("generator/generate_table.py", "def index(t):", "values.append(v)") },
  tithiAt: { lang: "rust", file: "cli/src/table.rs", code: slice("cli/src/table.rs", "/// The tithi in effect at `unix`.", "(i > 0 && i < self.times.len())") + "\n}" },
  sunrise: { lang: "rust", file: "cli/src/sun.rs", code: slice("cli/src/sun.rs", "pub fn sunrise_near", "Some(t)") + "\n}" },
  assignDate: { lang: "rust", file: "cli/src/panchang.rs", code: slice("cli/src/panchang.rs", "/// The civil date an occurrence", "Ok(Occurrence { span, date, kind })") + "\n}" },
  masaAt: { lang: "rust", file: "cli/src/table.rs", code: slice("cli/src/table.rs", "/// The amanta month containing", "Some(Masa { index:") + "\n}" },
};

const wasm = await WebAssembly.instantiate(readFileSync(join(site, "src/engine/tithi.wasm")));
const ex = wasm.instance.exports;
const out = ex.tithi_places();
const length = new DataView(ex.memory.buffer).getUint32(out, true);
const places = JSON.parse(new TextDecoder().decode(new Uint8Array(ex.memory.buffer, out + 4, length)));

/** The next 20 years of tithi changes, for the hero's "right now" line. */
function tithiSoon() {
  const bytes = readFileSync(join(repo, "cli/data/tithi-table.bin"));
  const count = bytes.readUInt32LE(16);
  const firstIndex = bytes[20];
  let time = Number(bytes.readBigInt64LE(8));
  const from = Date.UTC(SOON_FROM, 0, 1) / 1000;
  const to = Date.UTC(SOON_FROM + 20, 0, 1) / 1000;
  const soon = { start: 0, first: 0, deltas: [] };
  for (let i = 0; i < count - 1; i++) {
    const delta = bytes.readUInt32LE(28 + 4 * i);
    if (time >= from && time < to) {
      if (soon.deltas.length === 0) Object.assign(soon, { start: time, first: (firstIndex + i) % 30 });
      soon.deltas.push(delta);
    }
    time += delta;
  }
  return soon;
}

const outputs = {
  "src/generated/snippets.json": JSON.stringify(snippets, null, 2) + "\n",
  "src/generated/places.json": JSON.stringify(places, null, 2) + "\n",
  "src/generated/tithi-soon.json": JSON.stringify(tithiSoon()) + "\n",
};

const check = process.argv.includes("--check");
for (const [name, text] of Object.entries(outputs)) {
  const path = join(site, name);
  if (!check) writeFileSync(path, text);
  else if (readFileSync(path, "utf8") !== text) {
    console.error(`${name} is out of date; run npm run sync`);
    process.exit(1);
  }
}
console.log(check ? "generated files are up to date" : `wrote ${Object.keys(outputs).join(", ")}`);
