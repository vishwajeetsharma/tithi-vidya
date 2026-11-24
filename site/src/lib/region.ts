/**
 * Where tracking cookies need a yes before they load. Everywhere else they
 * start straight away, with a notice and a way to turn them off.
 *
 * - The European Economic Area (the EU, Iceland, Liechtenstein and Norway),
 *   the UK and Switzerland: the GDPR and laws like it.
 * - Parts of those countries with their own country codes: Åland, the French
 *   overseas regions and Saint Martin.
 * - Gibraltar, Jersey, Guernsey and the Isle of Man, which have laws like the GDPR.
 * - Quebec, under its Law 25, as the Canadian province "CA-QC".
 *
 * ISO 3166 codes, as Vercel and Google name places.
 */
export const STRICT_REGIONS = [
  // The EU
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
  // The rest of the EEA, the UK and Switzerland
  "IS", "LI", "NO", "GB", "CH",
  "AX", "GF", "GP", "MQ", "RE", "YT", "MF",
  "GI", "JE", "GG", "IM",
  "CA-QC",
];

const STRICT = new Set(STRICT_REGIONS);

/**
 * Whether a visitor's place needs a yes first, from Vercel's country (like "DE")
 * and region ("QC"). With no country, the answer is yes, to be safe.
 */
export function needsConsent(country: string | null | undefined, region?: string | null): boolean {
  if (!country) return true;
  const code = country.toUpperCase();
  return STRICT.has(code) || (region ? STRICT.has(`${code}-${region.toUpperCase()}`) : false);
}
