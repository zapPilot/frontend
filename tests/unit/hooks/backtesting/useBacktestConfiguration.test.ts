import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useBacktestConfiguration } from "@/components/wallet/portfolio/views/backtesting/hooks/useBacktestConfiguration";
import { useBacktestMutation } from "@/hooks/mutations/useBacktestMutation";
import { getBacktestingStrategiesV3 } from "@/services/backtestingService";
import { getStrategyConfigs } from "@/services/strategyService";

vi.mock("@/services/strategyService", () => ({
  getStrategyConfigs: vi.fn(),
}));

vi.mock("@/services/backtestingService", () => ({
  getBacktestingStrategiesV3: vi.fn(),
}));

vi.mock("@/hooks/mutations/useBacktestMutation", () => ({
  useBacktestMutation: vi.fn(),
}));

describe("useBacktestConfiguration regressions", () => {
  const mockMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useBacktestMutation).mockReturnValue({
      mutate: mockMutate,
      data: null,
      isPending: false,
      error: null,
    } as any);
  });

  it("waits for defaults before the initial compare run", async () => {
    let resolvePresets: ((value: any) => void) | undefined;
    let resolveCatalog: ((value: any) => void) | undefined;

    vi.mocked(getStrategyConfigs).mockImplementation(
      () =>
        new Promise(resolve => {
          resolvePresets = resolve;
        })
    );
    vi.mocked(getBacktestingStrategiesV3).mockImplementation(
      () =>
        new Promise(resolve => {
          resolveCatalog = resolve;
        })
    );

    renderHook(() => useBacktestConfiguration());

    expect(mockMutate).not.toHaveBeenCalled();

    resolvePresets?.({
      presets: [
        {
          config_id: "dma_gated_fgi_default",
          display_name: "DMA Gated FGI Default",
          description: "Curated DMA-first preset",
          strategy_id: "dma_gated_fgi",
          params: { pacing_k: 5, pacing_r_max: 1 },
          is_benchmark: false,
          is_default: true,
        },
      ],
      backtest_defaults: {
        days: 120,
        total_capital: 15000,
      },
    });
    resolveCatalog?.({
      catalog_version: "2.0.0",
      strategies: [],
    });

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledTimes(1);
    });
  });

  it("keeps manual editor changes intact when late defaults arrive", async () => {
    vi.mocked(getStrategyConfigs).mockImplementation(
      () =>
        new Promise(resolve => {
          setTimeout(
            () =>
              resolve({
                presets: [],
                backtest_defaults: {
                  days: 500,
                  total_capital: 10000,
                },
              }),
            50
          );
        })
    );
    vi.mocked(getBacktestingStrategiesV3).mockResolvedValue({
      catalog_version: "2.0.0",
      strategies: [],
    });

    const { result } = renderHook(() => useBacktestConfiguration());

    act(() => {
      result.current.updateEditorValue('{"manual":true}');
    });

    await waitFor(() => {
      expect(getStrategyConfigs).toHaveBeenCalled();
    });

    expect(result.current.editorValue).toBe('{"manual":true}');
  });
});
