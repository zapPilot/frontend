/**
 * Math Utilities
 * Reusable mathematical operations and helpers
 *
 * @module lib/mathUtils
 */

/**
 * Clamp a value between minimum and maximum bounds
 *
 * @param value - The value to clamp
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Clamped value
 *
 * @example
 * clamp(15, 0, 10) // 10
 * clamp(-5, 0, 10) // 0
 * clamp(5, 0, 10)  // 5
 */
export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

/**
 * Clamp a value to a minimum bound
 * Useful for ensuring non-negative values
 *
 * @param value - The value to clamp
 * @param min - Minimum allowed value
 * @returns Clamped value
 *
 * @example
 * clampMin(5, 0)   // 5
 * clampMin(-5, 0)  // 0
 * clampMin(10, 0)  // 10
 */
export const clampMin = (value: number, min: number): number =>
  Math.max(min, value);

/**
 * Ensure value is non-negative (>= 0)
 * Alias for clampMin(value, 0)
 *
 * @param value - The value to ensure non-negative
 * @returns Non-negative value
 */
export const ensureNonNegative = (value: number): number => clampMin(value, 0);
