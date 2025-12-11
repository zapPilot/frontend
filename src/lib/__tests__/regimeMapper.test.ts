/**
 * Unit tests for regimeMapper.ts
 *
 * Tests sentiment-to-regime conversion logic with:
 * - Boundary value testing
 * - Edge case validation
 * - Input validation
 * - Fallback behavior
 */

import { describe, expect, it } from "vitest";

import {
  getRegimeFromSentiment,
  getRegimeLabelFromSentiment,
  isSentimentInRegime,
} from "../regimeMapper";

describe("regimeMapper", () => {
  describe("getRegimeFromSentiment", () => {
    describe("Extreme Fear (ef) - Range: 0-25", () => {
      it("should return ef for sentiment value 0", () => {
        expect(getRegimeFromSentiment(0)).toBe("ef");
      });

      it("should return ef for sentiment value 12", () => {
        expect(getRegimeFromSentiment(12)).toBe("ef");
      });

      it("should return ef for sentiment value 25 (upper boundary)", () => {
        expect(getRegimeFromSentiment(25)).toBe("ef");
      });
    });

    describe("Fear (f) - Range: 26-45", () => {
      it("should return f for sentiment value 26 (lower boundary)", () => {
        expect(getRegimeFromSentiment(26)).toBe("f");
      });

      it("should return f for sentiment value 35", () => {
        expect(getRegimeFromSentiment(35)).toBe("f");
      });

      it("should return f for sentiment value 45 (upper boundary)", () => {
        expect(getRegimeFromSentiment(45)).toBe("f");
      });
    });

    describe("Neutral (n) - Range: 46-54", () => {
      it("should return n for sentiment value 46 (lower boundary)", () => {
        expect(getRegimeFromSentiment(46)).toBe("n");
      });

      it("should return n for sentiment value 50", () => {
        expect(getRegimeFromSentiment(50)).toBe("n");
      });

      it("should return n for sentiment value 54 (upper boundary)", () => {
        expect(getRegimeFromSentiment(54)).toBe("n");
      });
    });

    describe("Greed (g) - Range: 55-75", () => {
      it("should return g for sentiment value 55 (lower boundary)", () => {
        expect(getRegimeFromSentiment(55)).toBe("g");
      });

      it("should return g for sentiment value 65", () => {
        expect(getRegimeFromSentiment(65)).toBe("g");
      });

      it("should return g for sentiment value 75 (upper boundary)", () => {
        expect(getRegimeFromSentiment(75)).toBe("g");
      });
    });

    describe("Extreme Greed (eg) - Range: 76-100", () => {
      it("should return eg for sentiment value 76 (lower boundary)", () => {
        expect(getRegimeFromSentiment(76)).toBe("eg");
      });

      it("should return eg for sentiment value 88", () => {
        expect(getRegimeFromSentiment(88)).toBe("eg");
      });

      it("should return eg for sentiment value 100 (upper boundary)", () => {
        expect(getRegimeFromSentiment(100)).toBe("eg");
      });
    });

    describe("Edge cases and validation", () => {
      it("should default to neutral (n) for negative values", () => {
        expect(getRegimeFromSentiment(-1)).toBe("n");
        expect(getRegimeFromSentiment(-50)).toBe("n");
      });

      it("should default to neutral (n) for values > 100", () => {
        expect(getRegimeFromSentiment(101)).toBe("n");
        expect(getRegimeFromSentiment(150)).toBe("n");
      });

      it("should handle decimal values correctly", () => {
        expect(getRegimeFromSentiment(25.5)).toBe("f");
        expect(getRegimeFromSentiment(45.9)).toBe("f");
        expect(getRegimeFromSentiment(54.1)).toBe("g");
        expect(getRegimeFromSentiment(75.1)).toBe("eg");
      });

      it("should handle NaN by returning neutral", () => {
        expect(getRegimeFromSentiment(NaN)).toBe("n");
      });

      it("should handle Infinity by returning neutral", () => {
        expect(getRegimeFromSentiment(Infinity)).toBe("n");
        expect(getRegimeFromSentiment(-Infinity)).toBe("n");
      });
    });
  });

  describe("getRegimeLabelFromSentiment", () => {
    it("should return correct labels for each regime", () => {
      expect(getRegimeLabelFromSentiment(10)).toBe("Extreme Fear");
      expect(getRegimeLabelFromSentiment(35)).toBe("Fear");
      expect(getRegimeLabelFromSentiment(50)).toBe("Neutral");
      expect(getRegimeLabelFromSentiment(65)).toBe("Greed");
      expect(getRegimeLabelFromSentiment(85)).toBe("Extreme Greed");
    });

    it("should return Neutral label for out-of-range values", () => {
      expect(getRegimeLabelFromSentiment(-10)).toBe("Neutral");
      expect(getRegimeLabelFromSentiment(150)).toBe("Neutral");
    });
  });

  describe("isSentimentInRegime", () => {
    it("should correctly identify sentiment within Extreme Fear regime", () => {
      expect(isSentimentInRegime(0, "ef")).toBe(true);
      expect(isSentimentInRegime(25, "ef")).toBe(true);
      expect(isSentimentInRegime(26, "ef")).toBe(false);
    });

    it("should correctly identify sentiment within Fear regime", () => {
      expect(isSentimentInRegime(25, "f")).toBe(false);
      expect(isSentimentInRegime(26, "f")).toBe(true);
      expect(isSentimentInRegime(45, "f")).toBe(true);
      expect(isSentimentInRegime(46, "f")).toBe(false);
    });

    it("should correctly identify sentiment within Neutral regime", () => {
      expect(isSentimentInRegime(45, "n")).toBe(false);
      expect(isSentimentInRegime(46, "n")).toBe(true);
      expect(isSentimentInRegime(54, "n")).toBe(true);
      expect(isSentimentInRegime(55, "n")).toBe(false);
    });

    it("should correctly identify sentiment within Greed regime", () => {
      expect(isSentimentInRegime(54, "g")).toBe(false);
      expect(isSentimentInRegime(55, "g")).toBe(true);
      expect(isSentimentInRegime(75, "g")).toBe(true);
      expect(isSentimentInRegime(76, "g")).toBe(false);
    });

    it("should correctly identify sentiment within Extreme Greed regime", () => {
      expect(isSentimentInRegime(75, "eg")).toBe(false);
      expect(isSentimentInRegime(76, "eg")).toBe(true);
      expect(isSentimentInRegime(100, "eg")).toBe(true);
    });

    it("should handle invalid regime checks correctly", () => {
      // Out-of-range sentiment defaults to neutral
      expect(isSentimentInRegime(-10, "ef")).toBe(false);
      expect(isSentimentInRegime(-10, "n")).toBe(true);
      expect(isSentimentInRegime(150, "eg")).toBe(false);
      expect(isSentimentInRegime(150, "n")).toBe(true);
    });
  });

  describe("Boundary transitions", () => {
    it("should handle transitions between regimes correctly", () => {
      // ef → f transition at 25/26
      expect(getRegimeFromSentiment(25)).toBe("ef");
      expect(getRegimeFromSentiment(25.1)).toBe("f");
      expect(getRegimeFromSentiment(26)).toBe("f");

      // f → n transition at 45/46
      expect(getRegimeFromSentiment(45)).toBe("f");
      expect(getRegimeFromSentiment(45.1)).toBe("n");
      expect(getRegimeFromSentiment(46)).toBe("n");

      // n → g transition at 54/55
      expect(getRegimeFromSentiment(54)).toBe("n");
      expect(getRegimeFromSentiment(54.1)).toBe("g");
      expect(getRegimeFromSentiment(55)).toBe("g");

      // g → eg transition at 75/76
      expect(getRegimeFromSentiment(75)).toBe("g");
      expect(getRegimeFromSentiment(75.1)).toBe("eg");
      expect(getRegimeFromSentiment(76)).toBe("eg");
    });
  });
});
