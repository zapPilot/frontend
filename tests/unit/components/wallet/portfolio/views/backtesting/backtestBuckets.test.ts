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

  it("uses the provided spot asset label and chart indigo color for ETH", () => {
    expect(
      buildBacktestAllocationSegments(
        {
          spot: 0.6,
          stable: 0.4,
        },
        "ETH"
      )
    ).toEqual([
      {
        category: "btc",
        label: "ETH",
        percentage: 60,
        color: "#6366f1",
      },
      {
        category: "stable",
        label: "STABLE",
        percentage: 40,
        color: "#10b981",
      },
    ]);
  });

  it("uses chart amber color for BTC spot asset label", () => {
    expect(
      buildBacktestAllocationSegments(
        {
          spot: 0.7,
          stable: 0.3,
        },
        "BTC"
      )
    ).toEqual([
      {
        category: "btc",
        label: "BTC",
        percentage: 70,
        color: "#f59e0b",
      },
      {
        category: "stable",
        label: "STABLE",
        percentage: 30,
        color: "#10b981",
      },
    ]);
  });

  it("keeps default amber color when no spotAssetLabel is provided", () => {
    const segments = buildBacktestAllocationSegments({
      spot: 0.5,
      stable: 0.5,
    });
    const spotSegment = segments.find(s => s.label === "SPOT");
    expect(spotSegment?.color).toBe("#f59e0b");
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
