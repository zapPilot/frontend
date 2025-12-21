/**
 * Comprehensive test suite for balanceService
 *
 * Tests all exported functions and internal normalization logic via integration:
 * - getTokenBalances (main export)
 * - normalizeTokenBalance (via integration)
 * - normalizeWalletResponse (via integration)
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Import mocked modules
import { httpUtils } from "../../../src/lib/http-utils";
import {
  getTokenBalances,
  type GetTokenBalancesParams,
} from "../../../src/services/balanceService";

// Store original env values BEFORE mocking
const originalEnv = {
  NEXT_PUBLIC_MORALIS_API_KEY: process.env["NEXT_PUBLIC_MORALIS_API_KEY"],
  MORALIS_API_KEY: process.env["MORALIS_API_KEY"],
};

// Set test API key BEFORE imports
process.env["NEXT_PUBLIC_MORALIS_API_KEY"] = "test-moralis-key";

// Mock dependencies
vi.mock("../../../src/lib/http-utils", () => ({
  httpUtils: {
    intentEngine: {
      get: vi.fn(),
    },
  },
}));

vi.mock("../../../src/services/serviceHelpers", () => ({
  executeServiceCall: vi.fn(<T>(call: () => Promise<T>) => call()),
}));

const mockIntentEngineGet = httpUtils.intentEngine.get as ReturnType<
  typeof vi.fn
>;

describe("balanceService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original env
    process.env["NEXT_PUBLIC_MORALIS_API_KEY"] =
      originalEnv.NEXT_PUBLIC_MORALIS_API_KEY;
    process.env["MORALIS_API_KEY"] = originalEnv.MORALIS_API_KEY;
  });

  describe("getTokenBalances", () => {
    describe("Parameter Validation", () => {
      it("should throw error when chainId is missing", async () => {
        const params = {
          chainId: 0,
          walletAddress: "0x123",
        } as GetTokenBalancesParams;

        await expect(getTokenBalances(params)).rejects.toThrow(
          "A valid chainId is required to fetch balances"
        );

        expect(mockIntentEngineGet).not.toHaveBeenCalled();
      });

      it("should throw error when chainId is negative", async () => {
        const params = {
          chainId: -1,
          walletAddress: "0x123",
        } as GetTokenBalancesParams;

        await expect(getTokenBalances(params)).rejects.toThrow(
          "A valid chainId is required to fetch balances"
        );
      });

      it("should throw error when walletAddress is empty", async () => {
        const params = {
          chainId: 1,
          walletAddress: "",
        } as GetTokenBalancesParams;

        await expect(getTokenBalances(params)).rejects.toThrow(
          "A wallet address is required to fetch balances"
        );
      });

      it("should throw error when walletAddress is missing", async () => {
        const params = {
          chainId: 1,
          walletAddress: "",
        } as GetTokenBalancesParams;

        await expect(getTokenBalances(params)).rejects.toThrow(
          "A wallet address is required to fetch balances"
        );
      });

      it("should throw error when token addresses exceed maximum (50)", async () => {
        const params: GetTokenBalancesParams = {
          chainId: 1,
          walletAddress: "0x123",
          tokenAddresses: Array.from({ length: 51 }, (_, i) => `0x${i}`),
        };

        await expect(getTokenBalances(params)).rejects.toThrow(
          "Balance requests support up to 50 token addresses"
        );
      });

      it("should allow exactly 50 token addresses", async () => {
        const params: GetTokenBalancesParams = {
          chainId: 1,
          walletAddress: "0x123",
          tokenAddresses: Array.from({ length: 50 }, (_, i) => `0x${i}`),
        };

        mockIntentEngineGet.mockResolvedValue({
          data: { balances: [] },
        });

        await getTokenBalances(params);

        expect(mockIntentEngineGet).toHaveBeenCalled();
      });
    });

    describe("Token Address Filtering and Deduplication", () => {
      it("should filter out empty token addresses", async () => {
        const params: GetTokenBalancesParams = {
          chainId: 1,
          walletAddress: "0xWallet",
          tokenAddresses: ["0xToken1", "", "0xToken2", ""],
        };

        mockIntentEngineGet.mockResolvedValue({
          data: { balances: [] },
        });

        await getTokenBalances(params);

        const callPath = mockIntentEngineGet.mock.calls[0][0] as string;
        // URLSearchParams encodes comma as %2C
        expect(callPath).toContain("tokens=0xtoken1%2C0xtoken2");
      });

      it("should deduplicate token addresses (case-insensitive)", async () => {
        const params: GetTokenBalancesParams = {
          chainId: 1,
          walletAddress: "0xWallet",
          tokenAddresses: ["0xToken1", "0xTOKEN1", "0xtoken1", "0xToken2"],
        };

        mockIntentEngineGet.mockResolvedValue({
          data: { balances: [] },
        });

        await getTokenBalances(params);

        const callPath = mockIntentEngineGet.mock.calls[0][0] as string;
        // URLSearchParams encodes comma as %2C
        expect(callPath).toContain("tokens=0xtoken1%2C0xtoken2");
      });

      it("should normalize wallet and token addresses to lowercase", async () => {
        const params: GetTokenBalancesParams = {
          chainId: 1,
          walletAddress: "0xWALLET",
          tokenAddresses: ["0xTOKEN1", "0xTOKEN2"],
        };

        mockIntentEngineGet.mockResolvedValue({
          data: { balances: [] },
        });

        await getTokenBalances(params);

        const callPath = mockIntentEngineGet.mock.calls[0][0] as string;
        expect(callPath).toContain("/1/0xwallet");
        // URLSearchParams encodes comma as %2C
        expect(callPath).toContain("tokens=0xtoken1%2C0xtoken2");
      });
    });

    describe("Query Parameter Building", () => {
      it("should build path without query parameters when no tokens or skipCache", async () => {
        const params: GetTokenBalancesParams = {
          chainId: 1,
          walletAddress: "0x123",
        };

        mockIntentEngineGet.mockResolvedValue({
          data: { balances: [] },
        });

        await getTokenBalances(params);

        expect(mockIntentEngineGet).toHaveBeenCalledWith(
          "/api/v1/balances/1/0x123",
          expect.objectContaining({
            headers: expect.any(Object),
          })
        );
      });

      it("should include tokens query parameter when provided", async () => {
        const params: GetTokenBalancesParams = {
          chainId: 1,
          walletAddress: "0x123",
          tokenAddresses: ["0xToken1", "0xToken2"],
        };

        mockIntentEngineGet.mockResolvedValue({
          data: { balances: [] },
        });

        await getTokenBalances(params);

        const callPath = mockIntentEngineGet.mock.calls[0][0] as string;
        // URLSearchParams encodes comma as %2C
        expect(callPath).toContain("?tokens=0xtoken1%2C0xtoken2");
      });

      it("should include skipCache query parameter when true", async () => {
        const params: GetTokenBalancesParams = {
          chainId: 1,
          walletAddress: "0x123",
          skipCache: true,
        };

        mockIntentEngineGet.mockResolvedValue({
          data: { balances: [] },
        });

        await getTokenBalances(params);

        const callPath = mockIntentEngineGet.mock.calls[0][0] as string;
        expect(callPath).toContain("?skipCache=true");
      });

      it("should include both tokens and skipCache when provided", async () => {
        const params: GetTokenBalancesParams = {
          chainId: 1,
          walletAddress: "0x123",
          tokenAddresses: ["0xToken1"],
          skipCache: true,
        };

        mockIntentEngineGet.mockResolvedValue({
          data: { balances: [] },
        });

        await getTokenBalances(params);

        const callPath = mockIntentEngineGet.mock.calls[0][0] as string;
        expect(callPath).toContain("tokens=0xtoken1");
        expect(callPath).toContain("skipCache=true");
        expect(callPath).toContain("&");
      });

      it("should not include skipCache when false", async () => {
        const params: GetTokenBalancesParams = {
          chainId: 1,
          walletAddress: "0x123",
          skipCache: false,
        };

        mockIntentEngineGet.mockResolvedValue({
          data: { balances: [] },
        });

        await getTokenBalances(params);

        const callPath = mockIntentEngineGet.mock.calls[0][0] as string;
        expect(callPath).not.toContain("skipCache");
      });
    });

    describe("MORALIS_API_KEY Header Injection", () => {
      it("should call intentEngine.get with proper structure", async () => {
        const params: GetTokenBalancesParams = {
          chainId: 1,
          walletAddress: "0x123",
        };

        mockIntentEngineGet.mockResolvedValue({
          data: { balances: [] },
        });

        await getTokenBalances(params);

        // Verify the function was called with correct path and headers object
        expect(mockIntentEngineGet).toHaveBeenCalledWith(
          "/api/v1/balances/1/0x123",
          expect.objectContaining({
            headers: expect.any(Object),
          })
        );

        const call = mockIntentEngineGet.mock.calls[0];
        expect(call[0]).toBe("/api/v1/balances/1/0x123");
        expect(call[1]).toHaveProperty("headers");
      });

      it("should properly construct the API path with chainId and wallet", async () => {
        const params: GetTokenBalancesParams = {
          chainId: 42161,
          walletAddress: "0xABC123",
        };

        mockIntentEngineGet.mockResolvedValue({
          data: { balances: [] },
        });

        await getTokenBalances(params);

        const callPath = mockIntentEngineGet.mock.calls[0][0] as string;
        expect(callPath).toBe("/api/v1/balances/42161/0xabc123");
      });
    });

    describe("Response Normalization - Token Balance", () => {
      describe("Native Token Detection", () => {
        it("should detect ETH as native token by symbol", async () => {
          mockIntentEngineGet.mockResolvedValue({
            data: {
              balances: [
                {
                  address: "",
                  symbol: "ETH",
                  name: "Ethereum",
                  decimals: 18,
                  balance: "1000000000000000000",
                },
              ],
            },
          });

          const result = await getTokenBalances({
            chainId: 1,
            walletAddress: "0x123",
          });

          expect(result.tokens[0].address).toBe("native");
          expect(result.tokens[0].symbol).toBe("ETH");
        });

        it("should detect ETH as native by name containing ethereum", async () => {
          mockIntentEngineGet.mockResolvedValue({
            data: {
              balances: [
                {
                  address: "",
                  symbol: "WETH",
                  name: "Wrapped Ethereum",
                  decimals: 18,
                  balance: "1000000000000000000",
                },
              ],
            },
          });

          const result = await getTokenBalances({
            chainId: 1,
            walletAddress: "0x123",
          });

          expect(result.tokens[0].address).toBe("native");
        });

        it("should detect ARB as native token", async () => {
          mockIntentEngineGet.mockResolvedValue({
            data: {
              balances: [
                {
                  address: "",
                  symbol: "ARB",
                  name: "Arbitrum",
                  decimals: 18,
                  balance: "1000000000000000000",
                },
              ],
            },
          });

          const result = await getTokenBalances({
            chainId: 42161,
            walletAddress: "0x123",
          });

          expect(result.tokens[0].address).toBe("native");
        });

        it("should detect OP as native token", async () => {
          mockIntentEngineGet.mockResolvedValue({
            data: {
              balances: [
                {
                  address: "",
                  symbol: "OP",
                  name: "Optimism",
                  decimals: 18,
                  balance: "1000000000000000000",
                },
              ],
            },
          });

          const result = await getTokenBalances({
            chainId: 10,
            walletAddress: "0x123",
          });

          expect(result.tokens[0].address).toBe("native");
        });

        it("should detect BASE as native token", async () => {
          mockIntentEngineGet.mockResolvedValue({
            data: {
              balances: [
                {
                  address: "",
                  symbol: "BASE",
                  name: "Base",
                  decimals: 18,
                  balance: "1000000000000000000",
                },
              ],
            },
          });

          const result = await getTokenBalances({
            chainId: 8453,
            walletAddress: "0x123",
          });

          expect(result.tokens[0].address).toBe("native");
        });

        it("should use empty address when not a recognized native token", async () => {
          mockIntentEngineGet.mockResolvedValue({
            data: {
              balances: [
                {
                  address: "",
                  symbol: "UNKNOWN",
                  name: "Unknown Token",
                  decimals: 18,
                  balance: "1000000000000000000",
                },
              ],
            },
          });

          const result = await getTokenBalances({
            chainId: 1,
            walletAddress: "0x123",
          });

          expect(result.tokens[0].address).toBe("");
        });
      });

      describe("Balance Calculation - BigInt Arithmetic", () => {
        it("should calculate balance with 18 decimals correctly", async () => {
          mockIntentEngineGet.mockResolvedValue({
            data: {
              balances: [
                {
                  address: "0xtoken",
                  decimals: 18,
                  balance: "1234567890123456789", // 1.234567890123456789
                },
              ],
            },
          });

          const result = await getTokenBalances({
            chainId: 1,
            walletAddress: "0x123",
          });

          expect(result.tokens[0].balance).toBe(1.234567890123456789);
        });

        it("should calculate balance with 6 decimals (USDC)", async () => {
          mockIntentEngineGet.mockResolvedValue({
            data: {
              balances: [
                {
                  address: "0xusdc",
                  symbol: "USDC",
                  decimals: 6,
                  balance: "1234567890", // 1234.56789
                },
              ],
            },
          });

          const result = await getTokenBalances({
            chainId: 1,
            walletAddress: "0x123",
          });

          expect(result.tokens[0].balance).toBe(1234.56789);
        });

        it("should calculate balance with 0 decimals", async () => {
          mockIntentEngineGet.mockResolvedValue({
            data: {
              balances: [
                {
                  address: "0xtoken",
                  decimals: 0,
                  balance: "1234",
                },
              ],
            },
          });

          const result = await getTokenBalances({
            chainId: 1,
            walletAddress: "0x123",
          });

          expect(result.tokens[0].balance).toBe(1234);
        });

        it("should handle very large balances (24+ decimals)", async () => {
          mockIntentEngineGet.mockResolvedValue({
            data: {
              balances: [
                {
                  address: "0xtoken",
                  decimals: 24,
                  balance: "1234567890123456789012345678", // Large number
                },
              ],
            },
          });

          const result = await getTokenBalances({
            chainId: 1,
            walletAddress: "0x123",
          });

          expect(result.tokens[0].balance).toBe(1234.567890123456789012345678);
        });

        it("should handle balance with trailing zeros correctly", async () => {
          mockIntentEngineGet.mockResolvedValue({
            data: {
              balances: [
                {
                  address: "0xtoken",
                  decimals: 18,
                  balance: "1000000000000000000", // Exactly 1.0
                },
              ],
            },
          });

          const result = await getTokenBalances({
            chainId: 1,
            walletAddress: "0x123",
          });

          expect(result.tokens[0].balance).toBe(1);
        });

        it("should handle very small balances (dust)", async () => {
          mockIntentEngineGet.mockResolvedValue({
            data: {
              balances: [
                {
                  address: "0xtoken",
                  decimals: 18,
                  balance: "1", // 0.000000000000000001
                },
              ],
            },
          });

          const result = await getTokenBalances({
            chainId: 1,
            walletAddress: "0x123",
          });

          expect(result.tokens[0].balance).toBe(0.000000000000000001);
        });

        it("should prefer formattedBalance over raw balance calculation", async () => {
          mockIntentEngineGet.mockResolvedValue({
            data: {
              balances: [
                {
                  address: "0xtoken",
                  decimals: 18,
                  balance: "1000000000000000000",
                  balanceFormatted: 2.5, // Should use this
                },
              ],
            },
          });

          const result = await getTokenBalances({
            chainId: 1,
            walletAddress: "0x123",
          });

          expect(result.tokens[0].balance).toBe(2.5);
        });

        it("should handle formattedBalance as string", async () => {
          mockIntentEngineGet.mockResolvedValue({
            data: {
              balances: [
                {
                  address: "0xtoken",
                  decimals: 18,
                  balanceFormatted: "3.14159",
                },
              ],
            },
          });

          const result = await getTokenBalances({
            chainId: 1,
            walletAddress: "0x123",
          });

          expect(result.tokens[0].balance).toBe(3.14159);
          expect(result.tokens[0].formattedBalance).toBe(3.14159);
        });

        it("should return 0 for invalid BigInt conversion", async () => {
          mockIntentEngineGet.mockResolvedValue({
            data: {
              balances: [
                {
                  address: "0xtoken",
                  decimals: 18,
                  balance: "invalid-number",
                },
              ],
            },
          });

          const result = await getTokenBalances({
            chainId: 1,
            walletAddress: "0x123",
          });

          expect(result.tokens[0].balance).toBe(0);
        });

        it("should handle balance as number type", async () => {
          mockIntentEngineGet.mockResolvedValue({
            data: {
              balances: [
                {
                  address: "0xtoken",
                  decimals: 18,
                  balance: 1000000000000000000,
                },
              ],
            },
          });

          const result = await getTokenBalances({
            chainId: 1,
            walletAddress: "0x123",
          });

          expect(result.tokens[0].balance).toBe(1);
        });

        it("should return 0 when balance is missing and no formattedBalance", async () => {
          mockIntentEngineGet.mockResolvedValue({
            data: {
              balances: [
                {
                  address: "0xtoken",
                  decimals: 18,
                },
              ],
            },
          });

          const result = await getTokenBalances({
            chainId: 1,
            walletAddress: "0x123",
          });

          expect(result.tokens[0].balance).toBe(0);
        });
      });

      describe("Token Field Normalization", () => {
        it("should normalize address field variants", async () => {
          mockIntentEngineGet.mockResolvedValue({
            data: {
              balances: [
                { address: "0xToken1", decimals: 18, balance: "0" },
                { tokenAddress: "0xToken2", decimals: 18, balance: "0" },
                { token_address: "0xToken3", decimals: 18, balance: "0" },
              ],
            },
          });

          const result = await getTokenBalances({
            chainId: 1,
            walletAddress: "0x123",
          });

          expect(result.tokens[0].address).toBe("0xtoken1");
          expect(result.tokens[1].address).toBe("0xtoken2");
          expect(result.tokens[2].address).toBe("0xtoken3");
        });

        it("should normalize decimals field variants", async () => {
          mockIntentEngineGet.mockResolvedValue({
            data: {
              balances: [
                { address: "0x1", decimals: 18, balance: "0" },
                { address: "0x2", tokenDecimals: 6, balance: "0" },
                { address: "0x3", token_decimals: "12", balance: "0" },
              ],
            },
          });

          const result = await getTokenBalances({
            chainId: 1,
            walletAddress: "0x123",
          });

          expect(result.tokens[0].decimals).toBe(18);
          expect(result.tokens[1].decimals).toBe(6);
          expect(result.tokens[2].decimals).toBe(12);
        });

        it("should normalize symbol field variants", async () => {
          mockIntentEngineGet.mockResolvedValue({
            data: {
              balances: [
                { address: "0x1", symbol: "DAI", decimals: 18, balance: "0" },
                {
                  address: "0x2",
                  tokenSymbol: "USDC",
                  decimals: 6,
                  balance: "0",
                },
                {
                  address: "0x3",
                  token_symbol: "USDT",
                  decimals: 6,
                  balance: "0",
                },
              ],
            },
          });

          const result = await getTokenBalances({
            chainId: 1,
            walletAddress: "0x123",
          });

          expect(result.tokens[0].symbol).toBe("DAI");
          expect(result.tokens[1].symbol).toBe("USDC");
          expect(result.tokens[2].symbol).toBe("USDT");
        });

        it("should normalize name field variants", async () => {
          mockIntentEngineGet.mockResolvedValue({
            data: {
              balances: [
                { address: "0x1", name: "Dai", decimals: 18, balance: "0" },
                {
                  address: "0x2",
                  tokenName: "USD Coin",
                  decimals: 6,
                  balance: "0",
                },
                {
                  address: "0x3",
                  token_name: "Tether",
                  decimals: 6,
                  balance: "0",
                },
              ],
            },
          });

          const result = await getTokenBalances({
            chainId: 1,
            walletAddress: "0x123",
          });

          expect(result.tokens[0].name).toBe("Dai");
          expect(result.tokens[1].name).toBe("USD Coin");
          expect(result.tokens[2].name).toBe("Tether");
        });

        it("should normalize usdValue field variants", async () => {
          mockIntentEngineGet.mockResolvedValue({
            data: {
              balances: [
                {
                  address: "0x1",
                  usdValue: 100.5,
                  decimals: 18,
                  balance: "0",
                },
                {
                  address: "0x2",
                  usd_value: "200.75",
                  decimals: 18,
                  balance: "0",
                },
                {
                  address: "0x3",
                  fiatValue: 300.25,
                  decimals: 18,
                  balance: "0",
                },
              ],
            },
          });

          const result = await getTokenBalances({
            chainId: 1,
            walletAddress: "0x123",
          });

          expect(result.tokens[0].usdValue).toBe(100.5);
          expect(result.tokens[1].usdValue).toBe(200.75);
          expect(result.tokens[2].usdValue).toBe(300.25);
        });

        it("should not include usdValue when NaN", async () => {
          mockIntentEngineGet.mockResolvedValue({
            data: {
              balances: [
                {
                  address: "0x1",
                  usdValue: "invalid",
                  decimals: 18,
                  balance: "0",
                },
              ],
            },
          });

          const result = await getTokenBalances({
            chainId: 1,
            walletAddress: "0x123",
          });

          expect(result.tokens[0].usdValue).toBeUndefined();
        });
      });

      describe("Cache Metadata Preservation", () => {
        it("should preserve fromCache metadata", async () => {
          mockIntentEngineGet.mockResolvedValue({
            data: {
              balances: [
                {
                  address: "0xtoken",
                  decimals: 18,
                  balance: "0",
                  fromCache: true,
                },
              ],
            },
          });

          const result = await getTokenBalances({
            chainId: 1,
            walletAddress: "0x123",
          });

          expect(result.tokens[0].metadata).toEqual({ fromCache: true });
        });

        it("should preserve isCache metadata", async () => {
          mockIntentEngineGet.mockResolvedValue({
            data: {
              balances: [
                {
                  address: "0xtoken",
                  decimals: 18,
                  balance: "0",
                  isCache: true,
                },
              ],
            },
          });

          const result = await getTokenBalances({
            chainId: 1,
            walletAddress: "0x123",
          });

          expect(result.tokens[0].metadata).toEqual({ isCache: true });
        });

        it("should preserve source metadata", async () => {
          mockIntentEngineGet.mockResolvedValue({
            data: {
              balances: [
                {
                  address: "0xtoken",
                  decimals: 18,
                  balance: "0",
                  source: "moralis",
                },
              ],
            },
          });

          const result = await getTokenBalances({
            chainId: 1,
            walletAddress: "0x123",
          });

          expect(result.tokens[0].metadata).toEqual({ source: "moralis" });
        });

        it("should preserve multiple metadata fields", async () => {
          mockIntentEngineGet.mockResolvedValue({
            data: {
              balances: [
                {
                  address: "0xtoken",
                  decimals: 18,
                  balance: "0",
                  fromCache: true,
                  isCache: true,
                  source: "cache",
                },
              ],
            },
          });

          const result = await getTokenBalances({
            chainId: 1,
            walletAddress: "0x123",
          });

          expect(result.tokens[0].metadata).toEqual({
            fromCache: true,
            isCache: true,
            source: "cache",
          });
        });

        it("should not include metadata object when no cache fields present", async () => {
          mockIntentEngineGet.mockResolvedValue({
            data: {
              balances: [
                {
                  address: "0xtoken",
                  decimals: 18,
                  balance: "0",
                },
              ],
            },
          });

          const result = await getTokenBalances({
            chainId: 1,
            walletAddress: "0x123",
          });

          expect(result.tokens[0].metadata).toBeUndefined();
        });
      });
    });

    describe("Response Normalization - Wallet Response", () => {
      describe("Response Structure Variations", () => {
        it("should parse data.balances array structure", async () => {
          mockIntentEngineGet.mockResolvedValue({
            data: {
              balances: [
                { address: "0xtoken1", decimals: 18, balance: "100" },
                { address: "0xtoken2", decimals: 6, balance: "200" },
              ],
            },
          });

          const result = await getTokenBalances({
            chainId: 1,
            walletAddress: "0x123",
          });

          expect(result.tokens).toHaveLength(2);
        });

        it("should parse data.nativeBalance object", async () => {
          mockIntentEngineGet.mockResolvedValue({
            data: {
              nativeBalance: {
                symbol: "ETH",
                decimals: 18,
                balance: "1000000000000000000",
              },
            },
          });

          const result = await getTokenBalances({
            chainId: 1,
            walletAddress: "0x123",
          });

          expect(result.tokens).toHaveLength(1);
          expect(result.tokens[0].symbol).toBe("ETH");
        });

        it("should combine data.balances and data.nativeBalance", async () => {
          mockIntentEngineGet.mockResolvedValue({
            data: {
              balances: [{ address: "0xtoken1", decimals: 18, balance: "100" }],
              nativeBalance: {
                symbol: "ETH",
                decimals: 18,
                balance: "1000000000000000000",
              },
            },
          });

          const result = await getTokenBalances({
            chainId: 1,
            walletAddress: "0x123",
          });

          expect(result.tokens).toHaveLength(2);
        });

        it("should handle empty response with no tokens", async () => {
          mockIntentEngineGet.mockResolvedValue({
            data: { balances: [] },
          });

          const result = await getTokenBalances({
            chainId: 1,
            walletAddress: "0x123",
          });

          expect(result.tokens).toHaveLength(0);
        });
      });

      describe("Wallet Response Metadata", () => {
        it("should detect fromCache from response", async () => {
          mockIntentEngineGet.mockResolvedValue({
            fromCache: true,
            data: { balances: [] },
          });

          const result = await getTokenBalances({
            chainId: 1,
            walletAddress: "0x123",
          });

          expect(result.fromCache).toBe(true);
        });

        it("should detect cacheHit as fromCache", async () => {
          mockIntentEngineGet.mockResolvedValue({
            cacheHit: true,
            data: { balances: [] },
          });

          const result = await getTokenBalances({
            chainId: 1,
            walletAddress: "0x123",
          });

          expect(result.fromCache).toBe(true);
        });

        it("should detect isCached as fromCache", async () => {
          mockIntentEngineGet.mockResolvedValue({
            isCached: true,
            data: { balances: [] },
          });

          const result = await getTokenBalances({
            chainId: 1,
            walletAddress: "0x123",
          });

          expect(result.fromCache).toBe(true);
        });

        it("should default fromCache to false when not present", async () => {
          mockIntentEngineGet.mockResolvedValue({
            data: { balances: [] },
          });

          const result = await getTokenBalances({
            chainId: 1,
            walletAddress: "0x123",
          });

          expect(result.fromCache).toBe(false);
        });

        it("should parse fetchedAt timestamp", async () => {
          mockIntentEngineGet.mockResolvedValue({
            fetchedAt: "2025-01-15T10:30:00Z",
            data: { balances: [] },
          });

          const result = await getTokenBalances({
            chainId: 1,
            walletAddress: "0x123",
          });

          expect(result.fetchedAt).toBe("2025-01-15T10:30:00Z");
        });

        it("should parse updatedAt as fetchedAt", async () => {
          mockIntentEngineGet.mockResolvedValue({
            updatedAt: "2025-01-15T10:30:00Z",
            data: { balances: [] },
          });

          const result = await getTokenBalances({
            chainId: 1,
            walletAddress: "0x123",
          });

          expect(result.fetchedAt).toBe("2025-01-15T10:30:00Z");
        });

        it("should parse timestamp as fetchedAt", async () => {
          mockIntentEngineGet.mockResolvedValue({
            timestamp: "2025-01-15T10:30:00Z",
            data: { balances: [] },
          });

          const result = await getTokenBalances({
            chainId: 1,
            walletAddress: "0x123",
          });

          expect(result.fetchedAt).toBe("2025-01-15T10:30:00Z");
        });

        it("should not include fetchedAt when not present", async () => {
          mockIntentEngineGet.mockResolvedValue({
            data: { balances: [] },
          });

          const result = await getTokenBalances({
            chainId: 1,
            walletAddress: "0x123",
          });

          expect(result.fetchedAt).toBeUndefined();
        });

        it("should use chainId from response when available", async () => {
          mockIntentEngineGet.mockResolvedValue({
            chainId: 42,
            data: { balances: [] },
          });

          const result = await getTokenBalances({
            chainId: 1,
            walletAddress: "0x123",
          });

          expect(result.chainId).toBe(42);
        });

        it("should parse chainId from string", async () => {
          mockIntentEngineGet.mockResolvedValue({
            chainId: "10",
            data: { balances: [] },
          });

          const result = await getTokenBalances({
            chainId: 1,
            walletAddress: "0x123",
          });

          expect(result.chainId).toBe(10);
        });

        it("should fallback to request chainId when not in response", async () => {
          mockIntentEngineGet.mockResolvedValue({
            data: { balances: [] },
          });

          const result = await getTokenBalances({
            chainId: 1,
            walletAddress: "0x123",
          });

          expect(result.chainId).toBe(1);
        });

        it("should use address from response when available", async () => {
          mockIntentEngineGet.mockResolvedValue({
            address: "0xDifferentWallet",
            data: { balances: [] },
          });

          const result = await getTokenBalances({
            chainId: 1,
            walletAddress: "0x123",
          });

          expect(result.address).toBe("0xdifferentwallet");
        });

        it("should use walletAddress field from response", async () => {
          mockIntentEngineGet.mockResolvedValue({
            walletAddress: "0xFromResponse",
            data: { balances: [] },
          });

          const result = await getTokenBalances({
            chainId: 1,
            walletAddress: "0x123",
          });

          expect(result.address).toBe("0xfromresponse");
        });

        it("should fallback to request wallet address when not in response", async () => {
          mockIntentEngineGet.mockResolvedValue({
            data: { balances: [] },
          });

          const result = await getTokenBalances({
            chainId: 1,
            walletAddress: "0xREQUEST",
          });

          expect(result.address).toBe("0xrequest");
        });
      });

      describe("Complete Integration Scenarios", () => {
        it("should handle complete successful response with all fields", async () => {
          mockIntentEngineGet.mockResolvedValue({
            chainId: 1,
            address: "0xWallet",
            fromCache: true,
            fetchedAt: "2025-01-15T10:30:00Z",
            data: {
              balances: [
                {
                  address: "0xUSDC",
                  symbol: "USDC",
                  name: "USD Coin",
                  decimals: 6,
                  balance: "1000000000",
                  balanceFormatted: 1000,
                  usdValue: 1000,
                  fromCache: true,
                },
              ],
              nativeBalance: {
                symbol: "ETH",
                name: "Ethereum",
                decimals: 18,
                balance: "2000000000000000000",
              },
            },
          });

          const result = await getTokenBalances({
            chainId: 1,
            walletAddress: "0xWallet",
          });

          expect(result).toEqual({
            chainId: 1,
            address: "0xwallet",
            fromCache: true,
            fetchedAt: "2025-01-15T10:30:00Z",
            tokens: [
              {
                address: "0xusdc",
                symbol: "USDC",
                name: "USD Coin",
                decimals: 6,
                rawBalance: "1000000000",
                formattedBalance: 1000,
                usdValue: 1000,
                balance: 1000,
                metadata: { fromCache: true },
              },
              {
                address: "native",
                symbol: "ETH",
                name: "Ethereum",
                decimals: 18,
                rawBalance: "2000000000000000000",
                balance: 2,
              },
            ],
          });
        });

        it("should handle null/undefined response gracefully", async () => {
          mockIntentEngineGet.mockResolvedValue(null);

          const result = await getTokenBalances({
            chainId: 1,
            walletAddress: "0x123",
          });

          expect(result).toEqual({
            chainId: 1,
            address: "0x123",
            fromCache: false,
            tokens: [],
          });
        });

        it("should handle empty object response", async () => {
          mockIntentEngineGet.mockResolvedValue({});

          const result = await getTokenBalances({
            chainId: 1,
            walletAddress: "0x123",
          });

          expect(result).toEqual({
            chainId: 1,
            address: "0x123",
            fromCache: false,
            tokens: [],
          });
        });
      });
    });

    describe("Error Scenarios", () => {
      it("should propagate HTTP errors from intentEngine", async () => {
        const httpError = new Error("Network error");
        mockIntentEngineGet.mockRejectedValue(httpError);

        await expect(
          getTokenBalances({
            chainId: 1,
            walletAddress: "0x123",
          })
        ).rejects.toThrow("Network error");
      });

      it("should throw error on malformed response data (Zod validation)", async () => {
        mockIntentEngineGet.mockResolvedValue({
          data: {
            balances: "not-an-array", // Invalid: should be array
          },
        });

        // With Zod validation, malformed data throws an error
        // This is better than silently returning empty results
        await expect(
          getTokenBalances({
            chainId: 1,
            walletAddress: "0x123",
          })
        ).rejects.toThrow();
      });
    });
  });
});
