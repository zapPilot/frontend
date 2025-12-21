/**
 * Comprehensive test suite for data validation utilities
 * Tests all conversion functions with valid inputs, edge cases, and fallback behavior
 */

import { describe, expect, it } from "vitest";

import {
  asPartialArray,
  isNonEmptyString,
  isObject,
  isValidDate,
  isValidNumber,
  safeHexishString,
  safeNumber,
  safeString,
  toDateString,
  toNumber,
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

  // Removed getProp and clampNumber tests - functions were unused and removed (deadcode cleanup)

  // =============================================================================
  // SPECIALIZED CONVERTERS
  // =============================================================================

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
