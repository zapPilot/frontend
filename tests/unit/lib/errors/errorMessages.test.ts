import { describe, expect, it } from "vitest";

import {
  getErrorMessage,
  getIntentErrorMessage,
} from "@/lib/errors/errorMessages";

describe("errorMessages", () => {
  describe("getIntentErrorMessage", () => {
    it("should return specific message for slippage error", () => {
      const msg = getIntentErrorMessage(400, "Invalid slippage value");
      expect(msg).toBe(
        "Invalid slippage tolerance. Must be between 0.1% and 50%."
      );
    });

    it("should return generic message for unknown 400", () => {
      const msg = getIntentErrorMessage(400, "Something else");
      expect(msg).toBe("Invalid transaction parameters.");
    });

    it("should return fallback generic message", () => {
      const msg = getIntentErrorMessage(500, "Server error");
      expect(msg).toBe("Internal server error. Please try again later.");
    });
  });

  describe("getErrorMessage", () => {
    // Service specific patterns
    describe("Service Patterns", () => {
      it("should handle backend-service notifications limit", () => {
        const msg = getErrorMessage({
          status: 429,
          source: "backend-service",
        });
        expect(msg).toBe(
          "Too many notification requests. Please wait before sending more."
        );
      });

      it("should handle account-service address format", () => {
        const msg = getErrorMessage({
          status: 400,
          message: "Invalid wallet address format",
          source: "account-service",
        });
        expect(msg).toBe(
          "Invalid wallet address format. Address must be 42 characters long."
        );
      });
    });

    // Generic HTTP messages
    describe("HTTP Generic Messages", () => {
      it("should return 404 message", () => {
        const msg = getErrorMessage({ status: 404 });
        expect(msg).toBe("Resource not found.");
      });

      it("should return 401 message", () => {
        const msg = getErrorMessage({ status: 401 });
        expect(msg).toBe(
          "Authentication required. Please connect your wallet."
        );
      });
    });

    // Fallbacks
    describe("Fallbacks", () => {
      it("should use original message if no pattern matches", () => {
        const original = "Custom error message";
        const msg = getErrorMessage({ status: 418, message: original });
        expect(msg).toBe(original);
      });

      it("should use final fallback if no message provided", () => {
        const msg = getErrorMessage({ status: 418 });
        expect(msg).toBe("An unexpected error occurred. Please try again.");
      });

      it("should use final fallback if message is empty", () => {
        const msg = getErrorMessage({ status: 418, message: "   " });
        expect(msg).toBe("An unexpected error occurred. Please try again.");
      });
    });
  });
});
