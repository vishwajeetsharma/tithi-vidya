import { describe, expect, it } from "vitest";

import { fromHash, toHash } from "@/lib/query";

describe("shareable links", () => {
  it("round trips a named place", () => {
    const query = { date: "2000-01-01", time: "06:30", place: "New Delhi", yearly: true };
    expect(fromHash(`#${toHash(query)}`)).toEqual(query);
  });

  it("round trips coordinates and every-return mode", () => {
    const query = { date: "1985-07-04", time: "21:15", lat: -33.8688, lon: 151.2093, tz: "Australia/Sydney", yearly: false };
    expect(fromHash(`#${toHash(query)}`)).toEqual(query);
  });

  it("ignores links without birth details", () => {
    expect(fromHash("")).toBeNull();
    expect(fromHash("#date=2000-01-01")).toBeNull();
    expect(fromHash("#date=2000-01-01&time=06:30")).toBeNull();
  });
});
