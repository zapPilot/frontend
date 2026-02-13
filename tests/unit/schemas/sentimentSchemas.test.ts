import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import {
  sentimentApiResponseSchema,
  validateSentimentApiResponse,
} from "@/schemas/api/sentimentSchemas";

describe("sentimentSchemas", () => {
  describe("sentimentApiResponseSchema", () => {
    describe("valid sentiment data", () => {
      it("validates correct sentiment response", () => {
        const validData = {
          value: 26,
          status: "Fear",
          timestamp: "2025-12-04T00:00:00Z",
          source: "alternative.me",
          cached: true,
        };

        expect(() => sentimentApiResponseSchema.parse(validData)).not.toThrow();
      });

      it("validates sentiment without optional cached field", () => {
        const validData = {
          value: 26,
          status: "Fear",
          timestamp: "2025-12-04T00:00:00Z",
          source: "alternative.me",
        };

        expect(() => sentimentApiResponseSchema.parse(validData)).not.toThrow();
      });

      it("validates extreme fear (0)", () => {
        const validData = {
          value: 0,
          status: "Extreme Fear",
          timestamp: "2025-12-04T00:00:00Z",
          source: "alternative.me",
        };

        expect(() => sentimentApiResponseSchema.parse(validData)).not.toThrow();
      });

      it("validates extreme greed (100)", () => {
        const validData = {
          value: 100,
          status: "Extreme Greed",
          timestamp: "2025-12-04T00:00:00Z",
          source: "alternative.me",
        };

        expect(() => sentimentApiResponseSchema.parse(validData)).not.toThrow();
      });

      it("validates fear range (25)", () => {
        const validData = {
          value: 25,
          status: "Fear",
          timestamp: "2025-12-04T00:00:00Z",
          source: "alternative.me",
        };

        expect(() => sentimentApiResponseSchema.parse(validData)).not.toThrow();
      });

      it("validates neutral range (50)", () => {
        const validData = {
          value: 50,
          status: "Neutral",
          timestamp: "2025-12-04T00:00:00Z",
          source: "alternative.me",
        };

        expect(() => sentimentApiResponseSchema.parse(validData)).not.toThrow();
      });

      it("validates greed range (75)", () => {
        const validData = {
          value: 75,
          status: "Greed",
          timestamp: "2025-12-04T00:00:00Z",
          source: "alternative.me",
        };

        expect(() => sentimentApiResponseSchema.parse(validData)).not.toThrow();
      });

      it("validates with cached false", () => {
        const validData = {
          value: 50,
          status: "Neutral",
          timestamp: "2025-12-04T00:00:00Z",
          source: "alternative.me",
          cached: false,
        };

        expect(() => sentimentApiResponseSchema.parse(validData)).not.toThrow();
      });
    });

    describe("invalid sentiment data", () => {
      it("rejects value below 0", () => {
        const invalidData = {
          value: -1,
          status: "Fear",
          timestamp: "2025-12-04T00:00:00Z",
          source: "alternative.me",
        };

        expect(() => sentimentApiResponseSchema.parse(invalidData)).toThrow(
          ZodError
        );
      });

      it("rejects value above 100", () => {
        const invalidData = {
          value: 101,
          status: "Extreme Greed",
          timestamp: "2025-12-04T00:00:00Z",
          source: "alternative.me",
        };

        expect(() => sentimentApiResponseSchema.parse(invalidData)).toThrow(
          ZodError
        );
      });

      it("rejects non-integer value", () => {
        const invalidData = {
          value: 50.5,
          status: "Neutral",
          timestamp: "2025-12-04T00:00:00Z",
          source: "alternative.me",
        };

        expect(() => sentimentApiResponseSchema.parse(invalidData)).toThrow(
          ZodError
        );
      });

      it("rejects missing value field", () => {
        const invalidData = {
          status: "Fear",
          timestamp: "2025-12-04T00:00:00Z",
          source: "alternative.me",
        };

        expect(() => sentimentApiResponseSchema.parse(invalidData)).toThrow(
          ZodError
        );
      });

      it("rejects missing status field", () => {
        const invalidData = {
          value: 26,
          timestamp: "2025-12-04T00:00:00Z",
          source: "alternative.me",
        };

        expect(() => sentimentApiResponseSchema.parse(invalidData)).toThrow(
          ZodError
        );
      });

      it("rejects missing timestamp field", () => {
        const invalidData = {
          value: 26,
          status: "Fear",
          source: "alternative.me",
        };

        expect(() => sentimentApiResponseSchema.parse(invalidData)).toThrow(
          ZodError
        );
      });

      it("rejects missing source field", () => {
        const invalidData = {
          value: 26,
          status: "Fear",
          timestamp: "2025-12-04T00:00:00Z",
        };

        expect(() => sentimentApiResponseSchema.parse(invalidData)).toThrow(
          ZodError
        );
      });

      it("rejects invalid value type", () => {
        const invalidData = {
          value: "26",
          status: "Fear",
          timestamp: "2025-12-04T00:00:00Z",
          source: "alternative.me",
        };

        expect(() => sentimentApiResponseSchema.parse(invalidData)).toThrow(
          ZodError
        );
      });

      it("rejects invalid status type", () => {
        const invalidData = {
          value: 26,
          status: 26,
          timestamp: "2025-12-04T00:00:00Z",
          source: "alternative.me",
        };

        expect(() => sentimentApiResponseSchema.parse(invalidData)).toThrow(
          ZodError
        );
      });

      it("rejects invalid cached type", () => {
        const invalidData = {
          value: 26,
          status: "Fear",
          timestamp: "2025-12-04T00:00:00Z",
          source: "alternative.me",
          cached: "true",
        };

        expect(() => sentimentApiResponseSchema.parse(invalidData)).toThrow(
          ZodError
        );
      });
    });
  });

  describe("validateSentimentApiResponse", () => {
    it("validates and returns valid sentiment data", () => {
      const validData = {
        value: 26,
        status: "Fear",
        timestamp: "2025-12-04T00:00:00Z",
        source: "alternative.me",
        cached: true,
      };

      const result = validateSentimentApiResponse(validData);
      expect(result).toEqual(validData);
    });

    it("throws ZodError for invalid data", () => {
      const invalidData = {
        value: 101,
        status: "Invalid",
      };

      expect(() => validateSentimentApiResponse(invalidData)).toThrow(ZodError);
    });
  });

  // safeValidateSentimentApiResponse tests removed - function removed (2025-12-22)
});
