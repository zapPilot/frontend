/**
 * BaseServiceError Unit Tests
 *
 * Tests for the core service error class
 */

import { describe, expect, it } from "vitest";

import { BaseServiceError } from "@/lib/errors/BaseServiceError";
import type { ErrorContext, ErrorSeverity } from "@/lib/errors/errorContext";

describe("BaseServiceError", () => {
  describe("constructor", () => {
    it("should create error with message only", () => {
      const error = new BaseServiceError("Test error");
      expect(error.message).toBe("Test error");
      expect(error.name).toBe("BaseServiceError");
      expect(error.status).toBe(500);
      expect(error.severity).toBe("medium");
    });

    it("should create error with full context", () => {
      const context: ErrorContext = {
        source: "test-service",
        status: 404,
        code: "NOT_FOUND",
        details: { id: "123" },
        timestamp: "2024-01-01T00:00:00.000Z",
      };
      const error = new BaseServiceError("Not found", context, "high");

      expect(error.message).toBe("Not found");
      expect(error.source).toBe("test-service");
      expect(error.status).toBe(404);
      expect(error.code).toBe("NOT_FOUND");
      expect(error.details).toEqual({ id: "123" });
      expect(error.timestamp).toBe("2024-01-01T00:00:00.000Z");
      expect(error.severity).toBe("high");
    });

    it("should set default timestamp if not provided", () => {
      const before = new Date().toISOString();
      const error = new BaseServiceError("Test");
      const after = new Date().toISOString();

      expect(error.timestamp).toBeTruthy();
      expect(error.timestamp >= before).toBe(true);
      expect(error.timestamp <= after).toBe(true);
    });

    it("should preserve cause error", () => {
      const cause = new Error("Original error");
      const error = new BaseServiceError("Wrapped error", { cause });

      expect(error.cause).toBe(cause);
      expect(error.cause?.message).toBe("Original error");
    });

    it("should be instanceof Error", () => {
      const error = new BaseServiceError("Test");
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(BaseServiceError);
    });
  });

  describe("toJSON", () => {
    it("should include required fields", () => {
      const error = new BaseServiceError("Test", { status: 400 }, "low");
      const json = error.toJSON();

      expect(json.name).toBe("BaseServiceError");
      expect(json.message).toBe("Test");
      expect(json.status).toBe(400);
      expect(json.severity).toBe("low");
      expect(typeof json.timestamp).toBe("number");
    });

    it("should include optional fields when present", () => {
      const cause = new Error("Cause");
      const error = new BaseServiceError("Test", {
        source: "api",
        code: "ERR_001",
        details: { key: "value" },
        cause,
      });
      const json = error.toJSON();

      expect(json.source).toBe("api");
      expect(json.code).toBe("ERR_001");
      expect(json.details).toEqual({ key: "value" });
      expect(json.cause).toBe("Cause");
      expect(json.stack).toBeTruthy();
    });

    it("should exclude optional fields when not present", () => {
      const error = new BaseServiceError("Test");
      const json = error.toJSON();

      expect(json.source).toBeUndefined();
      expect(json.code).toBeUndefined();
      expect(json.details).toBeUndefined();
      expect(json.cause).toBeUndefined();
    });
  });

  describe("getUserMessage", () => {
    it("should return the error message by default", () => {
      const error = new BaseServiceError("User readable message");
      expect(error.getUserMessage()).toBe("User readable message");
    });
  });

  describe("isRetryable", () => {
    it("should return true for 5xx errors", () => {
      const error500 = new BaseServiceError("Test", { status: 500 });
      const error502 = new BaseServiceError("Test", { status: 502 });
      const error503 = new BaseServiceError("Test", { status: 503 });

      expect(error500.isRetryable()).toBe(true);
      expect(error502.isRetryable()).toBe(true);
      expect(error503.isRetryable()).toBe(true);
    });

    it("should return true for rate limit error (429)", () => {
      const error = new BaseServiceError("Test", { status: 429 });
      expect(error.isRetryable()).toBe(true);
    });

    it("should return true for timeout error (408)", () => {
      const error = new BaseServiceError("Test", { status: 408 });
      expect(error.isRetryable()).toBe(true);
    });

    it("should return false for client errors (4xx except 408, 429)", () => {
      const error400 = new BaseServiceError("Test", { status: 400 });
      const error401 = new BaseServiceError("Test", { status: 401 });
      const error404 = new BaseServiceError("Test", { status: 404 });

      expect(error400.isRetryable()).toBe(false);
      expect(error401.isRetryable()).toBe(false);
      expect(error404.isRetryable()).toBe(false);
    });
  });

  describe("isClientError", () => {
    it("should return true for 4xx status codes", () => {
      const error400 = new BaseServiceError("Test", { status: 400 });
      const error401 = new BaseServiceError("Test", { status: 401 });
      const error404 = new BaseServiceError("Test", { status: 404 });
      const error499 = new BaseServiceError("Test", { status: 499 });

      expect(error400.isClientError()).toBe(true);
      expect(error401.isClientError()).toBe(true);
      expect(error404.isClientError()).toBe(true);
      expect(error499.isClientError()).toBe(true);
    });

    it("should return false for non-4xx status codes", () => {
      const error200 = new BaseServiceError("Test", { status: 200 });
      const error500 = new BaseServiceError("Test", { status: 500 });

      expect(error200.isClientError()).toBe(false);
      expect(error500.isClientError()).toBe(false);
    });
  });

  describe("isServerError", () => {
    it("should return true for 5xx status codes", () => {
      const error500 = new BaseServiceError("Test", { status: 500 });
      const error502 = new BaseServiceError("Test", { status: 502 });
      const error503 = new BaseServiceError("Test", { status: 503 });
      const error599 = new BaseServiceError("Test", { status: 599 });

      expect(error500.isServerError()).toBe(true);
      expect(error502.isServerError()).toBe(true);
      expect(error503.isServerError()).toBe(true);
      expect(error599.isServerError()).toBe(true);
    });

    it("should return false for non-5xx status codes", () => {
      const error200 = new BaseServiceError("Test", { status: 200 });
      const error400 = new BaseServiceError("Test", { status: 400 });

      expect(error200.isServerError()).toBe(false);
      expect(error400.isServerError()).toBe(false);
    });
  });

  describe("severity levels", () => {
    const severities: ErrorSeverity[] = ["low", "medium", "high", "critical"];

    for (const severity of severities) {
      it(`should accept ${severity} severity`, () => {
        const error = new BaseServiceError("Test", {}, severity);
        expect(error.severity).toBe(severity);
      });
    }
  });
});
