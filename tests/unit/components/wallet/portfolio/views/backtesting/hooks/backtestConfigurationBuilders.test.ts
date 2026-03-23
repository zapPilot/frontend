import { describe, expect, it } from "vitest";

import {
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
  it("sends only the default preset to minimize backend computation", () => {
    const presets = [
      createPreset({
        config_id: "dma_gated_fgi_alt",
        strategy_id: DMA_GATED_FGI_STRATEGY_ID,
        params: { pacing_k: 3, pacing_r_max: 0.8 },
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
          config_id: DMA_GATED_FGI_DEFAULT_CONFIG_ID,
          strategy_id: DMA_GATED_FGI_STRATEGY_ID,
          params: { pacing_k: 5, pacing_r_max: 1 },
        },
      ],
    });
  });

  it("deduplicates duplicate preset config ids", () => {
    const presets = [
      createPreset({
        config_id: "shared_config",
        strategy_id: DMA_GATED_FGI_STRATEGY_ID,
        is_default: true,
      }),
      createPreset({
        config_id: "shared_config",
        strategy_id: DMA_GATED_FGI_STRATEGY_ID,
        is_default: false,
      }),
    ];

    const result = buildDefaultPayloadFromPresets(presets, TEST_DEFAULTS);

    expect(result.configs).toHaveLength(1);
    expect(result.configs[0]?.config_id).toBe("shared_config");
  });

  it("falls back to the canonical DMA payload when no presets are available", () => {
    const result = buildDefaultPayloadFromPresets([], TEST_DEFAULTS);

    expect(result.configs).toEqual([
      {
        config_id: DMA_GATED_FGI_DEFAULT_CONFIG_ID,
        strategy_id: DMA_GATED_FGI_STRATEGY_ID,
        params: {},
      },
    ]);
  });

  it("uses the single preset when only one is available", () => {
    const presets = [
      createPreset({
        config_id: "only_one",
        strategy_id: "eth_btc_rotation",
        params: { k: 2 },
      }),
    ];

    const result = buildDefaultPayloadFromPresets(presets, TEST_DEFAULTS);

    expect(result.configs).toHaveLength(1);
    expect(result.configs[0]).toEqual({
      config_id: "only_one",
      strategy_id: "eth_btc_rotation",
      params: { k: 2 },
    });
  });

  it("picks the first preset in original order when none is marked as default", () => {
    const presets = [
      createPreset({
        config_id: "first_non_default",
        strategy_id: DMA_GATED_FGI_STRATEGY_ID,
        params: { k: 1 },
      }),
      createPreset({
        config_id: "second_non_default",
        strategy_id: "eth_btc_rotation",
        params: { k: 2 },
      }),
    ];

    const result = buildDefaultPayloadFromPresets(presets, TEST_DEFAULTS);

    expect(result.configs).toHaveLength(1);
    expect(result.configs[0]?.config_id).toBe("first_non_default");
  });

  it("promotes the default preset to first even when it is in the middle of the input", () => {
    const presets = [
      createPreset({
        config_id: "before",
        strategy_id: DMA_GATED_FGI_STRATEGY_ID,
      }),
      createPreset({
        config_id: "the_default",
        strategy_id: DMA_GATED_FGI_STRATEGY_ID,
        is_default: true,
      }),
      createPreset({
        config_id: "after",
        strategy_id: DMA_GATED_FGI_STRATEGY_ID,
      }),
    ];

    const result = buildDefaultPayloadFromPresets(presets, TEST_DEFAULTS);

    expect(result.configs).toHaveLength(1);
    expect(result.configs[0]?.config_id).toBe("the_default");
  });

  it("uses days and total_capital from the provided defaults, not the preset", () => {
    const presets = [
      createPreset({
        config_id: "x",
        strategy_id: DMA_GATED_FGI_STRATEGY_ID,
        is_default: true,
      }),
    ];
    const customDefaults: BacktestDefaults = {
      days: 90,
      total_capital: 99999,
    };

    const result = buildDefaultPayloadFromPresets(presets, customDefaults);

    expect(result.days).toBe(90);
    expect(result.total_capital).toBe(99999);
  });
});

describe("buildDefaultPayloadFromCatalog", () => {
  it("builds a DCA plus DMA payload from the catalog", () => {
    const catalog: BacktestStrategyCatalogResponseV3 = {
      catalog_version: "2.0.0",
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
      catalog_version: "2.0.0",
      strategies: [],
    };

    const result = buildDefaultPayloadFromCatalog(catalog, TEST_DEFAULTS);

    expect(result.configs[0]).toEqual({
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
