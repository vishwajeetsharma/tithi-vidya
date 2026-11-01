/**
 * Real worked examples, printed by the tithi command line tool:
 *
 *   tithi dates --tithi "Shukla Dashami" --month Jyeshtha --place delhi --from 2026 --to 2037
 *   tithi at --date 2026-11-18 --place kolkata
 *   tithi at --date 2026-11-18 --place mumbai
 */

/** One tithi's date, year by year, at New Delhi. */
export const DRIFT = [
  "2026-06-24", "2027-06-13", "2028-06-02", "2029-06-21", "2030-06-11", "2031-05-31",
  "2032-06-18", "2033-06-07", "2034-05-27", "2035-06-15", "2036-06-03", "2037-06-22",
];

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** 18 November 2026: the tithi changes between Kolkata's sunrise and Mumbai's. */
export const SUNRISE = {
  date: "18 November 2026",
  change: "06:05",
  changeMinutes: toMinutes("06:05") + 40 / 60,
  before: "Shukla Ashtami",
  after: "Shukla Navami",
  startMinutes: toMinutes("05:30"),
  endMinutes: toMinutes("07:05"),
  cities: [
    { name: "Kolkata", sunrise: "05:51", minutes: toMinutes("05:51"), tithi: "Shukla Ashtami" },
    { name: "Mumbai", sunrise: "06:47", minutes: toMinutes("06:47"), tithi: "Shukla Navami" },
  ],
};
