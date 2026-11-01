import { tithiName } from "./moon";

export type TithiNow = { tithi: string; elongation: number; ends: number };

/**
 * Today's tithi, the same everywhere on Earth. The hero only needs this one
 * fact, so it reads a tiny table of the next 20 years of tithi changes instead
 * of downloading the whole engine. Past the table's end it returns null, and
 * the hero simply leaves the line out.
 */
export async function tithiNow(now = Date.now() / 1000): Promise<TithiNow | null> {
  const { start, first, deltas } = (await import("@/generated/tithi-soon.json")).default;
  let begins = start;
  for (let i = 0; i < deltas.length; i++) {
    const ends = begins + deltas[i];
    if (now >= begins && now < ends) {
      const index = (first + i) % 30;
      return { tithi: tithiName(index), elongation: (index + (now - begins) / deltas[i]) * 12, ends };
    }
    begins = ends;
  }
  return null;
}
