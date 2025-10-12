import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  handleWalletError,
  transformWalletData,
  validateWalletAddress,
} from "../../../src/services/userService";
import { UserCryptoWallet } from "../../../src/types/user.types";

// Mock the HTTP utils module
vi.mock("../../../src/lib/http-utils", () => ({
  httpUtils: {
    accountApi: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
    analyticsEngine: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
    backendApi: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
    intentEngine: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
    debank: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
  },
  httpRequest: vi.fn(),
  httpGet: vi.fn(),
  httpPost: vi.fn(),
  httpPut: vi.fn(),
  httpPatch: vi.fn(),
  httpDelete: vi.fn(),
  APIError: class APIError extends Error {
    constructor(
      message: string,
      public status: number,
      public code?: string,
      public details?: any
    ) {
      super(message);
      this.name = "APIError";
    }
  },
  NetworkError: class NetworkError extends Error {
    constructor(message: string = "Network connection failed") {
      super(message);
      this.name = "NetworkError";
    }
  },
  TimeoutError: class TimeoutError extends Error {
    constructor(message: string = "Request timed out") {
      super(message);
      this.name = "TimeoutError";
    }
  },
  handleHTTPError: vi
    .fn()
    .mockReturnValue("An unexpected error occurred. Please try again."),
}));

// No longer needed - userService now uses handleHTTPError from http-utils

// Mock the account service module to provide AccountServiceError
vi.mock("../../../src/services/accountService", () => {
  class MockAccountServiceError extends Error {
    constructor(
      message: string,
      public status: number,
      public code?: string,
      public details?: any
    ) {
      super(message);
      this.name = "AccountServiceError";
    }
  }

  return {
    AccountServiceError: MockAccountServiceError,
    connectWallet: vi.fn(),
    getUserProfile: vi.fn(),
    getUserWallets: vi.fn(),
    addWalletToBundle: vi.fn(),
    removeWalletFromBundle: vi.fn(),
    updateUserEmail: vi.fn(),
  };
});

// Import AccountServiceError after mocking
import { AccountServiceError } from "../../../src/services/accountService";

