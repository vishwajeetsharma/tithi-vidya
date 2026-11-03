import { describe, expect, it } from "vitest";

import { readSignup } from "@/lib/newsletter";

describe("newsletter signups", () => {
  it("tidies the email and name", () => {
    expect(readSignup({ email: "  Asha@Example.COM ", name: "  Asha   Rao " })).toEqual({ email: "asha@example.com", name: "Asha Rao" });
    expect(readSignup({ email: "a@b.in" })).toEqual({ email: "a@b.in", name: "" });
  });

  it("explains a missing or wrong address in plain words", () => {
    expect(readSignup({})).toEqual({ problem: "Please enter your email address." });
    expect(readSignup(null)).toEqual({ problem: "Please enter your email address." });
    for (const email of ["asha", "asha@", "asha@example", "a b@example.com", 42]) {
      expect(readSignup({ email })).toHaveProperty("problem");
    }
  });
});
