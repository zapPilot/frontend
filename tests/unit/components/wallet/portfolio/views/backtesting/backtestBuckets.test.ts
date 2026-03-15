import { describe, expect, it } from "vitest";

import {
  BACKTEST_BUCKETS,
  buildBacktestAllocationSegments,
  getBacktestTransferDirection,
  hasBacktestAllocation,
  isBacktestBucket,
  isBacktestTransfer,
} from "@/components/wallet/portfolio/views/backtesting/backtestBuckets";

describe("backtestBuckets", () => {
  it("defines the canonical two-bucket order", () => {
    expect(BACKTEST_BUCKETS).toEqual(["spot", "stable"]);
  });

  it("recognizes valid buckets only", () => {
    expect(isBacktestBucket("spot")).toBe(true);
    expect(isBacktestBucket("stable")).toBe(true);
    expect(isBacktestBucket("lp")).toBe(false);
  });

  it("validates two-bucket transfers only", () => {
    expect(
      isBacktestTransfer({
        from_bucket: "stable",
        to_bucket: "spot",
        amount_usd: 100,
      })
    ).toBe(true);

    expect(
      isBacktestTransfer({
        from_bucket: "stable",
        to_bucket: "lp",
        amount_usd: 100,
      })
    ).toBe(false);
  });

  it("maps allocation ratios to UI segments", () => {
    expect(
      buildBacktestAllocationSegments({
        spot: 0.6,
        stable: 0.4,
      })
    ).toEqual([
      {
        category: "btc",
        label: "SPOT",
        percentage: 60,
        color: "#f59e0b",
      },
      {
        category: "stable",
        label: "STABLE",
        percentage: 40,
        color: "#10b981",
      },
    ]);
  });

  it("treats zero allocation as empty and classifies supported directions", () => {
    expect(hasBacktestAllocation({ spot: 0, stable: 0 })).toBe(false);
    expect(getBacktestTransferDirection("stable", "spot")).toBe(
      "stable_to_spot"
    );
    expect(getBacktestTransferDirection("spot", "stable")).toBe(
      "spot_to_stable"
    );
  });
});