describe("userService - Pure Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validateWalletAddress", () => {
    it("validates correct Ethereum addresses", () => {
      expect(
        validateWalletAddress("0x1234567890123456789012345678901234567890")
      ).toBe(true);
      expect(
        validateWalletAddress("0xABCDEFabcdef1234567890123456789012345678")
      ).toBe(true);
      expect(
        validateWalletAddress("0x0000000000000000000000000000000000000000")
      ).toBe(true);
      expect(
        validateWalletAddress("0xffffffffffffffffffffffffffffffffffffffff")
      ).toBe(true);
    });

    it("rejects invalid addresses", () => {
      expect(validateWalletAddress("")).toBe(false);
      expect(validateWalletAddress("0x")).toBe(false);
      expect(
        validateWalletAddress("1234567890123456789012345678901234567890")
      ).toBe(false); // Missing 0x
      expect(
        validateWalletAddress("0x12345678901234567890123456789012345678")
      ).toBe(false); // Too short
      expect(
        validateWalletAddress("0x123456789012345678901234567890123456789012")
      ).toBe(false); // Too long
      expect(
        validateWalletAddress("0x123456789012345678901234567890123456789g")
      ).toBe(false); // Invalid hex
      expect(
        validateWalletAddress("0X1234567890123456789012345678901234567890")
      ).toBe(false); // Wrong case prefix
    });

    it("handles null and undefined inputs", () => {
      expect(validateWalletAddress(null as any)).toBe(false);
      expect(validateWalletAddress(undefined as any)).toBe(false);
    });
  });

  describe("transformWalletData", () => {
    const mockWallets: UserCryptoWallet[] = [
      {
        id: "wallet-1",
        user_id: "user-123",
        wallet: "0x1234567890123456789012345678901234567890",
        label: "My Main Wallet",

        created_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "wallet-2",
        user_id: "user-123",
        wallet: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",

        created_at: "2024-01-02T00:00:00Z",
      },
      {
        id: "wallet-3",
        user_id: "user-123",
        wallet: "0x9876543210987654321098765432109876543210",
        label: "Trading Wallet",
        created_at: "2024-01-03T00:00:00Z",
      },
    ];

    it("transforms wallet data correctly", () => {
      const result = transformWalletData(mockWallets);

      expect(result).toEqual([
        {
          id: "wallet-1",
          address: "0x1234567890123456789012345678901234567890",
          label: "My Main Wallet",
          isMain: false,
          isActive: false,

          createdAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "wallet-2",
          address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
          label: "Wallet",
          isMain: false,
          isActive: false,

          createdAt: "2024-01-02T00:00:00Z",
        },
        {
          id: "wallet-3",
          address: "0x9876543210987654321098765432109876543210",
          label: "Trading Wallet",
          isMain: false,
          isActive: false,
          createdAt: "2024-01-03T00:00:00Z",
        },
      ]);
    });

    it("handles wallet without label", () => {
      const walletWithoutLabel: UserCryptoWallet[] = [
        {
          id: "wallet-1",
          user_id: "user-123",
          wallet: "0x1234567890123456789012345678901234567890",

          created_at: "2024-01-01T00:00:00Z",
        },
      ];

      const result = transformWalletData(walletWithoutLabel);

      expect(result[0].label).toBe("Wallet");
      expect(result[0].isMain).toBe(false);
      expect(result[0].isActive).toBe(false);
    });

    it("handles empty wallet list", () => {
      const result = transformWalletData([]);
      expect(result).toEqual([]);
    });
  });

  describe("handleWalletError", () => {
    it("handles AccountServiceError by returning its message directly", () => {
      const accountError = new AccountServiceError(
        "Invalid wallet address format. Address must be 42 characters long.",
        400
      );
      // Ensure the error has the correct name property
      expect(accountError.name).toBe("AccountServiceError");

      const result = handleWalletError(accountError);
      expect(result).toBe(
        "Invalid wallet address format. Address must be 42 characters long."
      );
    });

    it("handles main wallet removal error", () => {
      const mainWalletError = new AccountServiceError(
        "Cannot remove the main wallet from your bundle.",
        400
      );
      const result = handleWalletError(mainWalletError);
      expect(result).toBe("Cannot remove the main wallet from your bundle.");
    });

    it("handles user/wallet not found error", () => {
      const notFoundError = new AccountServiceError(
        "User or wallet not found.",
        404
      );
      const result = handleWalletError(notFoundError);
      expect(result).toBe("User or wallet not found.");
    });

    it("handles duplicate wallet error", () => {
      const duplicateError = new AccountServiceError(
        "This wallet is already in your bundle.",
        409
      );
      const result = handleWalletError(duplicateError);
      expect(result).toBe("This wallet is already in your bundle.");
    });

    it("handles duplicate email error", () => {
      const emailError = new AccountServiceError(
        "This email address is already in use.",
        409
      );
      const result = handleWalletError(emailError);
      expect(result).toBe("This email address is already in use.");
    });

    it("falls back to generic error handling for non-AccountApiError", () => {
      const genericError = new Error("Network connection failed");
      const result = handleWalletError(genericError);
      expect(result).toBe("An unexpected error occurred. Please try again.");
    });

    it("handles unknown error types", () => {
      const result = handleWalletError("string error");
      expect(result).toBe("An unexpected error occurred. Please try again.");
    });
  });

  describe("Edge Cases and Data Integrity", () => {
    it("validateWalletAddress handles various edge cases", () => {
      const testCases = [
        { input: "0x" + "0".repeat(40), expected: true },
        { input: "0x" + "f".repeat(40), expected: true },
        { input: "0x" + "A".repeat(40), expected: true },
        { input: "0x" + "0".repeat(39), expected: false },
        { input: "0x" + "0".repeat(41), expected: false },
        { input: " 0x" + "0".repeat(40), expected: false },
        { input: "0x" + "0".repeat(40) + " ", expected: false },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(validateWalletAddress(input)).toBe(expected);
      });
    });

    it("transformWalletData preserves data integrity", () => {
      const originalWallets: UserCryptoWallet[] = [
        {
          id: "test-id",
          user_id: "test-user",
          wallet: "0x1234567890123456789012345678901234567890",
          label: "Test Wallet",

          created_at: "2024-01-01T00:00:00Z",
        },
      ];

      const transformed = transformWalletData(originalWallets);

      // Original data should remain unchanged
      expect(originalWallets[0].id).toBe("test-id");
      expect(originalWallets[0].wallet).toBe(
        "0x1234567890123456789012345678901234567890"
      );

      // Transformed data should have correct structure
      expect(transformed[0].id).toBe("test-id");
      expect(transformed[0].address).toBe(
        "0x1234567890123456789012345678901234567890"
      );
      expect(transformed[0].label).toBe("Test Wallet");
      expect(transformed[0].isMain).toBe(false);
      expect(transformed[0].isActive).toBe(false);
    });

    it("handles malformed wallet data gracefully", () => {
      const malformedWallets = [
        {
          id: "",
          user_id: "",
          wallet: "",

          created_at: "",
        },
      ] as UserCryptoWallet[];

      const result = transformWalletData(malformedWallets);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("");
      expect(result[0].address).toBe("");
      expect(result[0].label).toBe("Wallet");
      expect(result[0].isMain).toBe(false);
      expect(result[0].isActive).toBe(false);
    });
  });

  describe("Performance and Scalability", () => {
    it("handles large wallet lists efficiently", () => {
      const largeWalletList: UserCryptoWallet[] = Array.from(
        { length: 1000 },
        (_, i) => ({
          id: `wallet-${i}`,
          user_id: "user-123",
          wallet: `0x${"1".repeat(40)}`,
          label: `Wallet ${i}`,

          created_at: "2024-01-01T00:00:00Z",
        })
      );

      const startTime = Date.now();
      const result = transformWalletData(largeWalletList);
      const endTime = Date.now();

      expect(result).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(100); // Should be fast
    });

    it("validation is performant for many addresses", () => {
      const addresses = Array.from(
        { length: 1000 },
        () => "0x" + Math.random().toString(16).padStart(40, "0").slice(2, 42)
      );

      const startTime = Date.now();
      const results = addresses.map(validateWalletAddress);
      const endTime = Date.now();

      expect(results).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(50); // Should be very fast
    });
  });
});
