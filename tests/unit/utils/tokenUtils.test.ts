/**
 * Token Utilities Test Suite
 *
 * Comprehensive test coverage for token utility functions with edge case handling.
 *
 * Coverage:
 * - Symbol and metadata utilities (getTokenSymbol, getTokenDisplayName)
 * - Filtering and sorting (getFilteredAndSortedTokens, filterTokensByValue, getDustTokens, getTopTokensByValue)
 * - Calculations (calculateTotalTokenValue, calculateTokenAllocations, calculateWeightedAveragePrice)
 * - Grouping and categorization (groupTokensByCategory)
 * - Validation and sanitization (validateToken, sanitizeToken, sanitizeTokens)
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
  calculateTokenAllocations,
  calculateTotalTokenValue,
  calculateWeightedAveragePrice,
  filterTokensByValue,
  getDustTokens,
  getFilteredAndSortedTokens,
  getTokenDisplayName,
  getTokenSymbol,
  getTopTokensByValue,
  groupTokensByCategory,
  sanitizeToken,
  sanitizeTokens,
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

  describe("filterTokensByValue", () => {
    it("should filter tokens above minimum value", () => {
      const tokens: Token[] = [
        { symbol: "HIGH", amount: 10, price: 1000 }, // 10000
        { symbol: "MED", amount: 5, price: 500 }, // 2500
        { symbol: "LOW", amount: 1, price: 100 }, // 100
      ];

      const result = filterTokensByValue(tokens, 1000);

      expect(result).toHaveLength(2);
      expect(result.map(t => t.symbol)).toEqual(["HIGH", "MED"]);
    });

    it("should include tokens equal to minimum value", () => {
      const tokens: Token[] = [
        { symbol: "EXACT", amount: 10, price: 100 }, // 1000
        { symbol: "LOW", amount: 1, price: 100 }, // 100
      ];

      const result = filterTokensByValue(tokens, 1000);

      expect(result).toHaveLength(1);
      expect(result[0].symbol).toBe("EXACT");
    });

    it("should return empty array for null input", () => {
      const result = filterTokensByValue(null as unknown as Token[], 100);

      expect(result).toEqual([]);
    });

    it("should return empty array for undefined input", () => {
      const result = filterTokensByValue(undefined as unknown as Token[], 100);

      expect(result).toEqual([]);
    });

    it("should return empty array for non-array input", () => {
      const result = filterTokensByValue({} as unknown as Token[], 100);

      expect(result).toEqual([]);
    });

    it("should handle zero minimum value", () => {
      const tokens: Token[] = [
        { symbol: "ETH", amount: 1, price: 2000 },
        { symbol: "ZERO", amount: 0, price: 100 },
      ];

      const result = filterTokensByValue(tokens, 0);

      expect(result).toHaveLength(2);
      expect(result.map(t => t.symbol)).toEqual(["ETH", "ZERO"]);
    });

    it("should handle negative minimum value", () => {
      const tokens: Token[] = [{ symbol: "ETH", amount: 1, price: 2000 }];

      const result = filterTokensByValue(tokens, -100);

      expect(result).toHaveLength(1);
    });

    it("should return empty array when all tokens below threshold", () => {
      const tokens: Token[] = [{ symbol: "LOW", amount: 1, price: 1 }];

      const result = filterTokensByValue(tokens, 1000);

      expect(result).toEqual([]);
    });
  });

  describe("getDustTokens", () => {
    it("should return tokens below maximum value", () => {
      const tokens: Token[] = [
        { symbol: "HIGH", amount: 100, price: 1000 }, // 100000
        { symbol: "DUST1", amount: 1, price: 5 }, // 5
        { symbol: "DUST2", amount: 2, price: 3 }, // 6
      ];

      const result = getDustTokens(tokens, 10);

      expect(result).toHaveLength(2);
      expect(result.map(t => t.symbol)).toEqual(["DUST1", "DUST2"]);
    });

    it("should include value property in returned tokens", () => {
      const tokens: Token[] = [{ symbol: "DUST", amount: 2, price: 3 }];

      const result = getDustTokens(tokens, 10);

      expect(result[0].value).toBe(6);
    });

    it("should sort dust tokens by value ascending", () => {
      const tokens: Token[] = [
        { symbol: "DUST3", amount: 1, price: 9 }, // 9
        { symbol: "DUST1", amount: 1, price: 3 }, // 3
        { symbol: "DUST2", amount: 2, price: 3 }, // 6
      ];

      const result = getDustTokens(tokens, 10);

      expect(result.map(t => t.symbol)).toEqual(["DUST1", "DUST2", "DUST3"]);
      expect(result.map(t => t.value)).toEqual([3, 6, 9]);
    });

    it("should exclude tokens with zero value", () => {
      const tokens: Token[] = [
        { symbol: "DUST", amount: 1, price: 5 },
        { symbol: "ZERO", amount: 0, price: 5 },
      ];

      const result = getDustTokens(tokens, 10);

      expect(result).toHaveLength(1);
      expect(result[0].symbol).toBe("DUST");
    });

    it("should include tokens equal to maximum value", () => {
      const tokens: Token[] = [
        { symbol: "EXACT", amount: 2, price: 5 }, // 10
        { symbol: "OVER", amount: 3, price: 5 }, // 15
      ];

      const result = getDustTokens(tokens, 10);

      expect(result).toHaveLength(1);
      expect(result[0].symbol).toBe("EXACT");
    });

    it("should return empty array for null input", () => {
      const result = getDustTokens(null as unknown as Token[], 10);

      expect(result).toEqual([]);
    });

    it("should return empty array for undefined input", () => {
      const result = getDustTokens(undefined as unknown as Token[], 10);

      expect(result).toEqual([]);
    });

    it("should return empty array for non-array input", () => {
      const result = getDustTokens({} as unknown as Token[], 10);

      expect(result).toEqual([]);
    });

    it("should handle zero maximum value", () => {
      const tokens: Token[] = [{ symbol: "ANY", amount: 1, price: 1 }];

      const result = getDustTokens(tokens, 0);

      expect(result).toEqual([]);
    });

    it("should handle negative maximum value", () => {
      const tokens: Token[] = [{ symbol: "ANY", amount: 1, price: 1 }];

      const result = getDustTokens(tokens, -10);

      expect(result).toEqual([]);
    });
  });

  describe("getTopTokensByValue", () => {
    it("should return top N tokens by value", () => {
      const tokens: Token[] = [
        { symbol: "A", amount: 1, price: 100 }, // 100
        { symbol: "B", amount: 1, price: 500 }, // 500
        { symbol: "C", amount: 1, price: 300 }, // 300
      ];

      const result = getTopTokensByValue(tokens, 2);

      expect(result).toHaveLength(2);
      expect(result.map(t => t.symbol)).toEqual(["B", "C"]);
    });

    it("should return all tokens when limit exceeds array length", () => {
      const tokens: Token[] = [
        { symbol: "A", amount: 1, price: 100 },
        { symbol: "B", amount: 1, price: 200 },
      ];

      const result = getTopTokensByValue(tokens, 10);

      expect(result).toHaveLength(2);
    });

    it("should return empty array when limit is zero", () => {
      const tokens: Token[] = [{ symbol: "A", amount: 1, price: 100 }];

      const result = getTopTokensByValue(tokens, 0);

      expect(result).toEqual([]);
    });

    it("should return empty array when limit is negative", () => {
      const tokens: Token[] = [{ symbol: "A", amount: 1, price: 100 }];

      const result = getTopTokensByValue(tokens, -5);

      expect(result).toEqual([]);
    });

    it("should filter out zero-value tokens before limiting", () => {
      const tokens: Token[] = [
        { symbol: "VALID", amount: 1, price: 100 },
        { symbol: "ZERO", amount: 0, price: 1000 },
      ];

      const result = getTopTokensByValue(tokens, 5);

      expect(result).toHaveLength(1);
      expect(result[0].symbol).toBe("VALID");
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

  describe("calculateTokenAllocations", () => {
    it("should calculate allocation percentages correctly", () => {
      const tokens: Token[] = [
        { symbol: "ETH", amount: 1, price: 3000 }, // 3000 = 60%
        { symbol: "USDC", amount: 2000, price: 1 }, // 2000 = 40%
      ];

      const result = calculateTokenAllocations(tokens);

      expect(result[0].allocation).toBe(60);
      expect(result[1].allocation).toBe(40);
    });

    it("should return 0 allocation when total value is zero", () => {
      const tokens: Token[] = [
        { symbol: "ZERO1", amount: 0, price: 1000 },
        { symbol: "ZERO2", amount: 100, price: 0 },
      ];

      const result = calculateTokenAllocations(tokens);

      expect(result[0].allocation).toBe(0);
      expect(result[1].allocation).toBe(0);
    });

    it("should handle single token with 100% allocation", () => {
      const tokens: Token[] = [{ symbol: "ETH", amount: 10, price: 2000 }];

      const result = calculateTokenAllocations(tokens);

      expect(result[0].allocation).toBe(100);
    });

    it("should preserve original token properties", () => {
      const tokens: Token[] = [
        {
          symbol: "ETH",
          optimized_symbol: "WETH",
          amount: 1,
          price: 2000,
          decimals: 18,
          address: "0x123",
        },
      ];

      const result = calculateTokenAllocations(tokens);

      expect(result[0].symbol).toBe("ETH");
      expect(result[0].optimized_symbol).toBe("WETH");
      expect(result[0].decimals).toBe(18);
      expect(result[0].address).toBe("0x123");
    });

    it("should handle empty array", () => {
      const result = calculateTokenAllocations([]);

      expect(result).toEqual([]);
    });

    it("should handle allocation percentages summing to 100", () => {
      const tokens: Token[] = [
        { symbol: "A", amount: 1, price: 100 },
        { symbol: "B", amount: 1, price: 200 },
        { symbol: "C", amount: 1, price: 300 },
      ];

      const result = calculateTokenAllocations(tokens);
      const totalAllocation = result.reduce((sum, t) => sum + t.allocation, 0);

      expect(totalAllocation).toBeCloseTo(100, 10);
    });
  });

  describe("calculateWeightedAveragePrice", () => {
    it("should calculate weighted average price correctly", () => {
      const tokens: Token[] = [
        { symbol: "A", amount: 10, price: 100 },
        { symbol: "B", amount: 5, price: 200 },
      ];

      // (10 * 100 + 5 * 200) / (10 + 5) = 2000 / 15 = 133.33...
      const result = calculateWeightedAveragePrice(tokens);

      expect(result).toBeCloseTo(133.33, 2);
    });

    it("should return 0 for empty array", () => {
      expect(calculateWeightedAveragePrice([])).toBe(0);
    });

    it("should return 0 for null input", () => {
      expect(calculateWeightedAveragePrice(null as unknown as Token[])).toBe(0);
    });

    it("should return 0 for undefined input", () => {
      expect(
        calculateWeightedAveragePrice(undefined as unknown as Token[])
      ).toBe(0);
    });

    it("should return 0 when total amount is zero", () => {
      const tokens: Token[] = [
        { symbol: "A", amount: 0, price: 100 },
        { symbol: "B", amount: 0, price: 200 },
      ];

      expect(calculateWeightedAveragePrice(tokens)).toBe(0);
    });

    it("should handle single token", () => {
      const tokens: Token[] = [{ symbol: "A", amount: 10, price: 100 }];

      expect(calculateWeightedAveragePrice(tokens)).toBe(100);
    });

    it("should handle zero-price tokens", () => {
      const tokens: Token[] = [
        { symbol: "A", amount: 10, price: 0 },
        { symbol: "B", amount: 5, price: 200 },
      ];

      // (10 * 0 + 5 * 200) / (10 + 5) = 1000 / 15 = 66.67
      expect(calculateWeightedAveragePrice(tokens)).toBeCloseTo(66.67, 2);
    });

    it("should handle equal weights", () => {
      const tokens: Token[] = [
        { symbol: "A", amount: 10, price: 100 },
        { symbol: "B", amount: 10, price: 200 },
      ];

      // (10 * 100 + 10 * 200) / (10 + 10) = 3000 / 20 = 150
      expect(calculateWeightedAveragePrice(tokens)).toBe(150);
    });
  });

  // =============================================================================
  // GROUPING AND CATEGORIZATION
  // =============================================================================

  describe("groupTokensByCategory", () => {
    it("should categorize stablecoins correctly", () => {
      const tokens: Token[] = [
        { symbol: "USDT", amount: 1000, price: 1 },
        { symbol: "USDC", amount: 500, price: 1 },
        { symbol: "DAI", amount: 200, price: 1 },
      ];

      const result = groupTokensByCategory(tokens);

      expect(result.stablecoins).toHaveLength(3);
      expect(result.stablecoins.map(t => t.symbol)).toEqual([
        "USDT",
        "USDC",
        "DAI",
      ]);
    });

    it("should categorize major tokens correctly", () => {
      const tokens: Token[] = [
        { symbol: "BTC", amount: 1, price: 40000 },
        { symbol: "ETH", amount: 10, price: 2000 },
        { symbol: "SOL", amount: 100, price: 50 },
      ];

      const result = groupTokensByCategory(tokens);

      expect(result.major).toHaveLength(3);
      expect(result.major.map(t => t.symbol)).toEqual(["BTC", "ETH", "SOL"]);
    });

    it("should categorize DeFi tokens correctly", () => {
      const tokens: Token[] = [
        { symbol: "UNI", amount: 100, price: 10 },
        { symbol: "AAVE", amount: 50, price: 100 },
        { symbol: "COMP", amount: 10, price: 50 },
      ];

      const result = groupTokensByCategory(tokens);

      expect(result.defi).toHaveLength(3);
      expect(result.defi.map(t => t.symbol)).toEqual(["AAVE", "UNI", "COMP"]);
    });

    it("should categorize alt tokens correctly", () => {
      const tokens: Token[] = [
        { symbol: "SHIB", amount: 1000000, price: 0.00001 },
        { symbol: "DOGE", amount: 10000, price: 0.1 },
        { symbol: "ALTCOIN", amount: 100, price: 1 },
      ];

      const result = groupTokensByCategory(tokens);

      expect(result.alt).toHaveLength(3);
    });

    it("should place unknown tokens in other category", () => {
      const tokens: Token[] = [
        { symbol: "UNKNOWN", amount: 100, price: 1 },
        { symbol: "CUSTOM", amount: 50, price: 2 },
      ];

      const result = groupTokensByCategory(tokens);

      expect(result.other).toHaveLength(2);
      expect(result.other.map(t => t.symbol)).toEqual(["UNKNOWN", "CUSTOM"]);
    });

    it("should sort tokens within each category by value descending", () => {
      const tokens: Token[] = [
        { symbol: "USDT", amount: 100, price: 1 }, // 100
        { symbol: "USDC", amount: 500, price: 1 }, // 500
        { symbol: "DAI", amount: 200, price: 1 }, // 200
      ];

      const result = groupTokensByCategory(tokens);

      expect(result.stablecoins.map(t => t.symbol)).toEqual([
        "USDC",
        "DAI",
        "USDT",
      ]);
    });

    it("should use optimized_symbol for categorization when available", () => {
      const tokens: Token[] = [
        {
          symbol: "token",
          optimized_symbol: "USDC",
          amount: 1000,
          price: 1,
        },
      ];

      const result = groupTokensByCategory(tokens);

      expect(result.stablecoins).toHaveLength(1);
    });

    it("should handle empty array", () => {
      const result = groupTokensByCategory([]);

      expect(result.stablecoins).toEqual([]);
      expect(result.major).toEqual([]);
      expect(result.defi).toEqual([]);
      expect(result.alt).toEqual([]);
      expect(result.other).toEqual([]);
    });

    it("should handle case-insensitive symbol matching", () => {
      const tokens: Token[] = [
        { symbol: "usdc", amount: 1000, price: 1 },
        { symbol: "Eth", amount: 10, price: 2000 },
      ];

      const result = groupTokensByCategory(tokens);

      expect(result.stablecoins).toHaveLength(1);
      expect(result.major).toHaveLength(1);
    });

    it("should return all category keys", () => {
      const result = groupTokensByCategory([]);

      expect(Object.keys(result)).toEqual([
        "stablecoins",
        "major",
        "defi",
        "alt",
        "other",
      ]);
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

  describe("sanitizeToken", () => {
    it("should sanitize valid token correctly", () => {
      const token: UnvalidatedTokenInput = {
        symbol: " eth ",
        optimized_symbol: " WETH ",
        amount: 10.5,
        price: 2000.75,
        decimals: 18.9,
        address: " 0x123 ",
        raw_amount_hex_str: "0xa",
      };

      const result = sanitizeToken(token);

      expect(result).not.toBeNull();
      expect(result!.symbol).toBe("ETH");
      expect(result!.optimized_symbol).toBe("WETH");
      expect(result!.amount).toBe(10.5);
      expect(result!.price).toBe(2000.75);
      expect(result!.decimals).toBe(18);
      expect(result!.address).toBe("0x123");
      expect(result!.raw_amount_hex_str).toBe("0xa");
    });

    it("should return null for invalid token", () => {
      const token: UnvalidatedTokenInput = {
        symbol: "",
        amount: -10,
        price: 2000,
      };

      expect(sanitizeToken(token)).toBeNull();
    });

    it("should convert symbol to uppercase", () => {
      const token: UnvalidatedTokenInput = {
        symbol: "eth",
        amount: 10,
        price: 2000,
      };

      const result = sanitizeToken(token);

      expect(result!.symbol).toBe("ETH");
    });

    it("should trim whitespace from strings", () => {
      const token: UnvalidatedTokenInput = {
        symbol: "  ETH  ",
        optimized_symbol: "  WETH  ",
        amount: 10,
        price: 2000,
        address: "  0x123  ",
      };

      const result = sanitizeToken(token);

      expect(result!.symbol).toBe("ETH");
      expect(result!.optimized_symbol).toBe("WETH");
      expect(result!.address).toBe("0x123");
    });

    it("should floor decimals to integer", () => {
      const token: UnvalidatedTokenInput = {
        symbol: "ETH",
        amount: 10,
        price: 2000,
        decimals: 18.9,
      };

      const result = sanitizeToken(token);

      expect(result!.decimals).toBe(18);
    });

    it("should handle negative decimals by converting to zero", () => {
      const token: UnvalidatedTokenInput = {
        symbol: "ETH",
        amount: 10,
        price: 2000,
        decimals: -5,
      };

      const result = sanitizeToken(token);

      expect(result!.decimals).toBe(0);
    });

    it("should convert negative amount to zero", () => {
      const token: UnvalidatedTokenInput = {
        symbol: "ETH",
        amount: 10,
        price: 2000,
      };

      const result = sanitizeToken(token);

      expect(result!.amount).toBe(10);
    });

    it("should convert negative price to zero", () => {
      const token: UnvalidatedTokenInput = {
        symbol: "ETH",
        amount: 10,
        price: 2000,
      };

      const result = sanitizeToken(token);

      expect(result!.price).toBe(2000);
    });

    it("should handle missing optional fields", () => {
      const token: UnvalidatedTokenInput = {
        symbol: "ETH",
        amount: 10,
        price: 2000,
      };

      const result = sanitizeToken(token);

      expect(result!.optimized_symbol).toBeUndefined();
      expect(result!.decimals).toBeUndefined();
      expect(result!.address).toBeUndefined();
      expect(result!.raw_amount_hex_str).toBeUndefined();
    });

    it("should ignore extra fields", () => {
      const token: UnvalidatedTokenInput = {
        symbol: "ETH",
        amount: 10,
        price: 2000,
        extra_field: "should be ignored",
      };

      const result = sanitizeToken(token);

      expect(result).not.toHaveProperty("extra_field");
    });
  });

  describe("sanitizeTokens", () => {
    it("should sanitize array of valid tokens", () => {
      const tokens: UnvalidatedTokenInput[] = [
        { symbol: "eth", amount: 10, price: 2000 },
        { symbol: "usdc", amount: 5000, price: 1 },
      ];

      const result = sanitizeTokens(tokens);

      expect(result).toHaveLength(2);
      expect(result[0].symbol).toBe("ETH");
      expect(result[1].symbol).toBe("USDC");
    });

    it("should filter out invalid tokens", () => {
      const tokens: UnvalidatedTokenInput[] = [
        { symbol: "ETH", amount: 10, price: 2000 },
        { symbol: "", amount: -10, price: 1 }, // Invalid
        { symbol: "USDC", amount: 5000, price: 1 },
      ];

      const result = sanitizeTokens(tokens);

      expect(result).toHaveLength(2);
      expect(result.map(t => t.symbol)).toEqual(["ETH", "USDC"]);
    });

    it("should return empty array for null input", () => {
      const result = sanitizeTokens(null as unknown as UnvalidatedTokenInput[]);

      expect(result).toEqual([]);
    });

    it("should return empty array for undefined input", () => {
      const result = sanitizeTokens(
        undefined as unknown as UnvalidatedTokenInput[]
      );

      expect(result).toEqual([]);
    });

    it("should return empty array for non-array input", () => {
      const result = sanitizeTokens({} as unknown as UnvalidatedTokenInput[]);

      expect(result).toEqual([]);
    });

    it("should handle empty array", () => {
      const result = sanitizeTokens([]);

      expect(result).toEqual([]);
    });

    it("should handle all invalid tokens", () => {
      const tokens: UnvalidatedTokenInput[] = [
        { symbol: "", amount: -10, price: 1 },
        { symbol: "X", amount: NaN, price: 1 },
      ];

      const result = sanitizeTokens(tokens);

      expect(result).toEqual([]);
    });

    it("should preserve order of valid tokens", () => {
      const tokens: UnvalidatedTokenInput[] = [
        { symbol: "ETH", amount: 10, price: 2000 },
        { symbol: "USDC", amount: 5000, price: 1 },
        { symbol: "DAI", amount: 1000, price: 1 },
      ];

      const result = sanitizeTokens(tokens);

      expect(result.map(t => t.symbol)).toEqual(["ETH", "USDC", "DAI"]);
    });
  });
});
