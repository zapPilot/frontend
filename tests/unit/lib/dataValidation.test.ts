/**
 * Comprehensive test suite for data validation utilities
 * Tests all conversion functions with valid inputs, edge cases, and fallback behavior
 */

import { describe, expect, it } from "vitest";

import {
  asPartialArray,
  clampNumber,
  getProp,
  isArray,
  isNonEmptyString,
  isObject,
  isValidDate,
  isValidNumber,
  safeHexishString,
  safeNumber,
  safeString,
  toArray,
  toBoolean,
  toCurrency,
  toDate,
  toDateString,
  toNumber,
  toNumberInRange,
  toPercentage,
  toString,
} from "@/lib/dataValidation";

describe("dataValidation", () => {
  // =============================================================================
  // CORE TYPE CONVERTERS
  // =============================================================================

  describe("toNumber", () => {
    it("should convert valid number", () => {
      expect(toNumber(123.45)).toBe(123.45);
      expect(toNumber(0)).toBe(0);
      expect(toNumber(-42)).toBe(-42);
    });

    it("should convert valid number string", () => {
      expect(toNumber("123.45")).toBe(123.45);
      expect(toNumber("0")).toBe(0);
      expect(toNumber("-42")).toBe(-42);
    });

    it("should convert bigint", () => {
      expect(toNumber(BigInt(100))).toBe(100);
      expect(toNumber(BigInt(0))).toBe(0);
    });

    it("should return fallback for null", () => {
      expect(toNumber(null, 0)).toBe(0);
      expect(toNumber(null, 42)).toBe(42);
    });

    it("should return fallback for undefined", () => {
      expect(toNumber(undefined, 0)).toBe(0);
      expect(toNumber(undefined, 100)).toBe(100);
    });

    it("should return fallback for NaN", () => {
      expect(toNumber(NaN, 0)).toBe(0);
      expect(toNumber(NaN, 50)).toBe(50);
    });

    it("should return fallback for Infinity", () => {
      expect(toNumber(Infinity, 0)).toBe(0);
      expect(toNumber(-Infinity, 0)).toBe(0);
    });

    it("should return fallback for invalid string", () => {
      expect(toNumber("invalid", 0)).toBe(0);
      expect(toNumber("", 0)).toBe(0);
      expect(toNumber("   ", 0)).toBe(0);
    });

    it("should return fallback for objects", () => {
      expect(toNumber({}, 0)).toBe(0);
      expect(toNumber([], 0)).toBe(0);
    });

    it("should handle whitespace in strings", () => {
      expect(toNumber("  123  ")).toBe(123);
      expect(toNumber("\t456\n")).toBe(456);
    });
  });

  describe("toString", () => {
    it("should preserve valid string", () => {
      expect(toString("hello")).toBe("hello");
      expect(toString("123")).toBe("123");
    });

    it("should return fallback for null", () => {
      expect(toString(null, "")).toBe("");
      expect(toString(null, "default")).toBe("default");
    });

    it("should return fallback for undefined", () => {
      expect(toString(undefined, "")).toBe("");
      expect(toString(undefined, "fallback")).toBe("fallback");
    });

    it("should return fallback for empty string", () => {
      expect(toString("", "default")).toBe("default");
    });

    it("should return fallback for numbers", () => {
      expect(toString(123, "")).toBe("");
      expect(toString(0, "zero")).toBe("zero");
    });

    it("should return fallback for booleans", () => {
      expect(toString(true, "")).toBe("");
      expect(toString(false, "nope")).toBe("nope");
    });

    it("should return fallback for objects", () => {
      expect(toString({}, "")).toBe("");
      expect(toString([], "empty")).toBe("empty");
    });

    it("should preserve strings with spaces", () => {
      expect(toString("  hello  ")).toBe("  hello  ");
    });
  });

  describe("toBoolean", () => {
    it("should preserve boolean true", () => {
      expect(toBoolean(true)).toBe(true);
    });

    it("should preserve boolean false", () => {
      expect(toBoolean(false)).toBe(false);
    });

    it("should convert string 'true'", () => {
      expect(toBoolean("true")).toBe(true);
      expect(toBoolean("TRUE")).toBe(true);
      expect(toBoolean("True")).toBe(true);
      expect(toBoolean("  true  ")).toBe(true);
    });

    it("should convert string 'false'", () => {
      expect(toBoolean("false")).toBe(false);
      expect(toBoolean("FALSE")).toBe(false);
      expect(toBoolean("False")).toBe(false);
      expect(toBoolean("  false  ")).toBe(false);
    });

    it("should convert string '1' to true", () => {
      expect(toBoolean("1")).toBe(true);
    });

    it("should convert string '0' to false", () => {
      expect(toBoolean("0")).toBe(false);
    });

    it("should convert number 1 to true", () => {
      expect(toBoolean(1)).toBe(true);
      expect(toBoolean(42)).toBe(true);
    });

    it("should convert number 0 to false", () => {
      expect(toBoolean(0)).toBe(false);
    });

    it("should return fallback for null", () => {
      expect(toBoolean(null, false)).toBe(false);
      expect(toBoolean(null, true)).toBe(true);
    });

    it("should return fallback for undefined", () => {
      expect(toBoolean(undefined, false)).toBe(false);
      expect(toBoolean(undefined, true)).toBe(true);
    });

    it("should return fallback for invalid strings", () => {
      expect(toBoolean("yes", false)).toBe(false);
      expect(toBoolean("no", true)).toBe(true);
    });
  });

  describe("toDate", () => {
    it("should preserve valid Date object", () => {
      const date = new Date("2024-01-15");
      expect(toDate(date)).toBe(date);
    });

    it("should convert valid date string", () => {
      const result = toDate("2024-01-15");
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(0); // January is 0
    });

    it("should convert timestamp number", () => {
      const timestamp = 1705276800000; // 2024-01-15
      const result = toDate(timestamp);
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBe(timestamp);
    });

    it("should return fallback for invalid Date", () => {
      const fallback = new Date(0);
      expect(toDate(new Date("invalid"), fallback)).toBe(fallback);
    });

    it("should return fallback for null", () => {
      const fallback = new Date(0);
      expect(toDate(null, fallback)).toBe(fallback);
    });

    it("should return fallback for undefined", () => {
      const fallback = new Date(0);
      expect(toDate(undefined, fallback)).toBe(fallback);
    });

    it("should return fallback for invalid string", () => {
      const fallback = new Date(0);
      expect(toDate("not a date", fallback)).toBe(fallback);
    });

    it("should use default fallback when not provided", () => {
      const before = Date.now();
      const result = toDate("invalid");
      const after = Date.now();
      expect(result.getTime()).toBeGreaterThanOrEqual(before);
      expect(result.getTime()).toBeLessThanOrEqual(after);
    });
  });

  describe("toDateString", () => {
    it("should preserve valid date string", () => {
      expect(toDateString("2024-01-15")).toBe("2024-01-15");
    });

    it("should convert Date object to ISO string", () => {
      const date = new Date("2024-01-15T12:00:00Z");
      expect(toDateString(date)).toBe("2024-01-15");
    });

    it("should return fallback for null", () => {
      expect(toDateString(null, "1970-01-01")).toBe("1970-01-01");
    });

    it("should return fallback for undefined", () => {
      expect(toDateString(undefined, "1970-01-01")).toBe("1970-01-01");
    });

    it("should return fallback for empty string", () => {
      expect(toDateString("", "1970-01-01")).toBe("1970-01-01");
    });

    it("should return fallback for numbers", () => {
      expect(toDateString(123, "1970-01-01")).toBe("1970-01-01");
    });
  });

  // =============================================================================
  // ARRAY AND OBJECT HELPERS
  // =============================================================================

  describe("toArray", () => {
    it("should preserve valid array", () => {
      const arr = [1, 2, 3];
      expect(toArray(arr)).toBe(arr);
    });

    it("should return fallback for null", () => {
      expect(toArray(null, [])).toEqual([]);
      expect(toArray(null, [1, 2])).toEqual([1, 2]);
    });

    it("should return fallback for undefined", () => {
      expect(toArray(undefined, [])).toEqual([]);
    });

    it("should return fallback for non-array", () => {
      expect(toArray("not array", [])).toEqual([]);
      expect(toArray(123, [])).toEqual([]);
      expect(toArray({}, [])).toEqual([]);
    });

    it("should preserve empty array", () => {
      expect(toArray([])).toEqual([]);
    });
  });

  describe("asPartialArray", () => {
    it("should convert array to partial array", () => {
      const input = [{ id: 1 }, { id: 2 }];
      const result = asPartialArray(input);
      expect(result).toEqual(input);
    });

    it("should convert undefined to empty array", () => {
      expect(asPartialArray()).toEqual([]);
    });

    it("should preserve empty array", () => {
      expect(asPartialArray([])).toEqual([]);
    });
  });

  describe("getProp", () => {
    it("should extract existing property", () => {
      expect(getProp({ name: "John" }, "name", "")).toBe("John");
      expect(getProp({ age: 30 }, "age", 0)).toBe(30);
    });

    it("should return fallback for missing property", () => {
      expect(getProp({}, "missing", "default")).toBe("default");
      expect(getProp({ foo: "bar" }, "baz", 42)).toBe(42);
    });

    it("should return fallback for null object", () => {
      expect(getProp(null, "key", "fallback")).toBe("fallback");
    });

    it("should return fallback for undefined object", () => {
      expect(getProp(undefined, "key", 123)).toBe(123);
    });

    it("should return fallback for non-object", () => {
      expect(getProp("string", "key", "default")).toBe("default");
      expect(getProp(123, "key", 0)).toBe(0);
    });

    it("should handle undefined property value", () => {
      expect(getProp({ key: undefined }, "key", "fallback")).toBe("fallback");
    });

    it("should preserve null property value", () => {
      expect(getProp({ key: null }, "key", "fallback")).toBe(null);
    });
  });

  // =============================================================================
  // NUMERIC RANGE VALIDATORS
  // =============================================================================

  describe("clampNumber", () => {
    it("should clamp value above max", () => {
      expect(clampNumber(150, 0, 100)).toBe(100);
    });

    it("should clamp value below min", () => {
      expect(clampNumber(-10, 0, 100)).toBe(0);
    });

    it("should preserve value within range", () => {
      expect(clampNumber(50, 0, 100)).toBe(50);
    });

    it("should handle negative ranges", () => {
      expect(clampNumber(-50, -100, 0)).toBe(-50);
      expect(clampNumber(-150, -100, 0)).toBe(-100);
      expect(clampNumber(10, -100, 0)).toBe(0);
    });

    it("should handle equal min/max", () => {
      expect(clampNumber(50, 100, 100)).toBe(100);
    });
  });

  describe("toNumberInRange", () => {
    it("should convert and validate number in range", () => {
      expect(toNumberInRange("50", 0, 100, 0)).toBe(50);
      expect(toNumberInRange(75, 0, 100, 0)).toBe(75);
    });

    it("should return fallback for value above range", () => {
      expect(toNumberInRange("150", 0, 100, 0)).toBe(0);
      expect(toNumberInRange(150, 0, 100, 50)).toBe(50);
    });

    it("should return fallback for value below range", () => {
      expect(toNumberInRange("-10", 0, 100, 0)).toBe(0);
      expect(toNumberInRange(-10, 0, 100, 25)).toBe(25);
    });

    it("should return fallback for invalid value", () => {
      expect(toNumberInRange("invalid", 0, 100, 50)).toBe(50);
      expect(toNumberInRange(null, 0, 100, 75)).toBe(75);
    });

    it("should handle boundary values", () => {
      expect(toNumberInRange(0, 0, 100, 50)).toBe(0);
      expect(toNumberInRange(100, 0, 100, 50)).toBe(100);
    });
  });

  // =============================================================================
  // SPECIALIZED CONVERTERS
  // =============================================================================

  describe("toPercentage", () => {
    it("should convert valid percentage", () => {
      expect(toPercentage(50)).toBe(50);
      expect(toPercentage("75")).toBe(75);
    });

    it("should clamp percentage above 100", () => {
      expect(toPercentage(150)).toBe(100);
      expect(toPercentage("200")).toBe(100);
    });

    it("should clamp percentage below 0", () => {
      expect(toPercentage(-10)).toBe(0);
      expect(toPercentage("-50")).toBe(0);
    });

    it("should handle boundary values", () => {
      expect(toPercentage(0)).toBe(0);
      expect(toPercentage(100)).toBe(100);
    });

    it("should use fallback for invalid values", () => {
      expect(toPercentage("invalid", 50)).toBe(50);
      expect(toPercentage(null, 25)).toBe(25);
    });
  });

  describe("toCurrency", () => {
    it("should format valid number as currency", () => {
      expect(toCurrency(1234.56)).toBe("$1,234.56");
      expect(toCurrency(0)).toBe("$0.00");
    });

    it("should format string number as currency", () => {
      expect(toCurrency("1000")).toBe("$1,000.00");
    });

    it("should return fallback for null", () => {
      expect(toCurrency(null, "$0.00")).toBe("$0.00");
    });

    it("should return fallback for undefined", () => {
      expect(toCurrency(undefined, "$0.00")).toBe("$0.00");
    });

    it("should return fallback for invalid string", () => {
      expect(toCurrency("invalid", "$0.00")).toBe("$0.00");
    });

    it("should handle negative numbers", () => {
      expect(toCurrency(-100)).toBe("-$100.00");
    });

    it("should handle large numbers", () => {
      expect(toCurrency(1234567.89)).toBe("$1,234,567.89");
    });
  });

  // =============================================================================
  // OPTIONAL TYPE CONVERTERS
  // =============================================================================

  describe("safeString", () => {
    it("should return valid string", () => {
      expect(safeString("hello")).toBe("hello");
    });

    it("should return undefined for null", () => {
      expect(safeString(null)).toBeUndefined();
    });

    it("should return undefined for undefined", () => {
      expect(safeString()).toBeUndefined();
    });

    it("should return undefined for empty string", () => {
      expect(safeString("")).toBeUndefined();
    });

    it("should return undefined for numbers", () => {
      expect(safeString(123)).toBeUndefined();
    });

    it("should preserve strings with spaces", () => {
      expect(safeString("  hello  ")).toBe("  hello  ");
    });
  });

  describe("safeNumber", () => {
    it("should return valid number", () => {
      expect(safeNumber(123)).toBe(123);
      expect(safeNumber(0)).toBe(0);
      expect(safeNumber(-42)).toBe(-42);
    });

    it("should convert valid number string", () => {
      expect(safeNumber("123.45")).toBe(123.45);
    });

    it("should convert bigint", () => {
      expect(safeNumber(BigInt(100))).toBe(100);
    });

    it("should return undefined for null", () => {
      expect(safeNumber(null)).toBeUndefined();
    });

    it("should return undefined for undefined", () => {
      expect(safeNumber()).toBeUndefined();
    });

    it("should return undefined for NaN", () => {
      expect(safeNumber(NaN)).toBeUndefined();
    });

    it("should return undefined for Infinity", () => {
      expect(safeNumber(Infinity)).toBeUndefined();
      expect(safeNumber(-Infinity)).toBeUndefined();
    });

    it("should return undefined for invalid string", () => {
      expect(safeNumber("invalid")).toBeUndefined();
      expect(safeNumber("")).toBeUndefined();
    });
  });

  describe("safeHexishString", () => {
    it("should return valid string", () => {
      expect(safeHexishString("0x123")).toBe("0x123");
    });

    it("should convert number to string", () => {
      expect(safeHexishString(42)).toBe("42");
    });

    it("should convert bigint to string", () => {
      expect(safeHexishString(BigInt(100))).toBe("100");
    });

    it("should return undefined for null", () => {
      expect(safeHexishString(null)).toBeUndefined();
    });

    it("should return undefined for undefined", () => {
      expect(safeHexishString()).toBeUndefined();
    });

    it("should return undefined for empty string", () => {
      expect(safeHexishString("")).toBeUndefined();
    });

    it("should return undefined for NaN", () => {
      expect(safeHexishString(NaN)).toBeUndefined();
    });

    it("should return undefined for Infinity", () => {
      expect(safeHexishString(Infinity)).toBeUndefined();
    });
  });

  // =============================================================================
  // TYPE GUARDS
  // =============================================================================

  describe("isObject", () => {
    it("should return true for plain object", () => {
      expect(isObject({})).toBe(true);
      expect(isObject({ key: "value" })).toBe(true);
    });

    it("should return false for array", () => {
      expect(isObject([])).toBe(false);
      expect(isObject([1, 2, 3])).toBe(false);
    });

    it("should return false for null", () => {
      expect(isObject(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isObject()).toBe(false);
    });

    it("should return false for primitives", () => {
      expect(isObject("string")).toBe(false);
      expect(isObject(123)).toBe(false);
      expect(isObject(true)).toBe(false);
    });

    it("should return true for Date object", () => {
      expect(isObject(new Date())).toBe(true);
    });
  });

  describe("isValidNumber", () => {
    it("should return true for valid numbers", () => {
      expect(isValidNumber(123)).toBe(true);
      expect(isValidNumber(0)).toBe(true);
      expect(isValidNumber(-42)).toBe(true);
      expect(isValidNumber(3.14)).toBe(true);
    });

    it("should return false for NaN", () => {
      expect(isValidNumber(NaN)).toBe(false);
    });

    it("should return false for Infinity", () => {
      expect(isValidNumber(Infinity)).toBe(false);
      expect(isValidNumber(-Infinity)).toBe(false);
    });

    it("should return false for non-numbers", () => {
      expect(isValidNumber("123")).toBe(false);
      expect(isValidNumber(null)).toBe(false);
      expect(isValidNumber()).toBe(false);
    });
  });

  describe("isNonEmptyString", () => {
    it("should return true for non-empty string", () => {
      expect(isNonEmptyString("hello")).toBe(true);
      expect(isNonEmptyString("123")).toBe(true);
    });

    it("should return false for empty string", () => {
      expect(isNonEmptyString("")).toBe(false);
    });

    it("should return false for whitespace-only string", () => {
      expect(isNonEmptyString("   ")).toBe(false);
      expect(isNonEmptyString("\t\n")).toBe(false);
    });

    it("should return false for null", () => {
      expect(isNonEmptyString(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isNonEmptyString()).toBe(false);
    });

    it("should return false for non-strings", () => {
      expect(isNonEmptyString(123)).toBe(false);
      expect(isNonEmptyString(true)).toBe(false);
    });
  });

  describe("isArray", () => {
    it("should return true for arrays", () => {
      expect(isArray([])).toBe(true);
      expect(isArray([1, 2, 3])).toBe(true);
    });

    it("should return false for non-arrays", () => {
      expect(isArray("string")).toBe(false);
      expect(isArray(123)).toBe(false);
      expect(isArray({})).toBe(false);
      expect(isArray(null)).toBe(false);
      expect(isArray()).toBe(false);
    });
  });

  describe("isValidDate", () => {
    it("should return true for valid Date", () => {
      expect(isValidDate(new Date())).toBe(true);
      expect(isValidDate(new Date("2024-01-15"))).toBe(true);
    });

    it("should return false for invalid Date", () => {
      expect(isValidDate(new Date("invalid"))).toBe(false);
    });

    it("should return false for non-Date", () => {
      expect(isValidDate("2024-01-15")).toBe(false);
      expect(isValidDate(1705276800000)).toBe(false);
      expect(isValidDate(null)).toBe(false);
      expect(isValidDate()).toBe(false);
    });
  });
});
