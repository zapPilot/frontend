import { describe, expect, it, vi } from "vitest";

import {
  generateBundleUrl,
  getBundleMetadata,
  getBundleUser,
  isOwnBundle,
  parseBundleUrl,
} from "@/services/bundleService";

// Mock dependencies
vi.mock("@/utils/formatters", () => ({
  formatAddress: vi.fn((address: string) => `${address.slice(0, 6)}...`),
}));

vi.mock("@/utils/logger", () => ({
  logger: {
    createContextLogger: () => ({
      error: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
    }),
  },
}));

describe("bundleService", () => {
  describe("getBundleUser", () => {
    it("should return user with userId and formatted displayName", async () => {
      const result = await getBundleUser("0x1234567890abcdef");

      expect(result).toEqual({
        userId: "0x1234567890abcdef",
        displayName: "0x1234...",
      });
    });

    it("should return basic user info for any userId", async () => {
      const result = await getBundleUser("test-user-123");

      expect(result).not.toBeNull();
      expect(result?.userId).toBe("test-user-123");
    });
  });

  describe("generateBundleUrl", () => {
    it("should generate relative URL with just userId", () => {
      const result = generateBundleUrl("0x123");

      expect(result).toBe("/bundle?userId=0x123");
    });

    it("should include walletId when provided", () => {
      const result = generateBundleUrl("0x123", "0xWallet456");

      expect(result).toBe("/bundle?userId=0x123&walletId=0xWallet456");
    });

    it("should generate absolute URL when baseUrl provided", () => {
      const result = generateBundleUrl(
        "0x123",
        undefined,
        "https://example.com"
      );

      expect(result).toBe("https://example.com/bundle?userId=0x123");
    });

    it("should generate absolute URL with walletId and baseUrl", () => {
      const result = generateBundleUrl(
        "0x123",
        "0xWallet",
        "https://example.com"
      );

      expect(result).toBe(
        "https://example.com/bundle?userId=0x123&walletId=0xWallet"
      );
    });
  });

  describe("parseBundleUrl", () => {
    it("should extract userId from bundle URL", () => {
      const result = parseBundleUrl("https://example.com/bundle?userId=0x123");

      expect(result.userId).toBe("0x123");
      expect(result.walletId).toBeNull();
    });

    it("should extract both userId and walletId", () => {
      const result = parseBundleUrl(
        "https://example.com/bundle?userId=0x123&walletId=0xWallet"
      );

      expect(result.userId).toBe("0x123");
      expect(result.walletId).toBe("0xWallet");
    });

    it("should return nulls for invalid URL", () => {
      const result = parseBundleUrl("not-a-valid-url");

      expect(result.userId).toBeNull();
      expect(result.walletId).toBeNull();
    });

    it("should return nulls for URL without required params", () => {
      const result = parseBundleUrl("https://example.com/bundle");

      expect(result.userId).toBeNull();
      expect(result.walletId).toBeNull();
    });
  });

  describe("isOwnBundle", () => {
    it("should return true when bundle userId matches current user", () => {
      expect(isOwnBundle("0x123", "0x123")).toBe(true);
    });

    it("should return false when bundle userId differs from current user", () => {
      expect(isOwnBundle("0x123", "0x456")).toBe(false);
    });

    it("should return false when current user is null", () => {
      expect(isOwnBundle("0x123", null)).toBe(false);
    });

    it("should return false when current user is undefined", () => {
      expect(isOwnBundle("0x123", undefined)).toBe(false);
    });
  });

  describe("getBundleMetadata", () => {
    it("should return metadata with user info", async () => {
      const result = await getBundleMetadata("0x123");

      expect(result).not.toBeNull();
      expect(result?.user.userId).toBe("0x123");
      expect(result?.isPublic).toBe(true);
      expect(result?.createdAt).toBeInstanceOf(Date);
      expect(result?.updatedAt).toBeInstanceOf(Date);
    });

    it("should set isPublic to true by default", async () => {
      const result = await getBundleMetadata("any-user");

      expect(result?.isPublic).toBe(true);
    });
  });
});
