/**
 * IntentServiceError Unit Tests
 *
 * Tests for intent service error class and factory function
 */

import { describe, expect, it } from "vitest";

import {
  createIntentServiceError,
  IntentServiceError,
} from "@/lib/errors/IntentServiceError";

describe("IntentServiceError", () => {
  describe("constructor", () => {
    it("should create error with message and status", () => {
      const error = new IntentServiceError("Transaction failed", 400);
      expect(error.message).toBe("Transaction failed");
      expect(error.status).toBe(400);
      expect(error.name).toBe("IntentServiceError");
      expect(error.source).toBe("intent-service");
    });

    it("should create error with code and details", () => {
      const error = new IntentServiceError("Test", 500, "INTENT_FAILED", {
        txHash: "0x123",
      });
      expect(error.code).toBe("INTENT_FAILED");
      expect(error.details).toEqual({ txHash: "0x123" });
    });

    it("should be instanceof BaseServiceError", () => {
      const error = new IntentServiceError("Test", 400);
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe("getUserMessage", () => {
    it("should return user-friendly message for 400 slippage error", () => {
      const error = new IntentServiceError("Invalid slippage value", 400);
      const userMessage = error.getUserMessage();
      expect(userMessage).toContain("slippage");
    });

    it("should return user-friendly message for 429 rate limit", () => {
      const error = new IntentServiceError("Rate limit exceeded", 429);
      const userMessage = error.getUserMessage();
      expect(userMessage).toContain("Too many");
    });

    it("should return user-friendly message for 503 overload", () => {
      const error = new IntentServiceError("Service overloaded", 503);
      const userMessage = error.getUserMessage();
      expect(userMessage).toContain("temporarily");
    });
  });
});

describe("createIntentServiceError", () => {
  describe("with error object", () => {
    it("should create error from error object with message", () => {
      const error = createIntentServiceError({
        message: "Transaction failed",
        status: 400,
      });
      expect(error).toBeInstanceOf(IntentServiceError);
      expect(error.message).toBe("Transaction failed");
      expect(error.status).toBe(400);
    });

    it("should extract status from response", () => {
      const error = createIntentServiceError({
        message: "Error",
        response: { status: 404 },
      });
      expect(error.status).toBe(404);
    });

    it("should default to 500 when no status provided", () => {
      const error = createIntentServiceError({ message: "Error" });
      expect(error.status).toBe(500);
    });

    it("should preserve code from error object", () => {
      const error = createIntentServiceError({
        message: "Error",
        status: 400,
        code: "ERR_INTENT",
      });
      expect(error.code).toBe("ERR_INTENT");
    });

    it("should preserve details from error object", () => {
      const error = createIntentServiceError({
        message: "Error",
        details: { key: "value" },
      });
      expect(error.details).toEqual({ key: "value" });
    });
  });

  describe("message enhancement for 400 errors", () => {
    it("should enhance slippage error message", () => {
      const error = createIntentServiceError({
        message: "slippage tolerance exceeded",
        status: 400,
      });
      expect(error.message).toContain("slippage tolerance");
      expect(error.message).toContain("0.1%");
      expect(error.message).toContain("50%");
    });

    it("should enhance amount error message", () => {
      const error = createIntentServiceError({
        message: "invalid amount specified",
        status: 400,
      });
      expect(error.message).toContain("amount");
      expect(error.message).toContain("balance");
    });
  });

  describe("message enhancement for 429 errors", () => {
    it("should provide rate limit message", () => {
      const error = createIntentServiceError({
        message: "Rate limit hit",
        status: 429,
      });
      expect(error.message).toContain("Too many transactions");
    });
  });

  describe("message enhancement for 503 errors", () => {
    it("should provide overload message", () => {
      const error = createIntentServiceError({
        message: "Service busy",
        status: 503,
      });
      expect(error.message).toContain("overloaded");
    });
  });

  describe("with empty object error", () => {
    it("should handle empty object with defaults", () => {
      const error = createIntentServiceError({});
      expect(error).toBeInstanceOf(IntentServiceError);
      expect(error.status).toBe(500);
    });
  });
});
