/** Drawing the moon's phase. `elongation` is the sun-moon gap in degrees (0 new, 180 full). */

/** The disc's share of the moon canvas; the rest is its glow. */
export const DISC = 0.76;

/** SVG path of the lit part of a moon of radius `r` centred on (0, 0), north up. */
export function litPath(elongation: number, r = 50): string {
  const e = ((elongation % 360) + 360) % 360;
  const waxing = e <= 180;
  const side = waxing ? 1 : 0; // the bright limb is on the right while the moon grows
  const a = (e * Math.PI) / 180;
  const rx = Math.abs(Math.cos(a)) * r;
  const gibbous = Math.cos(a) < 0;
  const terminator = gibbous === waxing ? 1 : 0;
  return `M0 ${-r}A${r} ${r} 0 0 ${side} 0 ${r}A${rx.toFixed(3)} ${r} 0 0 ${terminator} 0 ${-r}Z`;
}

/** The 30 tithi names in order, for animation readouts. */
const NAMES = [
  "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashthi", "Saptami",
  "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi",
];

export function tithiName(index: number): string {
  if (index === 14) return "Purnima";
  if (index === 29) return "Amavasya";
  return `${index < 15 ? "Shukla" : "Krishna"} ${NAMES[index % 15]}`;
}

export const TITHI_WORDS = [...NAMES, "Purnima", "Amavasya"];
