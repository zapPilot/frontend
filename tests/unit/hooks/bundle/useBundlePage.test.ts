/**
 * Unit tests for useBundlePage pure helper functions
 */
import { describe, expect, it } from "vitest";

import {
  computeIsDifferentUser,
  computeRedirectUrl,
  computeShowEmailBanner,
  computeShowQuickSwitch,
} from "@/hooks/bundle/useBundlePage";

describe("useBundlePage helpers", () => {
  describe("computeIsDifferentUser", () => {
    it("returns false when not connected", () => {
      expect(computeIsDifferentUser(false, "user-1", "user-2")).toBe(false);
    });

    it("returns false when currentUserId is undefined", () => {
      expect(computeIsDifferentUser(true, undefined, "user-2")).toBe(false);
    });

    it("returns false when viewing own bundle", () => {
      expect(computeIsDifferentUser(true, "user-1", "user-1")).toBe(false);
    });

    it("returns true when connected and viewing different user bundle", () => {
      expect(computeIsDifferentUser(true, "user-1", "user-2")).toBe(true);
    });
  });

  describe("computeShowQuickSwitch", () => {
    it("returns false when not connected", () => {
      expect(computeShowQuickSwitch(false, false, "user-1")).toBe(false);
    });

    it("returns false when viewing own bundle", () => {
      expect(computeShowQuickSwitch(true, true, "user-1")).toBe(false);
    });

    it("returns false when currentUserId is undefined", () => {
      expect(computeShowQuickSwitch(true, false, undefined)).toBe(false);
    });

    it("returns true when connected, not own bundle, and userId available", () => {
      expect(computeShowQuickSwitch(true, false, "user-1")).toBe(true);
    });
  });

  describe("computeShowEmailBanner", () => {
    it("returns false when not connected", () => {
      expect(computeShowEmailBanner(false, true, undefined, false)).toBe(false);
    });

    it("returns false when not own bundle", () => {
      expect(computeShowEmailBanner(true, false, undefined, false)).toBe(false);
    });

    it("returns false when email already set", () => {
      expect(
        computeShowEmailBanner(true, true, "test@example.com", false)
      ).toBe(false);
    });

    it("returns false when banner dismissed", () => {
      expect(computeShowEmailBanner(true, true, undefined, true)).toBe(false);
    });

    it("returns true when connected, own bundle, no email, not dismissed", () => {
      expect(computeShowEmailBanner(true, true, undefined, false)).toBe(true);
      expect(computeShowEmailBanner(true, true, "", false)).toBe(true);
    });
  });

  describe("computeRedirectUrl", () => {
    it("returns / for empty search", () => {
      expect(computeRedirectUrl("")).toBe("/");
    });

    it("handles search starting with ?", () => {
      expect(computeRedirectUrl("?foo=bar")).toBe("/?foo=bar");
    });

    it("adds ? prefix if missing", () => {
      expect(computeRedirectUrl("foo=bar")).toBe("/?foo=bar");
    });

    it("handles undefined-like values", () => {
      expect(computeRedirectUrl("")).toBe("/");
    });
  });
});
