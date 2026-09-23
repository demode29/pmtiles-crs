import { describe, expect, it } from "vitest";
import {
  boundsIntersection,
  boundsOverlap,
  includePosition,
  unionBounds,
} from "./bounds.js";

describe("boundsIntersection", () => {
  it("returns the overlapping rectangle", () => {
    expect(boundsIntersection([-10, -10, 10, 10], [0, 0, 20, 5])).toEqual([
      0, 0, 10, 5,
    ]);
  });

  it("keeps a point that sits on a shared edge", () => {
    expect(boundsIntersection([0, 0, 0, 0], [-180, -90, 0, 90])).toEqual([
      0, 0, 0, 0,
    ]);
  });

  it("returns null when the boxes miss", () => {
    expect(boundsIntersection([0, 0, 1, 1], [2, 2, 3, 3])).toBeNull();
  });
});

describe("boundsOverlap", () => {
  it("is true exactly when an intersection exists", () => {
    expect(boundsOverlap([0, 0, 1, 1], [1, 1, 2, 2])).toBe(true);
    expect(boundsOverlap([0, 0, 1, 1], [2, 2, 3, 3])).toBe(false);
  });
});

describe("unionBounds", () => {
  it("returns the rectangle that contains both", () => {
    expect(unionBounds([0, 0, 1, 1], [2, 3, 4, 5])).toEqual([0, 0, 4, 5]);
  });
});

describe("includePosition", () => {
  it("starts a point box and then grows it", () => {
    const point = includePosition(null, 10, 20);
    expect(point).toEqual([10, 20, 10, 20]);
    expect(includePosition(point, 0, 30)).toEqual([0, 20, 10, 30]);
  });
});
