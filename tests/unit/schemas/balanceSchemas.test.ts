import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import {
    normalizedTokenBalanceSchema,
    safeValidateWalletResponse,
    tokenBalanceRawSchema,
    validateWalletResponseData,
    walletResponseDataSchema
} from "@/schemas/api/balanceSchemas";

describe("balanceSchemas", () => {
  describe("tokenBalanceRawSchema", () => {
    it("validates correct token balance with standard fields", () => {
      const validData = {
        address: "0x123",
        symbol: "ETH",
        name: "Ethereum",
        decimals: 18,
        balance: "1000000000000000000",
        balanceFormatted: 1.0,
        usdValue: 2000,
      };

      expect(() => tokenBalanceRawSchema.parse(validData)).not.toThrow();
    });

    it("validates token balance with alternative field names", () => {
      const validData = {
        tokenAddress: "0x456",
        tokenSymbol: "USDC",
        tokenName: "USD Coin",
        tokenDecimals: 6,
        balance: "1000000",
        usd_value: 1.0,
      };

      expect(() => tokenBalanceRawSchema.parse(validData)).not.toThrow();
    });

    it("validates token balance with snake_case field names", () => {
      const validData = {
        token_address: "0x789",
        token_symbol: "DAI",
        token_name: "Dai Stablecoin",
        token_decimals: "18",
        balance: 1000,
        fiatValue: 1000,
      };

      expect(() => tokenBalanceRawSchema.parse(validData)).not.toThrow();
    });

    it("accepts token balance with minimal fields", () => {
      const minimalData = {
        address: "0xabc",
      };

      expect(() => tokenBalanceRawSchema.parse(minimalData)).not.toThrow();
    });

    it("accepts token balance with metadata fields", () => {
      const dataWithMetadata = {
        address: "0xdef",
        symbol: "ARB",
        fromCache: true,
        isCache: false,
        source: "moralis",
      };

      expect(() => tokenBalanceRawSchema.parse(dataWithMetadata)).not.toThrow();
    });

    it("allows additional fields (passthrough)", () => {
      const dataWithExtra = {
        address: "0x111",
        symbol: "TEST",
        customField: "value",
        anotherField: 123,
      };

      const result = tokenBalanceRawSchema.parse(dataWithExtra);
      expect(result).toHaveProperty("customField", "value");
      expect(result).toHaveProperty("anotherField", 123);
    });
  });

  describe("normalizedTokenBalanceSchema", () => {
    it("validates correct normalized token balance", () => {
      const validData = {
        address: "0x123",
        symbol: "ETH",
        name: "Ethereum",
        decimals: 18,
        rawBalance: "1000000000000000000",
        formattedBalance: 1.0,
        usdValue: 2000,
        balance: 1.0,
      };

      expect(() => normalizedTokenBalanceSchema.parse(validData)).not.toThrow();
    });

    it("validates minimal normalized token balance", () => {
      const minimalData = {
        address: "0x456",
        decimals: null,
        balance: 0,
      };

      expect(() =>
        normalizedTokenBalanceSchema.parse(minimalData)
      ).not.toThrow();
    });

    it("validates normalized token with metadata", () => {
      const dataWithMetadata = {
        address: "0x789",
        decimals: 6,
        balance: 100,
        metadata: {
          fromCache: true,
          source: "intent-engine",
        },
      };

      expect(() =>
        normalizedTokenBalanceSchema.parse(dataWithMetadata)
      ).not.toThrow();
    });

    it("rejects normalized token without required fields", () => {
      const invalidData = {
        symbol: "ETH",
        // missing address, decimals, balance
      };

      expect(() => normalizedTokenBalanceSchema.parse(invalidData)).toThrow(
        ZodError
      );
    });

    it("rejects normalized token with wrong type for balance", () => {
      const invalidData = {
        address: "0xabc",
        decimals: 18,
        balance: "not-a-number", // should be number
      };

      expect(() => normalizedTokenBalanceSchema.parse(invalidData)).toThrow(
        ZodError
      );
    });

    it("rejects normalized token with invalid decimals type", () => {
      const invalidData = {
        address: "0xdef",
        decimals: "18", // should be number or null
        balance: 1.0,
      };

      expect(() => normalizedTokenBalanceSchema.parse(invalidData)).toThrow(
        ZodError
      );
    });
  });

  describe("walletResponseDataSchema", () => {
    it("validates response with new structure (data.balances)", () => {
      const validData = {
        data: {
          balances: [
            {
              address: "0x123",
              symbol: "USDC",
              balance: "1000000",
              decimals: 6,
            },
          ],
          nativeBalance: {
            address: "native",
            symbol: "ETH",
            balance: "1000000000000000000",
            decimals: 18,
          },
        },
        chainId: 1,
        address: "0xwallet",
        fromCache: false,
      };

      expect(() => walletResponseDataSchema.parse(validData)).not.toThrow();
    });

    it("validates response with legacy structure (direct tokens)", () => {
      const validData = {
        tokens: [
          {
            address: "0x456",
            symbol: "DAI",
            balance: "1000",
            decimals: 18,
          },
        ],
        chainId: "1",
        walletAddress: "0xwallet",
        cacheHit: true,
      };

      expect(() => walletResponseDataSchema.parse(validData)).not.toThrow();
    });

    it("validates response with cache metadata", () => {
      const validData = {
        tokens: [],
        fromCache: true,
        isCached: true,
        fetchedAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
        timestamp: "2025-01-01T00:00:00Z",
      };

      expect(() => walletResponseDataSchema.parse(validData)).not.toThrow();
    });

    it("validates empty response", () => {
      const emptyData = {};

      expect(() => walletResponseDataSchema.parse(emptyData)).not.toThrow();
    });

    it("accepts response with additional fields (passthrough)", () => {
      const dataWithExtra = {
        tokens: [],
        chainId: 1,
        customField: "custom",
        metadata: { key: "value" },
      };

      const result = walletResponseDataSchema.parse(dataWithExtra);
      expect(result).toHaveProperty("customField", "custom");
      expect(result).toHaveProperty("metadata");
    });
  });

// walletTokenBalancesSchema tests removed (schema deleted)

  describe("validation helper functions", () => {
    describe("validateWalletResponseData", () => {
      it("returns validated data for valid input", () => {
        const validData = {
          tokens: [],
          chainId: 1,
        };

        const result = validateWalletResponseData(validData);
        expect(result).toEqual(validData);
      });

      it("returns empty object for null input", () => {
        const result = validateWalletResponseData(null);
        expect(result).toEqual({});
      });

      it("returns empty object for undefined input", () => {
        const result = validateWalletResponseData(undefined);
        expect(result).toEqual({});
      });

      it("throws ZodError for invalid input", () => {
        const invalidData = "not-an-object";
        expect(() => validateWalletResponseData(invalidData)).toThrow(ZodError);
      });
    });

    describe("safeValidateWalletResponse", () => {
      it("returns success result for valid input", () => {
        const validData = {
          tokens: [],
          chainId: 1,
        };

        const result = safeValidateWalletResponse(validData);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(validData);
        }
      });

      it("returns error result for invalid input", () => {
        const invalidData = null;

        const result = safeValidateWalletResponse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBeInstanceOf(ZodError);
        }
      });

      it("provides detailed error information on failure", () => {
        const invalidData = {
          data: "not-an-object", // Invalid: data should be object, not string
        };

        const result = safeValidateWalletResponse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBeInstanceOf(ZodError);
          expect(result.error.issues).toBeDefined();
          expect(result.error.issues.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe("error messages", () => {
    it("provides clear error message for missing required field", () => {
      const invalidData = {
        // missing address
        decimals: 18,
        balance: 1.0,
      };

      try {
        normalizedTokenBalanceSchema.parse(invalidData);
        expect.fail("Should have thrown ZodError");
      } catch (error) {
        expect(error).toBeInstanceOf(ZodError);
        if (error instanceof ZodError) {
          expect(error.issues).toBeDefined();
          expect(error.issues.length).toBeGreaterThan(0);
          const addressError = error.issues.find(e =>
            e.path.includes("address")
          );
          expect(addressError).toBeDefined();
        }
      }
    });

    it("provides clear error message for wrong type", () => {
      const invalidData = {
        address: "0x123",
        decimals: 18,
        balance: "not-a-number", // should be number
      };

      try {
        normalizedTokenBalanceSchema.parse(invalidData);
        expect.fail("Should have thrown ZodError");
      } catch (error) {
        expect(error).toBeInstanceOf(ZodError);
        if (error instanceof ZodError) {
          expect(error.issues).toBeDefined();
          expect(error.issues.length).toBeGreaterThan(0);
          const balanceError = error.issues.find(e =>
            e.path.includes("balance")
          );
          expect(balanceError).toBeDefined();
          expect(balanceError?.code).toBe("invalid_type");
        }
      }
    });
  });

  describe("edge cases", () => {
    it("handles null values correctly", () => {
      const dataWithNull = {
        address: "0x123",
        decimals: null, // explicitly null
        balance: 0,
      };

      expect(() =>
        normalizedTokenBalanceSchema.parse(dataWithNull)
      ).not.toThrow();
    });

    it("handles zero values correctly", () => {
      const dataWithZeros = {
        address: "0x456",
        decimals: 0,
        balance: 0,
        formattedBalance: 0,
        usdValue: 0,
      };

      expect(() =>
        normalizedTokenBalanceSchema.parse(dataWithZeros)
      ).not.toThrow();
    });

    it("handles very large numbers", () => {
      const dataWithLargeNumbers = {
        address: "0x789",
        decimals: 18,
        balance: 1e18,
        usdValue: 999999999999,
      };

      expect(() =>
        normalizedTokenBalanceSchema.parse(dataWithLargeNumbers)
      ).not.toThrow();
    });

    it("handles empty strings where allowed", () => {
      const dataWithEmptyStrings = {
        address: "",
        symbol: "",
        name: "",
        balance: "0",
      };

      expect(() =>
        tokenBalanceRawSchema.parse(dataWithEmptyStrings)
      ).not.toThrow();
    });
  });
});
