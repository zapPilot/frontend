import { describe, it, expect, vi, beforeEach } from "vitest";
import { httpUtils } from "@/lib/http-utils";
import * as priceService from "@/services/priceService";
import type { TokenPriceData } from "@/services/priceService";

// Mock HTTP utilities
vi.mock("@/lib/http-utils", () => ({
  httpUtils: {
    intentEngine: {
      get: vi.fn(),
    },
  },
}));

// Mock string utils
vi.mock("@/lib/stringUtils", () => ({
  normalizeSymbol: (s: string) => s.trim().toUpperCase(),
  normalizeSymbols: (arr: string[]) =>
    arr
      .map(s => s.trim().toUpperCase())
      .filter((s, i, a) => a.indexOf(s) === i),
}));

describe("priceService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getTokenPrices", () => {
    it("should fetch multiple token prices successfully", async () => {
      const mockResponse = {
        results: {
          btc: {
            symbol: "btc",
            price: 50000,
            provider: "coingecko",
            timestamp: "2024-01-01T00:00:00Z",
            fromCache: false,
          },
          eth: {
            symbol: "eth",
            price: 3000,
            provider: "coingecko",
            timestamp: "2024-01-01T00:00:00Z",
            fromCache: true,
          },
        },
        errors: [],
        totalRequested: 2,
        fromCache: 1,
        fromProviders: 1,
        failed: 0,
        timestamp: "2024-01-01T00:00:00Z",
      };

      vi.mocked(httpUtils.intentEngine.get).mockResolvedValue(mockResponse);

      const result = await priceService.getTokenPrices(["BTC", "ETH"]);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        symbol: "btc",
        price: 50000,
        success: true,
      });
      expect(result[1]).toMatchObject({
        symbol: "eth",
        price: 3000,
        success: true,
        fromCache: true,
      });
    });

    it("should handle empty array input", async () => {
      const result = await priceService.getTokenPrices([]);

      expect(result).toEqual([]);
      expect(httpUtils.intentEngine.get).not.toHaveBeenCalled();
    });

    it("should deduplicate symbols", async () => {
      const mockResponse = {
        results: {
          btc: {
            symbol: "btc",
            price: 50000,
            provider: "coingecko",
            timestamp: "2024-01-01T00:00:00Z",
            fromCache: false,
          },
        },
        errors: [],
        totalRequested: 1,
        fromCache: 0,
        fromProviders: 1,
        failed: 0,
        timestamp: "2024-01-01T00:00:00Z",
      };

      vi.mocked(httpUtils.intentEngine.get).mockResolvedValue(mockResponse);

      const result = await priceService.getTokenPrices(["BTC", "btc", "BTC"]);

      expect(result).toHaveLength(1);
      expect(httpUtils.intentEngine.get).toHaveBeenCalledWith(
        expect.stringContaining("btc")
      );
    });

    it("should handle partial failures", async () => {
      const mockResponse = {
        results: {
          btc: {
            symbol: "btc",
            price: 50000,
            provider: "coingecko",
            timestamp: "2024-01-01T00:00:00Z",
            fromCache: false,
          },
        },
        errors: ["invalid"],
        totalRequested: 2,
        fromCache: 0,
        fromProviders: 1,
        failed: 1,
        timestamp: "2024-01-01T00:00:00Z",
      };

      vi.mocked(httpUtils.intentEngine.get).mockResolvedValue(mockResponse);

      const result = await priceService.getTokenPrices(["BTC", "INVALID"]);

      expect(result).toHaveLength(2);
      expect(result[0].success).toBe(true);
      expect(result[1].success).toBe(false);
      expect(result[1].error).toContain("unavailable");
    });

    it("should handle all symbols failing", async () => {
      const mockResponse = {
        results: {},
        errors: ["btc", "eth"],
        totalRequested: 2,
        fromCache: 0,
        fromProviders: 0,
        failed: 2,
        timestamp: "2024-01-01T00:00:00Z",
      };

      vi.mocked(httpUtils.intentEngine.get).mockResolvedValue(mockResponse);

      const result = await priceService.getTokenPrices(["BTC", "ETH"]);

      expect(result).toHaveLength(2);
      expect(result.every(r => !r.success)).toBe(true);
    });

    it("should handle invalid API response", async () => {
      vi.mocked(httpUtils.intentEngine.get).mockResolvedValue(null);

      const result = await priceService.getTokenPrices(["BTC"]);

      expect(result).toHaveLength(1);
      expect(result[0].success).toBe(false);
      expect(result[0].error).toContain("Invalid response");
    });

    it("should preserve metadata when available", async () => {
      const mockResponse = {
        results: {
          btc: {
            symbol: "btc",
            price: 50000,
            provider: "coingecko",
            timestamp: "2024-01-01T00:00:00Z",
            fromCache: false,
            metadata: {
              marketCap: 1000000000,
              volume24h: 50000000,
              percentChange24h: 2.5,
            },
          },
        },
        errors: [],
        totalRequested: 1,
        fromCache: 0,
        fromProviders: 1,
        failed: 0,
        timestamp: "2024-01-01T00:00:00Z",
      };

      vi.mocked(httpUtils.intentEngine.get).mockResolvedValue(mockResponse);

      const result = await priceService.getTokenPrices(["BTC"]);

      expect(result[0].metadata).toBeDefined();
      expect(result[0].metadata?.marketCap).toBe(1000000000);
      expect(result[0].metadata?.percentChange24h).toBe(2.5);
    });

    it("should handle network errors", async () => {
      vi.mocked(httpUtils.intentEngine.get).mockRejectedValue(
        new Error("Network error")
      );

      await expect(priceService.getTokenPrices(["BTC"])).rejects.toThrow();
    });
  });

  describe("getTokenPrice", () => {
    it("should fetch single token price successfully", async () => {
      const mockResponse = {
        success: true,
        price: 50000,
        symbol: "btc",
        provider: "coingecko",
        timestamp: "2024-01-01T00:00:00Z",
        fromCache: false,
      };

      vi.mocked(httpUtils.intentEngine.get).mockResolvedValue(mockResponse);

      const result = await priceService.getTokenPrice("BTC");

      expect(result).toMatchObject({
        symbol: "btc",
        price: 50000,
        success: true,
      });
      expect(httpUtils.intentEngine.get).toHaveBeenCalledWith(
        "/tokens/price/btc"
      );
    });

    it("should handle empty symbol", async () => {
      const result = await priceService.getTokenPrice("");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid symbol");
      expect(httpUtils.intentEngine.get).not.toHaveBeenCalled();
    });

    it("should handle whitespace-only symbol", async () => {
      const result = await priceService.getTokenPrice("   ");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid symbol");
    });

    it("should normalize symbol case", async () => {
      const mockResponse = {
        success: true,
        price: 50000,
        symbol: "btc",
        provider: "coingecko",
        timestamp: "2024-01-01T00:00:00Z",
        fromCache: false,
      };

      vi.mocked(httpUtils.intentEngine.get).mockResolvedValue(mockResponse);

      await priceService.getTokenPrice("btc");

      expect(httpUtils.intentEngine.get).toHaveBeenCalledWith(
        "/tokens/price/btc"
      );
    });

    it("should handle failed price fetch", async () => {
      const mockResponse = {
        success: false,
        price: 0,
        symbol: "btc",
        provider: "coingecko",
        timestamp: "2024-01-01T00:00:00Z",
        fromCache: false,
      };

      vi.mocked(httpUtils.intentEngine.get).mockResolvedValue(mockResponse);

      const result = await priceService.getTokenPrice("BTC");

      expect(result.success).toBe(false);
      expect(result.price).toBeNull();
      expect(result.error).toContain("unavailable");
    });

    it("should preserve metadata", async () => {
      const mockResponse = {
        success: true,
        price: 50000,
        symbol: "btc",
        provider: "coingecko",
        timestamp: "2024-01-01T00:00:00Z",
        fromCache: true,
        metadata: {
          marketCap: 1000000000,
          volume24h: 50000000,
        },
      };

      vi.mocked(httpUtils.intentEngine.get).mockResolvedValue(mockResponse);

      const result = await priceService.getTokenPrice("BTC");

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.marketCap).toBe(1000000000);
      expect(result.fromCache).toBe(true);
    });

    it("should handle network errors", async () => {
      vi.mocked(httpUtils.intentEngine.get).mockRejectedValue(
        new Error("Network error")
      );

      await expect(priceService.getTokenPrice("BTC")).rejects.toThrow();
    });

    it("should handle null response", async () => {
      vi.mocked(httpUtils.intentEngine.get).mockResolvedValue(null);

      const result = await priceService.getTokenPrice("BTC");

      expect(result.success).toBe(false);
      expect(result.error).toContain("unavailable");
    });
  });

  describe("getSuccessfulPrices", () => {
    it("should filter successful prices", () => {
      const prices: TokenPriceData[] = [
        {
          symbol: "btc",
          price: 50000,
          success: true,
          timestamp: "2024-01-01T00:00:00Z",
          fromCache: false,
        },
        {
          symbol: "eth",
          price: null,
          success: false,
          timestamp: "2024-01-01T00:00:00Z",
          fromCache: false,
        },
        {
          symbol: "usdc",
          price: 1,
          success: true,
          timestamp: "2024-01-01T00:00:00Z",
          fromCache: true,
        },
      ];

      const result = priceService.getSuccessfulPrices(prices);

      expect(result).toHaveLength(2);
      expect(result.every(p => p.success && p.price !== null)).toBe(true);
    });

    it("should return empty array when all fail", () => {
      const prices: TokenPriceData[] = [
        {
          symbol: "btc",
          price: null,
          success: false,
          timestamp: "2024-01-01T00:00:00Z",
          fromCache: false,
        },
      ];

      const result = priceService.getSuccessfulPrices(prices);

      expect(result).toEqual([]);
    });

    it("should handle empty input", () => {
      const result = priceService.getSuccessfulPrices([]);

      expect(result).toEqual([]);
    });
  });

  describe("createPriceLookup", () => {
    it("should create price lookup map", () => {
      const prices: TokenPriceData[] = [
        {
          symbol: "btc",
          price: 50000,
          success: true,
          timestamp: "2024-01-01T00:00:00Z",
          fromCache: false,
        },
        {
          symbol: "eth",
          price: 3000,
          success: true,
          timestamp: "2024-01-01T00:00:00Z",
          fromCache: false,
        },
      ];

      const lookup = priceService.createPriceLookup(prices);

      expect(lookup.size).toBe(2);
      expect(lookup.get("btc")?.price).toBe(50000);
      expect(lookup.get("eth")?.price).toBe(3000);
    });

    it("should normalize symbols to lowercase in map", () => {
      const prices: TokenPriceData[] = [
        {
          symbol: "BTC",
          price: 50000,
          success: true,
          timestamp: "2024-01-01T00:00:00Z",
          fromCache: false,
        },
      ];

      const lookup = priceService.createPriceLookup(prices);

      expect(lookup.get("btc")).toBeDefined();
    });

    it("should handle empty array", () => {
      const lookup = priceService.createPriceLookup([]);

      expect(lookup.size).toBe(0);
    });
  });

  describe("calculateTotalValue", () => {
    it("should calculate total value correctly", () => {
      const amounts = new Map([
        ["btc", 2],
        ["eth", 10],
      ]);

      const prices: TokenPriceData[] = [
        {
          symbol: "btc",
          price: 50000,
          success: true,
          timestamp: "2024-01-01T00:00:00Z",
          fromCache: false,
        },
        {
          symbol: "eth",
          price: 3000,
          success: true,
          timestamp: "2024-01-01T00:00:00Z",
          fromCache: false,
        },
      ];

      const total = priceService.calculateTotalValue(amounts, prices);

      expect(total).toBe(130000); // (2 * 50000) + (10 * 3000)
    });

    it("should return null when price is missing", () => {
      const amounts = new Map([
        ["btc", 2],
        ["unknown", 10],
      ]);

      const prices: TokenPriceData[] = [
        {
          symbol: "btc",
          price: 50000,
          success: true,
          timestamp: "2024-01-01T00:00:00Z",
          fromCache: false,
        },
      ];

      const total = priceService.calculateTotalValue(amounts, prices);

      expect(total).toBeNull();
    });

    it("should return null when price fetch failed", () => {
      const amounts = new Map([["btc", 2]]);

      const prices: TokenPriceData[] = [
        {
          symbol: "btc",
          price: null,
          success: false,
          timestamp: "2024-01-01T00:00:00Z",
          fromCache: false,
        },
      ];

      const total = priceService.calculateTotalValue(amounts, prices);

      expect(total).toBeNull();
    });

    it("should handle empty amounts", () => {
      const amounts = new Map();
      const prices: TokenPriceData[] = [];

      const total = priceService.calculateTotalValue(amounts, prices);

      expect(total).toBe(0);
    });

    it("should handle case-insensitive symbol matching", () => {
      const amounts = new Map([["BTC", 2]]);

      const prices: TokenPriceData[] = [
        {
          symbol: "btc",
          price: 50000,
          success: true,
          timestamp: "2024-01-01T00:00:00Z",
          fromCache: false,
        },
      ];

      const total = priceService.calculateTotalValue(amounts, prices);

      expect(total).toBe(100000);
    });

    it("should handle fractional amounts", () => {
      const amounts = new Map([["eth", 1.5]]);

      const prices: TokenPriceData[] = [
        {
          symbol: "eth",
          price: 3000,
          success: true,
          timestamp: "2024-01-01T00:00:00Z",
          fromCache: false,
        },
      ];

      const total = priceService.calculateTotalValue(amounts, prices);

      expect(total).toBe(4500);
    });
  });
});
