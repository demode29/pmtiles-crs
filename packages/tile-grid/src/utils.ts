/** Clamp `num` into the closed interval `[min, max]`. */
export function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}

/**
 * Map `num` into the half-open interval `[min, max)`.
 * JS `%` keeps the dividend's sign, so a negative offset is corrected.
 */
export function wrap(num: number, min: number, max: number): number {
  const span = max - min;
  return min + ((((num - min) % span) + span) % span);
}
