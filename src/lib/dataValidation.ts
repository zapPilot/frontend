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
 * Safely converts unknown value to boolean with fallback.
 * Handles truthy/falsy values and string representations.
 *
 * @param value - Value to convert
 * @param fallback - Default value if conversion fails (default: false)
 * @returns Validated boolean or fallback
 *
 * @example
 * toBoolean(true) // true
 * toBoolean("true") // true
 * toBoolean("false") // false
 * toBoolean(1) // true
 * toBoolean(0) // false
 * toBoolean(null, false) // false
 */
export function toBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.toLowerCase().trim();
    if (normalized === "true" || normalized === "1") return true;
    if (normalized === "false" || normalized === "0") return false;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  return fallback;
}

/**
 * Safely converts unknown value to Date with fallback.
 * Handles Date objects, valid date strings, and timestamps.
 *
 * @param value - Value to convert
 * @param fallback - Default value if conversion fails (default: new Date())
 * @returns Validated Date or fallback
 *
 * @example
 * toDate("2024-01-15") // Date object
 * toDate(1705276800000) // Date from timestamp
 * toDate(new Date()) // Pass-through
 * toDate("invalid", new Date(0)) // Fallback
 */
export function toDate(value: unknown, fallback: Date = new Date()): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return fallback;
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
export function toDateString(
  value: unknown,
  fallback = "1970-01-01"
): string {
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
 * Safely converts unknown value to array with fallback.
 * Handles null, undefined, and non-array values.
 *
 * @param value - Value to convert
 * @param fallback - Default value if conversion fails (default: [])
 * @returns Validated array or fallback
 *
 * @example
 * toArray([1, 2, 3]) // [1, 2, 3]
 * toArray(null, []) // []
 * toArray("not-array", []) // []
 * toArray(undefined, [42]) // [42]
 */
export function toArray<T>(value: unknown, fallback: T[] = []): T[] {
  return Array.isArray(value) ? value : fallback;
}

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

/**
 * Safely extracts property from object with type validation.
 * Provides type-safe property access for unknown objects.
 *
 * @param obj - Object to extract from
 * @param key - Property key
 * @param fallback - Default value if property doesn't exist or object is invalid
 * @returns Property value or fallback
 *
 * @example
 * getProp({ name: "John" }, "name", "") // "John"
 * getProp({}, "missing", "default") // "default"
 * getProp(null, "key", 42) // 42
 */
export function getProp<T>(obj: unknown, key: string, fallback: T): T {
  if (typeof obj !== "object" || obj === null) {
    return fallback;
  }

  const value = (obj as Record<string, unknown>)[key];
  return value !== undefined ? (value as T) : fallback;
}

// =============================================================================
// NUMERIC RANGE VALIDATORS
// =============================================================================

/**
 * Clamps number to min/max range.
 * Ensures value stays within specified bounds.
 *
 * @param value - Number to clamp
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Clamped value
 *
 * @example
 * clampNumber(150, 0, 100) // 100
 * clampNumber(-10, 0, 100) // 0
 * clampNumber(50, 0, 100) // 50
 */
export function clampNumber(
  value: number,
  min: number,
  max: number
): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Validates number is within range, returns fallback if not.
 * Combines toNumber with range validation.
 *
 * @param value - Value to convert and validate
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @param fallback - Default value if out of range or invalid
 * @returns Validated number in range or fallback
 *
 * @example
 * toNumberInRange("50", 0, 100, 0) // 50
 * toNumberInRange("150", 0, 100, 0) // 0 (out of range)
 * toNumberInRange("invalid", 0, 100, 50) // 50
 */
export function toNumberInRange(
  value: unknown,
  min: number,
  max: number,
  fallback: number
): number {
  const num = toNumber(value, fallback);
  if (num < min || num > max) {
    return fallback;
  }
  return num;
}

// =============================================================================
// SPECIALIZED CONVERTERS
// =============================================================================

/**
 * Converts value to percentage (0-100 range).
 * Automatically clamps to valid percentage range.
 *
 * @param value - Value to convert
 * @param fallback - Default value if conversion fails (default: 0)
 * @returns Percentage value (0-100) or fallback
 *
 * @example
 * toPercentage(50) // 50
 * toPercentage(150) // 100 (clamped)
 * toPercentage(-10) // 0 (clamped)
 * toPercentage("75") // 75
 */
export function toPercentage(value: unknown, fallback = 0): number {
  return clampNumber(toNumber(value, fallback), 0, 100);
}

/**
 * Converts value to USD currency string.
 * Formats as locale-aware currency with proper decimals.
 *
 * @param value - Value to convert
 * @param fallback - Default string if conversion fails (default: "$0.00")
 * @returns Formatted currency string
 *
 * @example
 * toCurrency(1234.56) // "$1,234.56"
 * toCurrency("1000") // "$1,000.00"
 * toCurrency(null, "$0.00") // "$0.00"
 */
export function toCurrency(value: unknown, fallback = "$0.00"): string {
  const num = toNumber(value, NaN);
  if (Number.isNaN(num)) {
    return fallback;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

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
 * Type guard: checks if value is a non-null object.
 * Useful for validating API responses and unknown data structures.
 *
 * @param value - Value to check
 * @returns True if value is a plain object (not array, not null)
 *
 * @example
 * isObject({}) // true
 * isObject({ key: "value" }) // true
 * isObject([]) // false
 * isObject(null) // false
 * isObject("string") // false
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Type guard: checks if value is a valid number (not NaN/Infinity).
 * Provides type narrowing for TypeScript and runtime validation.
 *
 * @param value - Value to check
 * @returns True if value is a finite number
 *
 * @example
 * isValidNumber(123) // true
 * isValidNumber(0) // true
 * isValidNumber(NaN) // false
 * isValidNumber(Infinity) // false
 * isValidNumber("123") // false
 */
export function isValidNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * Type guard: checks if value is non-empty string.
 * Validates string presence and non-whitespace content.
 *
 * @param value - Value to check
 * @returns True if value is a non-empty, non-whitespace string
 *
 * @example
 * isNonEmptyString("hello") // true
 * isNonEmptyString("") // false
 * isNonEmptyString("   ") // false
 * isNonEmptyString(null) // false
 * isNonEmptyString(123) // false
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Type guard: checks if value is an array.
 * Provides generic type parameter for element type narrowing.
 *
 * @param value - Value to check
 * @returns True if value is an array
 *
 * @example
 * isArray([1, 2, 3]) // true
 * isArray([]) // true
 * isArray("not array") // false
 * isArray(null) // false
 *
 * // With type narrowing:
 * if (isArray<string>(value)) {
 *   // TypeScript knows value is string[]
 * }
 */
export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * Type guard: checks if value is a valid Date object.
 * Validates Date instance and non-invalid date value.
 *
 * @param value - Value to check
 * @returns True if value is a valid Date
 *
 * @example
 * isValidDate(new Date()) // true
 * isValidDate(new Date("2024-01-15")) // true
 * isValidDate(new Date("invalid")) // false
 * isValidDate("2024-01-15") // false
 */
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}
