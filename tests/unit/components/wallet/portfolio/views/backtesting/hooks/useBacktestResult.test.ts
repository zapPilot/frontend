import { useQuery } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useBacktestResult } from "@/components/wallet/portfolio/views/backtesting/hooks/useBacktestResult";

vi.mock("@/services/analyticsService", () => ({
  getMarketDashboardData: vi.fn(),
}));

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return {
    ...actual,
    useQuery: vi.fn(),
  };
});

vi.mock(
  "@/components/wallet/portfolio/views/backtesting/utils/chartHelpers",
  () => ({
    calculateActualDays: vi.fn(
      (timeline: unknown[]) => (timeline as unknown[]).length
    ),
    buildChartPoint: vi.fn((point: Record<string, unknown>) => ({
      date: point.date,
    })),
    calculateYAxisDomain: vi.fn(() => [0, 1000] as [number, number]),
    sortStrategyIds: vi.fn((ids: string[]) => [...ids].sort()),
  })
);

describe("useBacktestResult", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useQuery).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);
  });

  it("returns defaults when response is null", () => {
    const { result } = renderHook(() => useBacktestResult(null));
    expect(result.current.chartData).toEqual([]);
    expect(result.current.actualDays).toBe(0);
    expect(result.current.summary).toBeNull();
    expect(result.current.sortedStrategyIds).toEqual([]);
  });

  it("processes response with strategies and timeline", () => {
    const response = {
      timeline: [{ date: "2025-01-01" }, { date: "2025-01-02" }],
      strategies: { strat_a: { name: "A" }, strat_b: { name: "B" } },
    };
    const { result } = renderHook(() => useBacktestResult(response as any));
    expect(result.current.actualDays).toBe(2);
    expect(result.current.chartData).toHaveLength(2);
    expect(result.current.summary).toEqual({
      strategies: response.strategies,
    });
    expect(result.current.sortedStrategyIds).toEqual(["strat_a", "strat_b"]);
  });

  it("handles response with null strategies", () => {
    const response = {
      timeline: [{ date: "2025-01-01" }],
      strategies: null,
    };
    const { result } = renderHook(() => useBacktestResult(response as any));
    expect(result.current.sortedStrategyIds).toEqual([]);
  });

  it("uses market dashboard data when available", () => {
    vi.mocked(useQuery).mockReturnValue({
      data: {
        snapshots: [{ snapshot_date: "2025-01-01", price_usd: 42000 }],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    const response = {
      timeline: [{ date: "2025-01-01" }],
      strategies: { strat_a: { name: "A" } },
    };
    const { result } = renderHook(() => useBacktestResult(response as any));
    expect(result.current.chartData).toHaveLength(1);
  });

  it("handles null market dashboard snapshots", () => {
    vi.mocked(useQuery).mockReturnValue({
      data: { snapshots: null },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    const response = {
      timeline: [{ date: "2025-01-01" }],
      strategies: { strat_a: { name: "A" } },
    };
    const { result } = renderHook(() => useBacktestResult(response as any));
    expect(result.current.chartData).toHaveLength(1);
  });

  it("handles response with undefined market dashboard", () => {
    vi.mocked(useQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    const response = {
      timeline: [{ date: "2025-01-01" }],
      strategies: { strat_a: { name: "A" } },
    };
    const { result } = renderHook(() => useBacktestResult(response as any));
    expect(result.current.chartData).toHaveLength(1);
  });

  it("returns yAxisDomain from calculateYAxisDomain", () => {
    const response = {
      timeline: [{ date: "2025-01-01" }],
      strategies: { strat_a: { name: "A" } },
    };
    const { result } = renderHook(() => useBacktestResult(response as any));
    expect(result.current.yAxisDomain).toEqual([0, 1000]);
  });
});
