import { describe, expect, it } from "vitest";

import {
  DCA_CLASSIC_STRATEGY_ID,
  DEFAULT_DAYS,
  DEFAULT_TOTAL_CAPITAL,
  DMA_GATED_FGI_DEFAULT_CONFIG_ID,
  DMA_GATED_FGI_STRATEGY_ID,
} from "@/components/wallet/portfolio/views/backtesting/constants";
import {
  buildDefaultPayloadFromCatalog,
  buildDefaultPayloadFromPresets,
  FALLBACK_DEFAULTS,
} from "@/components/wallet/portfolio/views/backtesting/hooks/backtestConfigurationBuilders";
import type { BacktestStrategyCatalogResponseV3 } from "@/types/backtesting";
import type { BacktestDefaults, StrategyPreset } from "@/types/strategy";

function createPreset(
  overrides: Partial<StrategyPreset> & { config_id: string }
): StrategyPreset {
  return {
    config_id: overrides.config_id,
    display_name: "Test Strategy",
    description: null,
    strategy_id: "dma_gated_fgi",
    params: {},
    is_default: false,
    is_benchmark: false,
    ...overrides,
  };
}

const TEST_DEFAULTS: BacktestDefaults = { days: 365, total_capital: 50000 };

describe("FALLBACK_DEFAULTS", () => {
  it("uses the configured hard-coded defaults", () => {
    expect(FALLBACK_DEFAULTS.days).toBe(DEFAULT_DAYS);
    expect(FALLBACK_DEFAULTS.total_capital).toBe(DEFAULT_TOTAL_CAPITAL);
  });
});

describe("buildDefaultPayloadFromPresets", () => {
  it("includes benchmark and recommended configs when both are present", () => {
    const presets = [
      createPreset({
        config_id: "dca_classic",
        strategy_id: "dca_classic",
        is_benchmark: true,
      }),
      createPreset({
        config_id: DMA_GATED_FGI_DEFAULT_CONFIG_ID,
        strategy_id: DMA_GATED_FGI_STRATEGY_ID,
        is_default: true,
        params: { pacing_k: 5, pacing_r_max: 1 },
      }),
    ];

    const result = buildDefaultPayloadFromPresets(presets, TEST_DEFAULTS);

    expect(result).toEqual({
      days: 365,
      total_capital: 50000,
      configs: [
        {
          config_id: "dca_classic",
          strategy_id: "dca_classic",
          params: {},
        },
        {
          config_id: DMA_GATED_FGI_DEFAULT_CONFIG_ID,
          strategy_id: DMA_GATED_FGI_STRATEGY_ID,
          params: { pacing_k: 5, pacing_r_max: 1 },
        },
      ],
    });
  });

  it("deduplicates benchmark and recommended when they share a config id", () => {
    const presets = [
      createPreset({
        config_id: "shared_config",
        strategy_id: "dca_classic",
        is_benchmark: true,
        is_default: true,
      }),
    ];

    const result = buildDefaultPayloadFromPresets(presets, TEST_DEFAULTS);

    expect(result.configs).toHaveLength(1);
    expect(result.configs[0]?.config_id).toBe("shared_config");
  });

  it("falls back to dca_classic when no curated presets are available", () => {
    const result = buildDefaultPayloadFromPresets([], TEST_DEFAULTS);

    expect(result.configs).toEqual([
      {
        config_id: DCA_CLASSIC_STRATEGY_ID,
        strategy_id: DCA_CLASSIC_STRATEGY_ID,
        params: {},
      },
    ]);
  });
});

describe("buildDefaultPayloadFromCatalog", () => {
  it("builds a DCA plus DMA payload from the catalog", () => {
    const catalog: BacktestStrategyCatalogResponseV3 = {
      catalog_version: "3.0.0",
      strategies: [
        {
          strategy_id: DMA_GATED_FGI_STRATEGY_ID,
          display_name: "DMA Gated FGI",
          description: "DMA-first strategy",
          param_schema: {},
          default_params: {
            cross_cooldown_days: 30,
            pacing_k: 5,
            pacing_r_max: 1,
          },
          supports_daily_suggestion: true,
        },
      ],
    };

    const result = buildDefaultPayloadFromCatalog(catalog, TEST_DEFAULTS);

    expect(result).toEqual({
      days: 365,
      total_capital: 50000,
      configs: [
        {
          config_id: DCA_CLASSIC_STRATEGY_ID,
          strategy_id: DCA_CLASSIC_STRATEGY_ID,
          params: {},
        },
        {
          config_id: DMA_GATED_FGI_DEFAULT_CONFIG_ID,
          strategy_id: DMA_GATED_FGI_STRATEGY_ID,
          params: {
            cross_cooldown_days: 30,
            pacing_k: 5,
            pacing_r_max: 1,
          },
        },
      ],
    });
  });

  it("uses empty params when the DMA strategy is missing from the catalog", () => {
    const catalog: BacktestStrategyCatalogResponseV3 = {
      catalog_version: "3.0.0",
      strategies: [],
    };

    const result = buildDefaultPayloadFromCatalog(catalog, TEST_DEFAULTS);

    expect(result.configs[1]).toEqual({
      config_id: DMA_GATED_FGI_DEFAULT_CONFIG_ID,
      strategy_id: DMA_GATED_FGI_STRATEGY_ID,
      params: {},
    });
  });

  it("uses fallback defaults when no defaults are provided", () => {
    const result = buildDefaultPayloadFromCatalog(null);

    expect(result.days).toBe(DEFAULT_DAYS);
    expect(result.total_capital).toBe(DEFAULT_TOTAL_CAPITAL);
  });
});
