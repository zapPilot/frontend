/**
 * useBundlePage Pure Helpers Unit Tests
 *
 * Tests for the exported pure functions from useBundlePage hook
 */

import { describe, expect, it } from "vitest";

import {
    computeIsDifferentUser,
    computeRedirectUrl,
    computeShowEmailBanner,
    computeShowQuickSwitch,
} from "@/hooks/useBundlePage";

describe("computeIsDifferentUser", () => {
  it("should return false when not connected", () => {
    expect(computeIsDifferentUser(false, "user-1", "user-2")).toBe(false);
  });

  it("should return false when currentUserId is undefined", () => {
    expect(computeIsDifferentUser(true, undefined, "user-2")).toBe(false);
  });

  it("should return false when viewing own bundle", () => {
    expect(computeIsDifferentUser(true, "user-1", "user-1")).toBe(false);
  });

  it("should return true when connected and viewing different bundle", () => {
    expect(computeIsDifferentUser(true, "user-1", "user-2")).toBe(true);
  });
});

describe("computeShowQuickSwitch", () => {
  it("should return false when not connected", () => {
    expect(computeShowQuickSwitch(false, false, "user-1")).toBe(false);
  });

  it("should return false when viewing own bundle", () => {
    expect(computeShowQuickSwitch(true, true, "user-1")).toBe(false);
  });

  it("should return false when currentUserId is undefined", () => {
    expect(computeShowQuickSwitch(true, false, undefined)).toBe(false);
  });

  it("should return true when connected, not own bundle, and has userId", () => {
    expect(computeShowQuickSwitch(true, false, "user-1")).toBe(true);
  });
});

describe("computeShowEmailBanner", () => {
  it("should return false when not connected", () => {
    expect(computeShowEmailBanner(false, true, undefined, false)).toBe(false);
  });

  it("should return false when not own bundle", () => {
    expect(computeShowEmailBanner(true, false, undefined, false)).toBe(false);
  });

  it("should return false when email is already set", () => {
    expect(computeShowEmailBanner(true, true, "test@example.com", false)).toBe(false);
  });

  it("should return false when banner is dismissed", () => {
    expect(computeShowEmailBanner(true, true, undefined, true)).toBe(false);
  });

  it("should return true when connected, own bundle, no email, and not dismissed", () => {
    expect(computeShowEmailBanner(true, true, undefined, false)).toBe(true);
  });

  it("should return true when email is empty string", () => {
    expect(computeShowEmailBanner(true, true, "", false)).toBe(true);
  });
});

describe("computeRedirectUrl", () => {
  it("should return root path for empty search", () => {
    expect(computeRedirectUrl("")).toBe("/");
  });

  it("should preserve query params with leading ?", () => {
    expect(computeRedirectUrl("?tab=analytics")).toBe("/?tab=analytics");
  });

  it("should add ? if missing from search string", () => {
    expect(computeRedirectUrl("tab=analytics")).toBe("/?tab=analytics");
  });

  it("should handle multiple query params", () => {
    expect(computeRedirectUrl("?tab=analytics&view=chart")).toBe("/?tab=analytics&view=chart");
  });
});
