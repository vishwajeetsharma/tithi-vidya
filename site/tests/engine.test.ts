import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { beforeAll, describe, expect, it, vi } from "vitest";

import { findBirth } from "@/lib/engine";
import { tithiNow } from "@/lib/tithi-now";

const wasm = readFileSync(fileURLToPath(new URL("../src/engine/tithi.wasm", import.meta.url)));

beforeAll(() => {
  vi.stubGlobal("fetch", async () => new Response(wasm, { headers: { "content-type": "application/wasm" } }));
});

describe("the WebAssembly engine", () => {
  it("finds a tithi birthday", async () => {
    const result = await findBirth({ date: "2000-01-01", time: "06:30", place: "New Delhi", yearly: true });
    expect(result.birth.tithi).toBe("Krishna Dashami");
    expect(result.dates).toHaveLength(100);
    expect(result.dates[0].label).toBe("Tue, 8 Jan 2002");
  });

  it("turns engine errors into exceptions with a plain message", async () => {
    await expect(findBirth({ date: "2000-01-01", time: "06:30", place: "Atlantis", yearly: true })).rejects.toThrow("Atlantis");
  });
});

describe("today's tithi", () => {
  // Noon IST on 25 October 2026 is inside the Purnima that ends at 09:41 IST on the 26th.
  const noon = Date.UTC(2026, 9, 25, 6, 30) / 1000;

  it("matches Drik Panchang", async () => {
    const now = await tithiNow(noon);
    expect(now?.tithi).toBe("Purnima");
    expect(new Date((now?.ends ?? 0) * 1000).toISOString()).toBe("2026-10-26T04:11:49.000Z");
    expect(now?.elongation).toBeGreaterThan(168);
    expect(now?.elongation).toBeLessThan(180);
  });

  it("gives no answer outside its table", async () => {
    expect(await tithiNow(0)).toBeNull();
  });
});

describe("generated files", () => {
  it("match the source code they were taken from", () => {
    const script = fileURLToPath(new URL("../scripts/sync.mjs", import.meta.url));
    expect(() => execFileSync("node", [script, "--check"], { stdio: "pipe" })).not.toThrow();
  });
});
