import { describe, expect, it } from "vitest";

import {
  deriveRoiWindowSortScore,
  formatRoiWindowLabel,
} from "../../../src/lib/roi";

describe("roi utils", () => {
  describe("deriveRoiWindowSortScore", () => {
    it("handles days", () => {
      expect(deriveRoiWindowSortScore("roi_7d")).toBe(7);
    });
    it("handles weeks", () => {
      expect(deriveRoiWindowSortScore("roi_2w")).toBe(14);
    });
    it("handles months", () => {
      expect(deriveRoiWindowSortScore("roi_3m")).toBe(90);
    });
    it("handles years", () => {
      expect(deriveRoiWindowSortScore("roi_1y")).toBe(365);
    });
    it("fallbacks to max for unknown", () => {
      expect(deriveRoiWindowSortScore("roi_all")).toBe(Number.MAX_SAFE_INTEGER);
      expect(deriveRoiWindowSortScore("roi_abc")).toBe(Number.MAX_SAFE_INTEGER);
    });
  });

  describe("formatRoiWindowLabel", () => {
    it("formats known periods", () => {
      expect(formatRoiWindowLabel("roi_7d")).toBe("7 days");
      expect(formatRoiWindowLabel("roi_2w")).toBe("2 weeks");
      expect(formatRoiWindowLabel("roi_3m")).toBe("3 months");
      expect(formatRoiWindowLabel("roi_1y")).toBe("1 years");
    });
    it("formats all time", () => {
      expect(formatRoiWindowLabel("roi_all")).toBe("All time");
    });
    it("passes through unknown", () => {
      expect(formatRoiWindowLabel("roi_custom")).toBe("custom");
    });
  });
});
