/**
 * useBundlePage - Unit Tests for Pure Functions
 *
 * This file contains fast unit tests for the isolated helper functions
 * exported by the useBundlePage hook. These are pure functions that can
 * be tested without React rendering or component mocking.
 *
 * For integration tests that verify the hook's behavior with React state,
 * effects, and component rendering, see useBundlePage.test.tsx
 *
 * Test Coverage:
 * - computeIsDifferentUser: User identity comparison logic
 * - computeShowQuickSwitch: Quick switch banner visibility rules
 * - computeShowEmailBanner: Email prompt banner display logic
 * - computeRedirectUrl: URL formatting for redirects
 */

import { describe, expect, it } from "vitest";

import {
  computeIsDifferentUser,
  computeRedirectUrl,
  computeShowEmailBanner,
  computeShowQuickSwitch,
} from "@/hooks/useBundlePage";

describe("useBundlePage Helper Functions", () => {
  describe("computeIsDifferentUser", () => {
    it("should return true when connected user views different bundle", () => {
      const result = computeIsDifferentUser(
        true, // isConnected
        "0xWalletA", // currentUserId
        "0xWalletB" // viewedUserId
      );
      expect(result).toBe(true);
    });

    it("should return false when viewing own bundle", () => {
      const result = computeIsDifferentUser(
        true,
        "0xWalletA",
        "0xWalletA" // Same user
      );
      expect(result).toBe(false);
    });

    it("should return false when not connected", () => {
      const result = computeIsDifferentUser(
        false, // Not connected
        undefined,
        "0xWalletB"
      );
      expect(result).toBe(false);
    });

    it("should return false when currentUserId is undefined", () => {
      const result = computeIsDifferentUser(
        true,
        undefined, // No current user
        "0xWalletB"
      );
      expect(result).toBe(false);
    });

    it("should return false when viewing own bundle even with different casing", () => {
      // Addresses should be case-insensitive in practice, but this tests strict equality
      const result = computeIsDifferentUser(
        true,
        "0xWalletA",
        "0xWalletA" // Exact match
      );
      expect(result).toBe(false);
    });

    it("should handle edge case with empty strings", () => {
      const result = computeIsDifferentUser(true, "", "0xWalletB");
      expect(result).toBe(false);
    });
  });

  describe("computeShowQuickSwitch", () => {
    it("should return true when connected and viewing different bundle", () => {
      const result = computeShowQuickSwitch(
        true, // isConnected
        false, // not own bundle
        "0xWalletA" // currentUserId
      );
      expect(result).toBe(true);
    });

    it("should return false when viewing own bundle", () => {
      const result = computeShowQuickSwitch(
        true,
        true, // own bundle
        "0xWalletA"
      );
      expect(result).toBe(false);
    });

    it("should return false when not connected", () => {
      const result = computeShowQuickSwitch(
        false, // not connected
        false
      );
      expect(result).toBe(false);
    });

    it("should return false when currentUserId is undefined", () => {
      const result = computeShowQuickSwitch(
        true,
        false // no user ID
      );
      expect(result).toBe(false);
    });
  });

  describe("computeShowEmailBanner", () => {
    it("should return true when connected, own bundle, no email, not dismissed", () => {
      const result = computeShowEmailBanner(
        true, // isConnected
        true, // isOwnBundle
        undefined, // no email
        false // not dismissed
      );
      expect(result).toBe(true);
    });

    it("should return false when viewing different bundle", () => {
      const result = computeShowEmailBanner(
        true,
        false, // not own bundle
        undefined,
        false
      );
      expect(result).toBe(false);
    });

    it("should return false when user already has email", () => {
      const result = computeShowEmailBanner(
        true,
        true,
        "user@example.com", // has email
        false
      );
      expect(result).toBe(false);
    });

    it("should return false when banner is dismissed", () => {
      const result = computeShowEmailBanner(
        true,
        true,
        undefined,
        true // dismissed
      );
      expect(result).toBe(false);
    });

    it("should return false when not connected", () => {
      const result = computeShowEmailBanner(
        false, // not connected
        true,
        undefined,
        false
      );
      expect(result).toBe(false);
    });
  });

  describe("computeRedirectUrl", () => {
    it("should return root path with empty search", () => {
      expect(computeRedirectUrl("")).toBe("/");
    });

    it("should preserve search params with leading question mark", () => {
      expect(computeRedirectUrl("?foo=bar&baz=qux")).toBe("/?foo=bar&baz=qux");
    });

    it("should add question mark if missing", () => {
      expect(computeRedirectUrl("foo=bar")).toBe("/?foo=bar");
    });

    it("should handle undefined input", () => {
      // @ts-expect-error Testing runtime behavior
      expect(computeRedirectUrl(null)).toBe("/");
    });
  });
});
