import { describe, expect, it } from "vitest";

import { litPath, tithiName } from "@/lib/moon";

describe("litPath", () => {
  it("draws a waxing moon with the bright limb on the right", () => {
    expect(litPath(90)).toMatch(/^M0 -50A50 50 0 0 1 0 50/);
  });

  it("draws a waning moon with the bright limb on the left", () => {
    expect(litPath(270)).toMatch(/^M0 -50A50 50 0 0 0 0 50/);
  });

  it("is empty at new moon and a full circle at full moon", () => {
    const terminator = (e: number) => litPath(e).split("A")[2];
    expect(terminator(0)).toBe("50.000 50 0 0 0 0 -50Z"); // cuts back along the same edge
    expect(terminator(180)).toBe("50.000 50 0 0 1 0 -50Z"); // the other way round
  });

  it("wraps angles", () => {
    expect(litPath(400)).toBe(litPath(40));
    expect(litPath(-20)).toBe(litPath(340));
  });
});

describe("tithiName", () => {
  it("names the tithis in order", () => {
    expect(tithiName(0)).toBe("Shukla Pratipada");
    expect(tithiName(14)).toBe("Purnima");
    expect(tithiName(15)).toBe("Krishna Pratipada");
    expect(tithiName(29)).toBe("Amavasya");
  });
});
