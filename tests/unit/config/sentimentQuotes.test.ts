import { describe, expect, it } from "vitest";

import { getQuoteForSentiment } from "@/config/sentimentQuotes";

describe("sentimentQuotes", () => {
  describe("getQuoteForSentiment", () => {
    it("returns Extreme Fear for values 0-24", () => {
      const result = getQuoteForSentiment(10);
      expect(result.sentiment).toBe("Extreme Fear");
      expect(result.quote).toBeTruthy();
      expect(result.author).toBeTruthy();
    });

    it("returns Fear for values 25-44", () => {
      const result = getQuoteForSentiment(30);
      expect(result.sentiment).toBe("Fear");
    });

    it("returns Neutral for values 45-55", () => {
      const result = getQuoteForSentiment(50);
      expect(result.sentiment).toBe("Neutral");
    });

    it("returns Greed for values 56-74", () => {
      const result = getQuoteForSentiment(65);
      expect(result.sentiment).toBe("Greed");
    });

    it("returns Extreme Greed for values 75-100", () => {
      const result = getQuoteForSentiment(90);
      expect(result.sentiment).toBe("Extreme Greed");
    });

    it("handles boundary values correctly", () => {
      expect(getQuoteForSentiment(0).sentiment).toBe("Extreme Fear");
      expect(getQuoteForSentiment(24).sentiment).toBe("Extreme Fear");
      expect(getQuoteForSentiment(25).sentiment).toBe("Fear");
      expect(getQuoteForSentiment(44).sentiment).toBe("Fear");
      expect(getQuoteForSentiment(45).sentiment).toBe("Neutral");
      expect(getQuoteForSentiment(55).sentiment).toBe("Neutral");
      expect(getQuoteForSentiment(56).sentiment).toBe("Greed");
      expect(getQuoteForSentiment(74).sentiment).toBe("Greed");
      expect(getQuoteForSentiment(75).sentiment).toBe("Extreme Greed");
      expect(getQuoteForSentiment(100).sentiment).toBe("Extreme Greed");
    });

    it("clamps values below 0 to Extreme Fear", () => {
      const result = getQuoteForSentiment(-10);
      expect(result.sentiment).toBe("Extreme Fear");
    });

    it("clamps values above 100 to Extreme Greed", () => {
      const result = getQuoteForSentiment(150);
      expect(result.sentiment).toBe("Extreme Greed");
    });

    it("returns default quote for NaN", () => {
      const result = getQuoteForSentiment(NaN);
      expect(result.sentiment).toBe("Neutral");
      expect(result.quote).toBeTruthy();
    });

    it("returns default quote for Infinity", () => {
      const result = getQuoteForSentiment(Infinity);
      expect(result.sentiment).toBe("Neutral");
    });
  });
});
