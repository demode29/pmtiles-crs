import type { Bounds } from "./types.js";

/**
 * Overlapping rectangle of two axis-aligned bounds, or null if they miss.
 * Edges count: a point bbox on a shared edge still intersects.
 */
export function boundsIntersection(a: Bounds, b: Bounds): Bounds | null {
  const west = Math.max(a[0], b[0]);
  const south = Math.max(a[1], b[1]);
  const east = Math.min(a[2], b[2]);
  const north = Math.min(a[3], b[3]);

  if (east < west || north < south) {
    return null;
  }

  return [west, south, east, north];
}

/** True when the two bounds share any area, including a shared edge or a point. */
export function boundsOverlap(a: Bounds, b: Bounds): boolean {
  return boundsIntersection(a, b) !== null;
}

/** Smallest bounds containing both rectangles. */
export function unionBounds(a: Bounds, b: Bounds): Bounds {
  return [
    Math.min(a[0], b[0]),
    Math.min(a[1], b[1]),
    Math.max(a[2], b[2]),
    Math.max(a[3], b[3]),
  ];
}

/** Grow bounds so they include one position. A missing box starts as that point. */
export function includePosition(
  bounds: Bounds | null,
  lon: number,
  lat: number,
): Bounds {
  if (!bounds) {
    return [lon, lat, lon, lat];
  }
  return [
    Math.min(bounds[0], lon),
    Math.min(bounds[1], lat),
    Math.max(bounds[2], lon),
    Math.max(bounds[3], lat),
  ];
}
