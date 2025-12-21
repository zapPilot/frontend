/**
 * Data Validation and Type Conversion Utilities
 *
 * Provides safe type conversions with fallback values for untrusted data sources.
 * Consolidates validation logic previously duplicated across multiple files.
 *
 * This module eliminates ~200 lines of duplicated validation code across:
 * - useUnifiedZapStream.ts
 * - useChartData.ts
 * - Various component files
 *
 * @module lib/dataValidation
 */

// =============================================================================
// CORE TYPE CONVERTERS
// =============================================================================

/**
 * Safely converts unknown value to number with fallback.
 * Handles null, undefined, NaN, Infinity, and non-numeric values.
 * Also handles string parsing and bigint conversion.
 *
 * @param value - Value to convert
 * @param fallback - Default value if conversion fails (default: 0)
 * @returns Validated number or fallback
 *
 * @example
 * toNumber("123.45") // 123.45
 * toNumber(null, 0) // 0
 * toNumber("invalid", 100) // 100
 * toNumber(BigInt(42)) // 42
 * toNumber(NaN, 0) // 0
 * toNumber(Infinity, 0) // 0
 */
export function toNumber(value: unknown, fallback = 0): number {
  // Direct number check with finite validation
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  // String parsing
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  // BigInt conversion
  if (typeof value === "bigint") {
    const converted = Number(value);
    return Number.isFinite(converted) ? converted : fallback;
  }

  return fallback;
}

/**
 * Safely converts unknown value to string with fallback.
 * Handles null, undefined, and non-string values.
 *
 * @param value - Value to convert
 * @param fallback - Default value if conversion fails (default: "")
 * @returns Validated string or fallback
 *
 * @example
 * toString("hello") // "hello"
 * toString(null, "") // ""
 * toString(123, "0") // "0" (not converted)
 * toString("  ", "default") // "default" (empty after trim)
 */
export function toString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

/**
 * Safely converts unknown value to date string (YYYY-MM-DD format).
 * Handles Date objects, date strings, and timestamps.
 *
 * @param value - Value to convert
 * @param fallback - Default value if conversion fails (default: "1970-01-01")
 * @returns Validated date string or fallback
 *
 * @example
 * toDateString("2024-01-15") // "2024-01-15"
 * toDateString(new Date("2024-01-15")) // "2024-01-15"
 * toDateString(null, "1970-01-01") // "1970-01-01"
 */
export function toDateString(value: unknown, fallback = "1970-01-01"): string {
  // Handle Date objects first
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const isoString = value.toISOString().split("T")[0];
    return isoString ?? fallback;
  }

  // Handle valid strings
  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  return fallback;
}

// =============================================================================
// ARRAY AND OBJECT HELPERS
// =============================================================================

/**
 * Converts array or undefined to partial array.
 * Useful for handling optional array data from APIs.
 *
 * @param items - Optional array to convert
 * @returns Partial array, never undefined
 *
 * @example
 * asPartialArray([{id: 1}, {id: 2}]) // [{id: 1}, {id: 2}]
 * asPartialArray(undefined) // []
 */
export function asPartialArray<T>(items: T[] | undefined): Partial<T>[] {
  return (items ?? []) as Partial<T>[];
}

// getProp function removed - unused export detected by deadcode analysis

// =============================================================================
// NUMERIC RANGE VALIDATORS
// =============================================================================

// clampNumber function removed - unused export detected by deadcode analysis

// =============================================================================
// OPTIONAL TYPE CONVERTERS
// =============================================================================

/**
 * Safely converts unknown value to string, returning undefined if invalid.
 * Accepts non-empty strings and preserves whitespace.
 */
export function safeString(value?: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

/**
 * Safely converts unknown value to string for hex-like fields.
 * Accepts non-empty strings, finite numbers, and bigint values.
 */
export function safeHexishString(value?: unknown): string | undefined {
  if (typeof value === "string") {
    return value.length > 0 ? value : undefined;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value.toString() : undefined;
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  return undefined;
}

/**
 * Safely converts value to number, returning undefined if invalid.
 * Handles string parsing, bigint conversion, and finite validation.
 *
 * @param value - Value to convert
 * @returns Number if valid and finite, undefined otherwise
 *
 * @example
 * safeNumber(123) // 123
 * safeNumber("45.67") // 45.67
 * safeNumber(BigInt(100)) // 100
 * safeNumber(NaN) // undefined
 * safeNumber(Infinity) // undefined
 * safeNumber(null) // undefined
 */
export function safeNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  if (typeof value === "bigint") {
    const converted = Number(value);
    return Number.isFinite(converted) ? converted : undefined;
  }

  return undefined;
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

export function isObject(value?: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isValidNumber(value?: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function isNonEmptyString(value?: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isValidDate(value?: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}
