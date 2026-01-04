import { describe, expect, it } from "vitest";

import {
  createAccountServiceError,
  createAnalyticsServiceError,
  createBundleServiceError,
  createIntentServiceError,
  extractErrorCode,
  extractStatusCode,
  isClientError,
  isRetryableError,
  isServerError,
} from "@/lib/errors/errorHelpers";
import {
  AccountServiceError,
  AnalyticsServiceError,
  BundleServiceError,
  IntentServiceError,
} from "@/lib/errors/ServiceError";

describe("errorHelpers", () => {
  it("classifies client, server, and retryable errors from status", () => {
    expect(isClientError(new AccountServiceError("Client", 404))).toBe(true);
    expect(isServerError({ status: 503 })).toBe(true);
    expect(isRetryableError({ status: 408 })).toBe(true);
    expect(isRetryableError({ status: 400 })).toBe(false);
  });

  it("extracts status codes from service errors, plain objects, and response status", () => {
    expect(extractStatusCode(new AccountServiceError("Teapot", 418))).toBe(418);
    expect(extractStatusCode({ status: 401 })).toBe(401);
    expect(extractStatusCode({ response: { status: 502 } })).toBe(502);
    expect(extractStatusCode({})).toBe(500);
  });

  it("extracts error codes from service errors and plain objects", () => {
    expect(
      extractErrorCode(new AccountServiceError("Bad", 400, "E_ACCOUNT"))
    ).toBe("E_ACCOUNT");
    expect(extractErrorCode({ code: "E_GENERIC" })).toBe("E_GENERIC");
    expect(extractErrorCode({})).toBeUndefined();
  });

  it("creates service errors with resolved messages and metadata", () => {
    const accountError = createAccountServiceError(
      { status: 404, message: "User not found" },
      "Fallback"
    );
    expect(accountError).toBeInstanceOf(AccountServiceError);
    expect(accountError.status).toBe(404);
    expect(accountError.message).toBe("User not found");

    const analyticsError = createAnalyticsServiceError({
      status: 500,
      message: "Analytics exploded",
      details: { retry: true },
    });
    expect(analyticsError).toBeInstanceOf(AnalyticsServiceError);
    expect(analyticsError.details).toEqual({ retry: true });

    const bundleError = createBundleServiceError({
      status: 500,
      message: "Bundle failed",
      details: { reason: "missing" },
    });
    expect(bundleError).toBeInstanceOf(BundleServiceError);
    expect(bundleError.details).toEqual({ reason: "missing" });
  });

  it("enhances intent service errors with friendly messaging", () => {
    const intentError = createIntentServiceError({
      status: 400,
      message: "Slippage too high",
    });
    expect(intentError).toBeInstanceOf(IntentServiceError);
    expect(intentError.status).toBe(400);
    expect(intentError.message).toBe(
      "Invalid slippage tolerance. Must be between 0.1% and 50%."
    );
  });
});
