import { describe, expect, it } from "vitest";
import { clamp, wrap } from "./utils.js";

describe("clamp", () => {
  it("keeps a value inside the interval and pins the ends", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });
});

describe("wrap", () => {
  it("folds longitude into [-180, 180)", () => {
    expect(wrap(190, -180, 180)).toBe(-170);
    expect(wrap(-190, -180, 180)).toBe(170);
    expect(wrap(180, -180, 180)).toBe(-180);
  });
});
