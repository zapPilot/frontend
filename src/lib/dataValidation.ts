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
 * Safely converts value to string, returning undefined if invalid.
 * Useful for optional string fields that should be undefined when missing.
 *
 * @param value - Value to convert
 * @returns String if valid, undefined otherwise
 *
 * @example
 * safeString("hello") // "hello"
 * safeString(null) // undefined
 * safeString("") // undefined
 * safeString(123) // undefined
 */
export function safeString(value: unknown): string | undefined {
  if (typeof value === "string" && value.length > 0) {
    return value;
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

/**
 * Safely converts value to string representation (hex-compatible).
 * Handles string, number, and bigint types for hex/address conversions.
 *
 * @param value - Value to convert
 * @returns String representation if valid, undefined otherwise
 *
 * @example
 * safeHexishString("0x123") // "0x123"
 * safeHexishString(42) // "42"
 * safeHexishString(BigInt(100)) // "100"
 * safeHexishString(null) // undefined
 */
export function safeHexishString(value: unknown): string | undefined {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toString();
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  return undefined;
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

/**
 * Type guard: checks if value is a plain object (not array, null, or primitive).
 *
 * @param value - Value to check
 * @returns True if value is a plain object
 *
 * @example
 * isObject({}) // true
 * isObject({ key: "value" }) // true
 * isObject([]) // false
 * isObject(null) // false
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Type guard: checks if value is a valid finite number.
 *
 * @param value - Value to check
 * @returns True if value is a finite number
 *
 * @example
 * isValidNumber(123) // true
 * isValidNumber(NaN) // false
 * isValidNumber(Infinity) // false
 * isValidNumber("123") // false
 */
export function isValidNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * Type guard: checks if value is a non-empty string (after trimming).
 *
 * @param value - Value to check
 * @returns True if value is a non-empty string
 *
 * @example
 * isNonEmptyString("hello") // true
 * isNonEmptyString("") // false
 * isNonEmptyString("   ") // false
 * isNonEmptyString(null) // false
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Type guard: checks if value is an array.
 * Provides generic type parameter for element type narrowing.
 *


/**
 * Type guard: checks if value is a valid Date object.
 *
 * @param value - Value to check
 * @returns True if value is a valid Date
 *
 * @example
 * isValidDate(new Date()) // true
 * isValidDate(new Date("invalid")) // false
 * isValidDate("2024-01-15") // false
 * isValidDate(null) // false
 */
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}
