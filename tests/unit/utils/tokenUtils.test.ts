/**
 * Token Utilities Test Suite
 *
 * Comprehensive test coverage for token utility functions with edge case handling.
 *
 * Coverage:
 * - Symbol and metadata utilities (getTokenSymbol, getTokenDisplayName)
 * - Filtering and sorting (getFilteredAndSortedTokens)
 * - Calculations (calculateTotalTokenValue)
 * - Validation (validateToken)
 *
 * Edge cases tested:
 * - null, undefined, and non-array inputs
 * - Empty arrays
 * - Zero, negative, and NaN values
 * - Boundary conditions
 * - Type coercion
 * - Whitespace handling
 *
 * @module tests/unit/utils/tokenUtils
 */

import { describe, expect, it } from "vitest";
import {
  calculateTotalTokenValue,
  getFilteredAndSortedTokens,
  getTokenDisplayName,
  getTokenSymbol,
  validateToken,
  type Token,
  type UnvalidatedTokenInput,
} from "../../../src/utils/tokenUtils";

describe("tokenUtils", () => {
  // =============================================================================
  // TEST DATA FIXTURES
  // =============================================================================

  const tokenWithName = {
    symbol: "ETH",
    optimized_symbol: "WETH",
    amount: 10,
    price: 2000,
    name: "Wrapped Ethereum",
  };

  // =============================================================================
  // SYMBOL AND METADATA UTILITIES
  // =============================================================================

  describe("getTokenSymbol", () => {
    it("should return optimized_symbol when available", () => {
      const token: Token = {
        symbol: "ETH",
        optimized_symbol: "WETH",
        amount: 1,
        price: 2000,
      };

      expect(getTokenSymbol(token)).toBe("WETH");
    });

    it("should return symbol when optimized_symbol is undefined", () => {
      const token: Token = {
        symbol: "ETH",
        amount: 1,
        price: 2000,
      };

      expect(getTokenSymbol(token)).toBe("ETH");
    });

    it("should return symbol when optimized_symbol is empty string", () => {
      const token: Token = {
        symbol: "ETH",
        optimized_symbol: "",
        amount: 1,
        price: 2000,
      };

      expect(getTokenSymbol(token)).toBe("ETH");
    });

    it('should return "UNKNOWN" when both symbol and optimized_symbol are empty', () => {
      const token: Token = {
        symbol: "",
        optimized_symbol: "",
        amount: 1,
        price: 2000,
      };

      expect(getTokenSymbol(token)).toBe("UNKNOWN");
    });

    it('should return "UNKNOWN" when symbol is missing', () => {
      const token = {
        amount: 1,
        price: 2000,
      } as Token;

      expect(getTokenSymbol(token)).toBe("UNKNOWN");
    });
  });

  describe("getTokenDisplayName", () => {
    it("should return symbol only when includeName is false", () => {
      expect(getTokenDisplayName(tokenWithName, false)).toBe("WETH");
    });

    it("should return symbol only when includeName is omitted (default)", () => {
      expect(getTokenDisplayName(tokenWithName)).toBe("WETH");
    });

    it("should return symbol with name when includeName is true", () => {
      expect(getTokenDisplayName(tokenWithName, true)).toBe(
        "WETH (Wrapped Ethereum)"
      );
    });

    it("should return symbol only when name is not available", () => {
      const tokenWithoutName = {
        symbol: "ETH",
        optimized_symbol: "WETH",
        amount: 10,
        price: 2000,
      };

      expect(getTokenDisplayName(tokenWithoutName, true)).toBe("WETH");
    });

    it("should return symbol only when name is empty string", () => {
      const tokenWithEmptyName = {
        symbol: "ETH",
        optimized_symbol: "WETH",
        amount: 10,
        price: 2000,
        name: "",
      };

      expect(getTokenDisplayName(tokenWithEmptyName, true)).toBe("WETH");
    });

    it("should return symbol only when name equals symbol", () => {
      const tokenWithSameName = {
        symbol: "ETH",
        optimized_symbol: "WETH",
        amount: 10,
        price: 2000,
        name: "WETH",
      };

      expect(getTokenDisplayName(tokenWithSameName, true)).toBe("WETH");
    });
  });

  // =============================================================================
  // FILTERING AND SORTING UTILITIES
  // =============================================================================

  describe("getFilteredAndSortedTokens", () => {
    it("should filter out tokens with zero price", () => {
      const tokens: Token[] = [
        { symbol: "ETH", amount: 10, price: 2000 },
        { symbol: "ZERO", amount: 100, price: 0 },
      ];

      const result = getFilteredAndSortedTokens(tokens);

      expect(result.tokens).toHaveLength(1);
      expect(result.tokens[0].symbol).toBe("ETH");
      expect(result.filteredCount).toBe(1);
    });

    it("should filter out tokens with zero amount", () => {
      const tokens: Token[] = [
        { symbol: "ETH", amount: 10, price: 2000 },
        { symbol: "ZERO", amount: 0, price: 1000 },
      ];

      const result = getFilteredAndSortedTokens(tokens);

      expect(result.tokens).toHaveLength(1);
      expect(result.tokens[0].symbol).toBe("ETH");
      expect(result.filteredCount).toBe(1);
    });

    it("should filter out tokens with negative price", () => {
      const tokens: Token[] = [
        { symbol: "ETH", amount: 10, price: 2000 },
        { symbol: "NEG", amount: 10, price: -100 },
      ];

      const result = getFilteredAndSortedTokens(tokens);

      expect(result.tokens).toHaveLength(1);
      expect(result.filteredCount).toBe(1);
    });

    it("should filter out tokens with negative amount", () => {
      const tokens: Token[] = [
        { symbol: "ETH", amount: 10, price: 2000 },
        { symbol: "NEG", amount: -10, price: 100 },
      ];

      const result = getFilteredAndSortedTokens(tokens);

      expect(result.tokens).toHaveLength(1);
      expect(result.filteredCount).toBe(1);
    });

    it("should sort tokens by total value descending", () => {
      const tokens: Token[] = [
        { symbol: "LOW", amount: 1, price: 100 }, // 100 value
        { symbol: "HIGH", amount: 10, price: 2000 }, // 20000 value
        { symbol: "MED", amount: 50, price: 50 }, // 2500 value
      ];

      const result = getFilteredAndSortedTokens(tokens);

      expect(result.tokens[0].symbol).toBe("HIGH");
      expect(result.tokens[1].symbol).toBe("MED");
      expect(result.tokens[2].symbol).toBe("LOW");
    });

    it("should calculate total value correctly", () => {
      const tokens: Token[] = [
        { symbol: "ETH", amount: 10, price: 2000 },
        { symbol: "USDC", amount: 5000, price: 1 },
      ];

      const result = getFilteredAndSortedTokens(tokens);

      expect(result.totalValue).toBe(25000); // 20000 + 5000
    });

    it("should return empty result for null input", () => {
      const result = getFilteredAndSortedTokens(null as unknown as Token[]);

      expect(result.tokens).toEqual([]);
      expect(result.totalValue).toBe(0);
      expect(result.filteredCount).toBe(0);
    });

    it("should return empty result for undefined input", () => {
      const result = getFilteredAndSortedTokens(
        undefined as unknown as Token[]
      );

      expect(result.tokens).toEqual([]);
      expect(result.totalValue).toBe(0);
      expect(result.filteredCount).toBe(0);
    });

    it("should return empty result for non-array input", () => {
      const result = getFilteredAndSortedTokens({} as unknown as Token[]);

      expect(result.tokens).toEqual([]);
      expect(result.totalValue).toBe(0);
      expect(result.filteredCount).toBe(0);
    });

    it("should handle empty array", () => {
      const result = getFilteredAndSortedTokens([]);

      expect(result.tokens).toEqual([]);
      expect(result.totalValue).toBe(0);
      expect(result.filteredCount).toBe(0);
    });

    it("should track filtered count correctly", () => {
      const tokens: Token[] = [
        { symbol: "VALID", amount: 10, price: 100 },
        { symbol: "ZERO_PRICE", amount: 10, price: 0 },
        { symbol: "ZERO_AMOUNT", amount: 0, price: 100 },
        { symbol: "BOTH_ZERO", amount: 0, price: 0 },
      ];

      const result = getFilteredAndSortedTokens(tokens);

      expect(result.tokens).toHaveLength(1);
      expect(result.filteredCount).toBe(3);
    });
  });

  // =============================================================================
  // CALCULATION UTILITIES
  // =============================================================================

  describe("calculateTotalTokenValue", () => {
    it("should calculate total value correctly", () => {
      const tokens: Token[] = [
        { symbol: "ETH", amount: 10, price: 2000 },
        { symbol: "USDC", amount: 5000, price: 1 },
      ];

      expect(calculateTotalTokenValue(tokens)).toBe(25000);
    });

    it("should handle empty array", () => {
      expect(calculateTotalTokenValue([])).toBe(0);
    });

    it("should return 0 for null input", () => {
      expect(calculateTotalTokenValue(null as unknown as Token[])).toBe(0);
    });

    it("should return 0 for undefined input", () => {
      expect(calculateTotalTokenValue(undefined as unknown as Token[])).toBe(0);
    });

    it("should return 0 for non-array input", () => {
      expect(calculateTotalTokenValue({} as unknown as Token[])).toBe(0);
    });

    it("should handle tokens with zero amount", () => {
      const tokens: Token[] = [
        { symbol: "ETH", amount: 0, price: 2000 },
        { symbol: "USDC", amount: 1000, price: 1 },
      ];

      expect(calculateTotalTokenValue(tokens)).toBe(1000);
    });

    it("should handle tokens with zero price", () => {
      const tokens: Token[] = [
        { symbol: "ETH", amount: 10, price: 0 },
        { symbol: "USDC", amount: 1000, price: 1 },
      ];

      expect(calculateTotalTokenValue(tokens)).toBe(1000);
    });

    it("should handle NaN values gracefully", () => {
      const tokens: Token[] = [
        { symbol: "ETH", amount: NaN, price: 2000 },
        { symbol: "USDC", amount: 1000, price: 1 },
      ];

      expect(calculateTotalTokenValue(tokens)).toBe(1000);
    });

    it("should handle negative values", () => {
      const tokens: Token[] = [
        { symbol: "ETH", amount: -10, price: 2000 },
        { symbol: "USDC", amount: 1000, price: 1 },
      ];

      expect(calculateTotalTokenValue(tokens)).toBe(-19000);
    });

    it("should handle decimal values", () => {
      const tokens: Token[] = [
        { symbol: "ETH", amount: 0.5, price: 2000 },
        { symbol: "USDC", amount: 100.25, price: 1 },
      ];

      expect(calculateTotalTokenValue(tokens)).toBe(1100.25);
    });
  });

  // =============================================================================
  // VALIDATION UTILITIES
  // =============================================================================

  describe("validateToken", () => {
    it("should validate a valid token", () => {
      const token: UnvalidatedTokenInput = {
        symbol: "ETH",
        amount: 10,
        price: 2000,
      };

      const result = validateToken(token);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should reject null input", () => {
      const result = validateToken(null as unknown as UnvalidatedTokenInput);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Token must be a valid object");
    });

    it("should reject undefined input", () => {
      const result = validateToken(
        undefined as unknown as UnvalidatedTokenInput
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Token must be a valid object");
    });

    it("should reject non-object input", () => {
      const result = validateToken(
        "not an object" as unknown as UnvalidatedTokenInput
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Token must be a valid object");
    });

    it("should reject token without symbol", () => {
      const token: UnvalidatedTokenInput = {
        amount: 10,
        price: 2000,
      };

      const result = validateToken(token);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Token must have a valid symbol");
    });

    it("should reject token with empty symbol", () => {
      const token: UnvalidatedTokenInput = {
        symbol: "   ",
        amount: 10,
        price: 2000,
      };

      const result = validateToken(token);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Token must have a valid symbol");
    });

    it("should reject token with non-string symbol", () => {
      const token: UnvalidatedTokenInput = {
        symbol: 123,
        amount: 10,
        price: 2000,
      };

      const result = validateToken(token);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Token must have a valid symbol");
    });

    it("should reject token without amount", () => {
      const token: UnvalidatedTokenInput = {
        symbol: "ETH",
        price: 2000,
      };

      const result = validateToken(token);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Token amount must be a non-negative number"
      );
    });

    it("should reject token with negative amount", () => {
      const token: UnvalidatedTokenInput = {
        symbol: "ETH",
        amount: -10,
        price: 2000,
      };

      const result = validateToken(token);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Token amount must be a non-negative number"
      );
    });

    it("should reject token with NaN amount", () => {
      const token: UnvalidatedTokenInput = {
        symbol: "ETH",
        amount: NaN,
        price: 2000,
      };

      const result = validateToken(token);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Token amount must be a non-negative number"
      );
    });

    it("should reject token with non-number amount", () => {
      const token: UnvalidatedTokenInput = {
        symbol: "ETH",
        amount: "10",
        price: 2000,
      };

      const result = validateToken(token);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Token amount must be a non-negative number"
      );
    });

    it("should reject token without price", () => {
      const token: UnvalidatedTokenInput = {
        symbol: "ETH",
        amount: 10,
      };

      const result = validateToken(token);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Token price must be a non-negative number"
      );
    });

    it("should reject token with negative price", () => {
      const token: UnvalidatedTokenInput = {
        symbol: "ETH",
        amount: 10,
        price: -2000,
      };

      const result = validateToken(token);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Token price must be a non-negative number"
      );
    });

    it("should reject token with NaN price", () => {
      const token: UnvalidatedTokenInput = {
        symbol: "ETH",
        amount: 10,
        price: NaN,
      };

      const result = validateToken(token);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Token price must be a non-negative number"
      );
    });

    it("should accept token with zero amount", () => {
      const token: UnvalidatedTokenInput = {
        symbol: "ETH",
        amount: 0,
        price: 2000,
      };

      const result = validateToken(token);

      expect(result.isValid).toBe(true);
    });

    it("should accept token with zero price", () => {
      const token: UnvalidatedTokenInput = {
        symbol: "ETH",
        amount: 10,
        price: 0,
      };

      const result = validateToken(token);

      expect(result.isValid).toBe(true);
    });

    it("should collect multiple validation errors", () => {
      const token: UnvalidatedTokenInput = {
        symbol: "",
        amount: -10,
        price: NaN,
      };

      const result = validateToken(token);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3);
    });
  });
});
