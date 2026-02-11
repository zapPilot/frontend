import { useQuery } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, Mock, vi } from "vitest";

import {
  strategyConfigKeys,
  useStrategyConfigs,
} from "@/components/wallet/portfolio/views/invest/trading/hooks/useStrategyConfigs";
import { getStrategyConfigs } from "@/services/strategyService";
import type { StrategyPreset } from "@/types/strategy";

// Mock dependencies
vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
}));

vi.mock("@/services/strategyService", () => ({
  getStrategyConfigs: vi.fn(),
}));

const mockPresets: StrategyPreset[] = [
  {
    config_id: "fgi_exponential",
    display_name: "FGI Exponential",
    description: "Front-loaded rebalancing using FGI exponential pacing",
    strategy_id: "simple_regime",
    params: { k: 3.0 },
    is_default: true,
  },
  {
    config_id: "regime_mapping",
    display_name: "Regime-Based",
    description: null,
    strategy_id: "simple_regime",
    params: {},
    is_default: false,
  },
];

describe("useStrategyConfigs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls useQuery with correct options", () => {
    renderHook(() => useStrategyConfigs());

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["strategy-configs"],
        enabled: true,
        staleTime: 24 * 60 * 60 * 1000, // 24h
        gcTime: 48 * 60 * 60 * 1000, // 48h
        retry: 1,
      })
    );
  });

  it("calls getStrategyConfigs as queryFn", () => {
    renderHook(() => useStrategyConfigs());

    const callArgs = (useQuery as Mock).mock.calls[0][0];
    expect(callArgs.queryFn).toBeDefined();
    // Verify the queryFn calls the service
    callArgs.queryFn();
    expect(getStrategyConfigs).toHaveBeenCalled();
  });

  it("returns presets data on successful fetch", () => {
    (useQuery as Mock).mockReturnValue({
      data: mockPresets,
      isLoading: false,
      isError: false,
      error: null,
    });

    const { result } = renderHook(() => useStrategyConfigs());

    expect(result.current.data).toEqual(mockPresets);
    expect(result.current.isLoading).toBe(false);
  });

  it("shows isLoading=true while fetching", () => {
    (useQuery as Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });

    const { result } = renderHook(() => useStrategyConfigs());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it("handles API errors gracefully", () => {
    const mockError = new Error("Network error");
    (useQuery as Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: mockError,
    });

    const { result } = renderHook(() => useStrategyConfigs());

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBe(mockError);
  });

  it("retries once on failure (retry: 1)", () => {
    renderHook(() => useStrategyConfigs());

    const callArgs = (useQuery as Mock).mock.calls[0][0];
    expect(callArgs.retry).toBe(1);
  });

  it("skips fetch when enabled=false", () => {
    renderHook(() => useStrategyConfigs(false));

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      })
    );
  });

  it("exports strategyConfigKeys.all for cache invalidation", () => {
    expect(strategyConfigKeys.all).toEqual(["strategy-configs"]);
  });
});
