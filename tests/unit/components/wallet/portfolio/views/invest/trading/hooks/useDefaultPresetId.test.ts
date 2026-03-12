import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useDefaultPresetId } from "@/components/wallet/portfolio/views/invest/trading/hooks/useDefaultPresetId";
import { useStrategyConfigs } from "@/components/wallet/portfolio/views/invest/trading/hooks/useStrategyConfigs";
import type { StrategyConfigsResponse, StrategyPreset } from "@/types/strategy";

vi.mock(
  "@/components/wallet/portfolio/views/invest/trading/hooks/useStrategyConfigs",
  () => ({
    useStrategyConfigs: vi.fn(),
  })
);

function createPreset(
  overrides: Partial<StrategyPreset> & { config_id: string }
): StrategyPreset {
  return {
    config_id: overrides.config_id,
    display_name: "Preset",
    description: null,
    strategy_id: "dma_gated_fgi",
    params: {},
    is_default: false,
    is_benchmark: false,
    ...overrides,
  };
}

function mockUseStrategyConfigs(
  data: StrategyConfigsResponse | undefined | null
) {
  vi.mocked(useStrategyConfigs).mockReturnValue({
    data,
    isLoading: false,
    isSuccess: true,
    isError: false,
    error: null,
  } as any);
}

describe("useDefaultPresetId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns undefined while configs are unavailable", () => {
    mockUseStrategyConfigs(undefined);

    const { result } = renderHook(() => useDefaultPresetId(true));

    expect(result.current).toBeUndefined();
  });

  it("prefers dma_gated_fgi_default when present", () => {
    mockUseStrategyConfigs({
      presets: [
        createPreset({ config_id: "some_other_default", is_default: true }),
        createPreset({ config_id: "dma_gated_fgi_default" }),
      ],
      backtest_defaults: { days: 500, total_capital: 10000 },
    });

    const { result } = renderHook(() => useDefaultPresetId(true));

    expect(result.current).toBe("dma_gated_fgi_default");
  });

  it("falls back to the backend default flag when the curated id is absent", () => {
    mockUseStrategyConfigs({
      presets: [
        createPreset({ config_id: "dca_classic", strategy_id: "dca_classic" }),
        createPreset({ config_id: "dma_live_v2", is_default: true }),
      ],
      backtest_defaults: { days: 500, total_capital: 10000 },
    });

    const { result } = renderHook(() => useDefaultPresetId(true));

    expect(result.current).toBe("dma_live_v2");
  });

  it("falls back to the first dma_gated_fgi preset", () => {
    mockUseStrategyConfigs({
      presets: [
        createPreset({ config_id: "dca_classic", strategy_id: "dca_classic" }),
        createPreset({ config_id: "dma_alt_1" }),
        createPreset({ config_id: "dma_alt_2" }),
      ],
      backtest_defaults: { days: 500, total_capital: 10000 },
    });

    const { result } = renderHook(() => useDefaultPresetId(true));

    expect(result.current).toBe("dma_alt_1");
  });

  it("falls back to the first preset when there is no DMA strategy", () => {
    mockUseStrategyConfigs({
      presets: [
        createPreset({
          config_id: "dca_classic",
          strategy_id: "dca_classic",
          is_benchmark: true,
        }),
      ],
      backtest_defaults: { days: 500, total_capital: 10000 },
    });

    const { result } = renderHook(() => useDefaultPresetId(true));

    expect(result.current).toBe("dca_classic");
  });

  it("passes enabled through to useStrategyConfigs", () => {
    mockUseStrategyConfigs({
      presets: [],
      backtest_defaults: { days: 500, total_capital: 10000 },
    });

    renderHook(() => useDefaultPresetId(false));

    expect(useStrategyConfigs).toHaveBeenCalledWith(false);
  });
});
