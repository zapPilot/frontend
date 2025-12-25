/**
 * classNames Utility Tests
 *
 * Tests for the cn and createClassNameBuilder utility functions
 */

import { describe, expect, it } from "vitest";

import { cn, createClassNameBuilder } from "@/lib/ui/classNames";

describe("cn", () => {
  it("joins multiple class names", () => {
    expect(cn("foo", "bar", "baz")).toBe("foo bar baz");
  });

  it("filters out undefined values", () => {
    expect(cn("foo", undefined, "bar")).toBe("foo bar");
  });

  it("filters out null values", () => {
    expect(cn("foo", null, "bar")).toBe("foo bar");
  });

  it("filters out false values", () => {
    expect(cn("foo", false, "bar")).toBe("foo bar");
  });

  it("filters out empty strings", () => {
    expect(cn("foo", "", "bar")).toBe("foo bar");
  });

  it("handles conditional class names", () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn("base", isActive && "active", isDisabled && "disabled")).toBe(
      "base active"
    );
  });

  it("returns empty string for no valid classes", () => {
    expect(cn(undefined, null, false)).toBe("");
  });

  it("returns single class for one input", () => {
    expect(cn("single")).toBe("single");
  });
});

describe("createClassNameBuilder", () => {
  it("creates builder with base classes", () => {
    const builder = createClassNameBuilder("base", "default");
    expect(builder()).toBe("base default");
  });

  it("appends conditional classes", () => {
    const builder = createClassNameBuilder("base");
    expect(builder("additional", "extra")).toBe("base additional extra");
  });

  it("filters falsy conditional classes", () => {
    const builder = createClassNameBuilder("base");
    expect(builder("added", false, undefined, null)).toBe("base added");
  });

  it("works with conditional expressions", () => {
    const builder = createClassNameBuilder("btn");
    const isPrimary = true;
    const isLarge = false;
    expect(builder(isPrimary && "btn-primary", isLarge && "btn-lg")).toBe(
      "btn btn-primary"
    );
  });
});
