import { beforeEach, describe, expect, it, vi } from "vitest";

import { httpUtils } from "@/lib/http-utils";
import * as tokenService from "@/services/tokenService";

const mockIntentGet = () => vi.spyOn(httpUtils.intentEngine, "get");

describe("tokenService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("getZapTokens", () => {
    it("should fetch tokens for Ethereum (chainId: 1)", async () => {
      const mockResponse = {
        chainId: 1,
        chainName: "Ethereum",
        nativeToken: "ETH",
        tokens: [
          {
            address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
            symbol: "WETH",
            name: "Wrapped Ether",
            decimals: 18,
            logoURI: "https://example.com/weth.png",
            type: "wrapped",
          },
          {
            address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            symbol: "USDC",
            name: "USD Coin",
            decimals: 6,
            logoURI: "https://example.com/usdc.png",
            type: "erc20",
          },
        ],
      };

      const getSpy = mockIntentGet();
      getSpy.mockResolvedValue(mockResponse);

      const result = await tokenService.getZapTokens(1);

      expect(result).toHaveLength(2);
      expect(result[0].chainId).toBe(1);
      expect(result[0].symbol).toBe("WETH");
      expect(result[1].symbol).toBe("USDC");
      expect(getSpy).toHaveBeenCalledWith("/tokens/zap/1");
    });

    it("should fetch tokens for Arbitrum (chainId: 42161)", async () => {
      const mockResponse = {
        chainId: 42161,
        chainName: "Arbitrum One",
        nativeToken: "ETH",
        tokens: [
          {
            address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
            symbol: "WETH",
            name: "Wrapped Ether",
            decimals: 18,
            logoURI: "https://example.com/weth.png",
            type: "wrapped",
          },
          {
            address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
            symbol: "USDT",
            name: "Tether USD",
            decimals: 6,
            logoURI: "https://example.com/usdt.png",
            type: "erc20",
          },
        ],
      };

      const getSpy = mockIntentGet();
      getSpy.mockResolvedValue(mockResponse);

      const result = await tokenService.getZapTokens(42161);

      expect(result).toHaveLength(2);
      expect(result[0].chainId).toBe(42161);
      expect(result[0].symbol).toBe("WETH");
      expect(result[1].symbol).toBe("USDT");
      expect(getSpy).toHaveBeenCalledWith("/tokens/zap/42161");
    });

    it("should fetch tokens for Polygon (chainId: 137)", async () => {
      const mockResponse = {
        chainId: 137,
        chainName: "Polygon",
        nativeToken: "MATIC",
        tokens: [
          {
            address: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
            symbol: "WMATIC",
            name: "Wrapped Matic",
            decimals: 18,
            logoURI: "https://example.com/wmatic.png",
            type: "wrapped",
          },
          {
            address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
            symbol: "USDC",
            name: "USD Coin",
            decimals: 6,
            logoURI: "https://example.com/usdc.png",
            type: "erc20",
          },
        ],
      };

      const getSpy = mockIntentGet();
      getSpy.mockResolvedValue(mockResponse);

      const result = await tokenService.getZapTokens(137);

      expect(result).toHaveLength(2);
      expect(result[0].chainId).toBe(137);
      expect(result[0].symbol).toBe("WMATIC");
      expect(result[1].symbol).toBe("USDC");
      expect(getSpy).toHaveBeenCalledWith("/tokens/zap/137");
    });

    it("should fetch tokens for Base (chainId: 8453)", async () => {
      const mockResponse = {
        chainId: 8453,
        chainName: "Base",
        nativeToken: "ETH",
        tokens: [
          {
            address: "0x4200000000000000000000000000000000000006",
            symbol: "WETH",
            name: "Wrapped Ether",
            decimals: 18,
            logoURI: "https://example.com/weth.png",
            type: "wrapped",
          },
        ],
      };

      const getSpy = mockIntentGet();
      getSpy.mockResolvedValue(mockResponse);

      const result = await tokenService.getZapTokens(8453);

      expect(result).toHaveLength(1);
      expect(result[0].chainId).toBe(8453);
      expect(result[0].symbol).toBe("WETH");
      expect(getSpy).toHaveBeenCalledWith("/tokens/zap/8453");
    });

    it("should handle empty token list", async () => {
      const mockResponse = {
        chainId: 1,
        chainName: "Ethereum",
        nativeToken: "ETH",
        tokens: [],
      };

      const getSpy = mockIntentGet();
      getSpy.mockResolvedValue(mockResponse);

      const result = await tokenService.getZapTokens(1);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it("should handle null response", async () => {
      const getSpy = mockIntentGet();
      getSpy.mockResolvedValue(null);

      const result = await tokenService.getZapTokens(1);

      expect(result).toEqual([]);
    });

    it("should handle response without tokens array", async () => {
      const mockResponse = {
        chainId: 1,
        chainName: "Ethereum",
        nativeToken: "ETH",
      };

      const getSpy = mockIntentGet();
      getSpy.mockResolvedValue(mockResponse);

      const result = await tokenService.getZapTokens(1);

      expect(result).toEqual([]);
    });

    it("should handle invalid chainId", async () => {
      const mockError = {
        status: 400,
        message: "Invalid chain ID",
      };

      const getSpy = mockIntentGet();
      getSpy.mockRejectedValue(mockError);

      await expect(tokenService.getZapTokens(999999)).rejects.toThrow();
    });

    it("should preserve token type metadata", async () => {
      const mockResponse = {
        chainId: 1,
        chainName: "Ethereum",
        nativeToken: "ETH",
        tokens: [
          {
            address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
            symbol: "WETH",
            name: "Wrapped Ether",
            decimals: 18,
            logoURI: "https://example.com/weth.png",
            type: "wrapped",
            nativeVersion: "ETH",
          },
          {
            address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            symbol: "USDC",
            name: "USD Coin",
            decimals: 6,
            logoURI: "https://example.com/usdc.png",
            type: "erc20",
          },
        ],
      };

      const getSpy = mockIntentGet();
      getSpy.mockResolvedValue(mockResponse);

      const result = await tokenService.getZapTokens(1);

      expect(result[0]).toHaveProperty("type", "wrapped");
      expect(result[0]).toHaveProperty("nativeVersion", "ETH");
      expect(result[1]).toHaveProperty("type", "erc20");
    });

    it("should handle native tokens", async () => {
      const mockResponse = {
        chainId: 1,
        chainName: "Ethereum",
        nativeToken: "ETH",
        tokens: [
          {
            address: "0x0000000000000000000000000000000000000000",
            symbol: "ETH",
            name: "Ether",
            decimals: 18,
            logoURI: "https://example.com/eth.png",
            type: "native",
            wrappedVersion: "WETH",
          },
        ],
      };

      const getSpy = mockIntentGet();
      getSpy.mockResolvedValue(mockResponse);

      const result = await tokenService.getZapTokens(1);

      expect(result[0].type).toBe("native");
      expect(result[0]).toHaveProperty("wrappedVersion", "WETH");
    });

    it("should handle tokens with hasDeposit flag", async () => {
      const mockResponse = {
        chainId: 1,
        chainName: "Ethereum",
        nativeToken: "ETH",
        tokens: [
          {
            address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
            symbol: "WETH",
            name: "Wrapped Ether",
            decimals: 18,
            logoURI: "https://example.com/weth.png",
            type: "wrapped",
            hasDeposit: true,
          },
        ],
      };

      const getSpy = mockIntentGet();
      getSpy.mockResolvedValue(mockResponse);

      const result = await tokenService.getZapTokens(1);

      expect(result[0]).toHaveProperty("hasDeposit", true);
    });

    it("should use chainId from response when available", async () => {
      const mockResponse = {
        chainId: 1,
        chainName: "Ethereum",
        nativeToken: "ETH",
        tokens: [
          {
            address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
            symbol: "WETH",
            name: "Wrapped Ether",
            decimals: 18,
            logoURI: "https://example.com/weth.png",
          },
        ],
      };

      const getSpy = mockIntentGet();
      getSpy.mockResolvedValue(mockResponse);

      const result = await tokenService.getZapTokens(1);

      expect(result[0].chainId).toBe(1);
    });

    it("should fallback to request chainId when response chainId is missing", async () => {
      const mockResponse = {
        chainName: "Ethereum",
        nativeToken: "ETH",
        tokens: [
          {
            address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
            symbol: "WETH",
            name: "Wrapped Ether",
            decimals: 18,
            logoURI: "https://example.com/weth.png",
          },
        ],
      };

      const getSpy = mockIntentGet();
      getSpy.mockResolvedValue(mockResponse);

      const result = await tokenService.getZapTokens(1);

      expect(result[0].chainId).toBe(1);
    });

    it("should handle network errors", async () => {
      const getSpy = mockIntentGet();
      getSpy.mockRejectedValue(new Error("Network error"));

      await expect(tokenService.getZapTokens(1)).rejects.toThrow();
    });

    it("should handle timeout errors", async () => {
      const getSpy = mockIntentGet();
      getSpy.mockRejectedValue(new Error("Request timeout"));

      await expect(tokenService.getZapTokens(1)).rejects.toThrow();
    });

    it("should handle large token lists", async () => {
      const tokens = Array.from({ length: 100 }, (_, i) => ({
        address: `0x${i.toString(16).padStart(40, "0")}`,
        symbol: `TOKEN${i}`,
        name: `Test Token ${i}`,
        decimals: 18,
        logoURI: `https://example.com/token${i}.png`,
        type: "erc20" as const,
      }));

      const mockResponse = {
        chainId: 1,
        chainName: "Ethereum",
        nativeToken: "ETH",
        tokens,
      };

      const getSpy = mockIntentGet();
      getSpy.mockResolvedValue(mockResponse);

      const result = await tokenService.getZapTokens(1);

      expect(result).toHaveLength(100);
      expect(result[0].chainId).toBe(1);
      expect(result[99].chainId).toBe(1);
    });

    it("should preserve all token properties", async () => {
      const mockResponse = {
        chainId: 1,
        chainName: "Ethereum",
        nativeToken: "ETH",
        tokens: [
          {
            address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            symbol: "USDC",
            name: "USD Coin",
            decimals: 6,
            logoURI: "https://example.com/usdc.png",
            type: "erc20",
          },
        ],
      };

      const getSpy = mockIntentGet();
      getSpy.mockResolvedValue(mockResponse);

      const result = await tokenService.getZapTokens(1);

      expect(result[0]).toMatchObject({
        address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        symbol: "USDC",
        name: "USD Coin",
        decimals: 6,
        logoURI: "https://example.com/usdc.png",
        chainId: 1,
        type: "erc20",
      });
    });
  });
});
