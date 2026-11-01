import type { BirthQuery } from "./engine";

const STORE_KEY = "tithi-birth";
let held = "";

/**
 * Birth details never stay in the address bar, because analytics tags read the
 * full address. Shared links carry them after the "#", which browsers do not
 * send to servers, and a script in the page head moves them here before any
 * tag loads (see STRIP_DETAILS in app/layout.tsx).
 */
export function holdQuery(query: BirthQuery) {
  held = toHash(query);
  try {
    sessionStorage.setItem(STORE_KEY, held);
  } catch {
    // Blocked storage: the copy in memory still carries it to the finder page.
  }
}

export function heldQuery(): BirthQuery | null {
  try {
    held = sessionStorage.getItem(STORE_KEY) ?? held;
  } catch {
    // As above.
  }
  return fromHash(held);
}

export function toHash(query: BirthQuery): string {
  const params = new URLSearchParams({ date: query.date, time: query.time });
  if (query.place) params.set("place", query.place);
  else {
    params.set("lat", String(query.lat));
    params.set("lon", String(query.lon));
    params.set("tz", query.tz ?? "");
  }
  if (!query.yearly) params.set("every", "1");
  return params.toString();
}

export function fromHash(hash: string): BirthQuery | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const date = params.get("date");
  const time = params.get("time");
  if (!date || !time) return null;
  const yearly = params.get("every") !== "1";
  const place = params.get("place");
  if (place) return { date, time, place, yearly };
  const lat = Number(params.get("lat"));
  const lon = Number(params.get("lon"));
  const tz = params.get("tz");
  if (!tz || Number.isNaN(lat) || Number.isNaN(lon)) return null;
  return { date, time, lat, lon, tz, yearly };
}
