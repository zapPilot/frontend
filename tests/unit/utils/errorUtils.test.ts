import { describe, expect, it } from "vitest";

import { getErrorMessage } from "../../../src/utils/errorUtils";

describe("getErrorMessage", () => {
  it("returns message from Error instance", () => {
    expect(getErrorMessage(new Error("boom"), "fallback")).toBe("boom");
  });

  it("returns the string directly when error is a string", () => {
    expect(getErrorMessage("string error", "fallback")).toBe("string error");
  });

  it("returns message from object with message property", () => {
    expect(getErrorMessage({ message: "obj msg" }, "fallback")).toBe("obj msg");
  });

  it("returns fallback for object without message property", () => {
    expect(getErrorMessage({ code: 500 }, "fallback")).toBe("fallback");
  });

  it("returns fallback for object with non-string message", () => {
    expect(getErrorMessage({ message: 123 }, "fallback")).toBe("fallback");
  });

  it("returns fallback for null", () => {
    expect(getErrorMessage(null, "fallback")).toBe("fallback");
  });

  it("returns fallback for undefined", () => {
    expect(getErrorMessage(undefined, "fallback")).toBe("fallback");
  });

  it("returns fallback for number", () => {
    expect(getErrorMessage(42, "fallback")).toBe("fallback");
  });

  it("returns fallback for boolean", () => {
    expect(getErrorMessage(true, "fallback")).toBe("fallback");
  });

  it("uses custom fallback message", () => {
    expect(getErrorMessage(null, "custom fallback")).toBe("custom fallback");
  });
});
