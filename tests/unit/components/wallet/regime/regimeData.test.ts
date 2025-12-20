import { describe, expect, it } from "vitest";

import {
  regimes,
  type RegimeStrategy,
} from "../../../../../src/components/wallet/regime/regimeData";

describe("regimeData Validation", () => {
  it("should have valid philosophy and author on all strategies", () => {
    for (const regime of regimes) {
      // Check specific strategies based on type guards or property checks
      if (regime.strategies.fromLeft) {
        expect(regime.strategies.fromLeft.philosophy).toBeDefined();
        expect(regime.strategies.fromLeft.author).toBeDefined();
        expect(typeof regime.strategies.fromLeft.philosophy).toBe("string");
        expect(typeof regime.strategies.fromLeft.author).toBe("string");
      }

      if (regime.strategies.fromRight) {
        expect(regime.strategies.fromRight.philosophy).toBeDefined();
        expect(regime.strategies.fromRight.author).toBeDefined();
        expect(typeof regime.strategies.fromRight.philosophy).toBe("string");
        expect(typeof regime.strategies.fromRight.author).toBe("string");
      }

      // Check default only if it exists (TS Union checking)
      if ("default" in regime.strategies && regime.strategies.default) {
        const strat = regime.strategies.default as RegimeStrategy;
        expect(strat.philosophy).toBeDefined();
        expect(strat.author).toBeDefined();
        expect(typeof strat.philosophy).toBe("string");
        expect(typeof strat.author).toBe("string");
      }
    }
  });

  it("should enforce mutual exclusivity: strategies should not have 'default' if 'fromLeft'/'fromRight' are present", () => {
    for (const regime of regimes) {
      const hasDirectional =
        "fromLeft" in regime.strategies || "fromRight" in regime.strategies;
      const hasDefault = "default" in regime.strategies;

      if (hasDirectional) {
        expect(hasDefault).toBe(false);
      } else {
        expect(hasDefault).toBe(true);
      }
    }
  });

  it("should valid visual configuration on all regimes", () => {
    for (const regime of regimes) {
      expect(regime.visual).toBeDefined();
      expect(regime.visual.badge).toBeDefined();
      expect(regime.visual.gradient).toBeDefined();
      expect(regime.visual.icon).toBeDefined();
    }
  });
});
