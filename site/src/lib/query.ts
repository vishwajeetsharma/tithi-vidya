import type { BirthQuery } from "./engine";

/**
 * Birth details travel in the part of the address after "#". Browsers never
 * send that part to any server, so shared links stay private too.
 */
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
