import { describe, expect, it } from "vitest";

import {
  DCA_CLASSIC_STRATEGY_ID,
  DEFAULT_DAYS,
  DEFAULT_TOTAL_CAPITAL,
  SIMPLE_REGIME_STRATEGY_ID,
} from "@/components/wallet/portfolio/views/backtesting/constants";
import {
  buildDefaultPayloadFromCatalog,
  buildDefaultPayloadFromPresets,
  FALLBACK_DEFAULTS,
} from "@/components/wallet/portfolio/views/backtesting/hooks/backtestConfigurationBuilders";
import type { BacktestStrategyCatalogResponseV3 } from "@/types/backtesting";
import type { BacktestDefaults, StrategyPreset } from "@/types/strategy";

// --- Test Helpers ---

function createPreset(
  overrides: Partial<StrategyPreset> & { config_id: string }
): StrategyPreset {
  return {
    display_name: "Test Strategy",
    description: null,
    strategy_id: "simple_regime",
    params: {},
    is_default: false,
    is_benchmark: false,
    ...overrides,
  };
}

const TEST_DEFAULTS: BacktestDefaults = { days: 365, total_capital: 50000 };

// --- Tests ---

describe("FALLBACK_DEFAULTS", () => {
  it("has expected default values from constants", () => {
    expect(FALLBACK_DEFAULTS.days).toBe(DEFAULT_DAYS);
    expect(FALLBACK_DEFAULTS.total_capital).toBe(DEFAULT_TOTAL_CAPITAL);
  });
});

describe("buildDefaultPayloadFromPresets", () => {
  it("includes benchmark and recommended configs when both present", () => {
    const presets = [
      createPreset({
        config_id: "dca_classic",
        strategy_id: "dca_classic",
        is_benchmark: true,
      }),
      createPreset({
        config_id: "regime_v1",
        strategy_id: "simple_regime",
        is_default: true,
        params: { signal_provider: "fgi" },
      }),
    ];

    const result = buildDefaultPayloadFromPresets(presets, TEST_DEFAULTS);

    expect(result.days).toBe(365);
    expect(result.total_capital).toBe(50000);
    expect(result.configs).toHaveLength(2);
    expect(result.configs[0].config_id).toBe("dca_classic");
    expect(result.configs[1].config_id).toBe("regime_v1");
    expect(result.configs[1].params).toEqual({ signal_provider: "fgi" });
  });

  it("includes only benchmark when no recommended preset exists", () => {
    const presets = [
      createPreset({
        config_id: "dca_classic",
        strategy_id: "dca_classic",
        is_benchmark: true,
      }),
    ];

    const result = buildDefaultPayloadFromPresets(presets, TEST_DEFAULTS);

    expect(result.configs).toHaveLength(1);
    expect(result.configs[0].config_id).toBe("dca_classic");
  });

  it("includes only recommended when no benchmark preset exists", () => {
    const presets = [
      createPreset({
        config_id: "regime_v1",
        strategy_id: "simple_regime",
        is_default: true,
      }),
    ];

    const result = buildDefaultPayloadFromPresets(presets, TEST_DEFAULTS);

    expect(result.configs).toHaveLength(1);
    expect(result.configs[0].config_id).toBe("regime_v1");
  });

  it("falls back to DCA classic when no benchmark or recommended found", () => {
    const result = buildDefaultPayloadFromPresets([], TEST_DEFAULTS);

    expect(result.configs).toHaveLength(1);
    expect(result.configs[0].config_id).toBe(DCA_CLASSIC_STRATEGY_ID);
    expect(result.configs[0].strategy_id).toBe(DCA_CLASSIC_STRATEGY_ID);
    expect(result.configs[0].params).toEqual({});
  });

  it("deduplicates when benchmark and recommended share config_id", () => {
    const presets = [
      createPreset({
        config_id: "shared_config",
        strategy_id: "dca_classic",
        is_benchmark: true,
        is_default: true,
      }),
    ];

    const result = buildDefaultPayloadFromPresets(presets, TEST_DEFAULTS);

    // benchmark is added, recommended has same config_id so is skipped
    expect(result.configs).toHaveLength(1);
    expect(result.configs[0].config_id).toBe("shared_config");
  });

  it("uses provided defaults for days and total_capital", () => {
    const customDefaults: BacktestDefaults = {
      days: 730,
      total_capital: 100000,
    };
    const presets = [
      createPreset({
        config_id: "dca_classic",
        strategy_id: "dca_classic",
        is_benchmark: true,
      }),
    ];

    const result = buildDefaultPayloadFromPresets(presets, customDefaults);

    expect(result.days).toBe(730);
    expect(result.total_capital).toBe(100000);
  });

  it("picks first benchmark and first recommended from multiple presets", () => {
    const presets = [
      createPreset({
        config_id: "benchmark_1",
        strategy_id: "dca_classic",
        is_benchmark: true,
      }),
      createPreset({
        config_id: "benchmark_2",
        strategy_id: "dca_classic",
        is_benchmark: true,
      }),
      createPreset({
        config_id: "recommended_1",
        strategy_id: "simple_regime",
        is_default: true,
      }),
      createPreset({
        config_id: "recommended_2",
        strategy_id: "simple_regime",
        is_default: true,
      }),
    ];

    const result = buildDefaultPayloadFromPresets(presets, TEST_DEFAULTS);

    expect(result.configs).toHaveLength(2);
    expect(result.configs[0].config_id).toBe("benchmark_1");
    expect(result.configs[1].config_id).toBe("recommended_1");
  });
});

describe("buildDefaultPayloadFromCatalog", () => {
  it("builds payload with DCA and simple_regime from catalog", () => {
    const catalog: BacktestStrategyCatalogResponseV3 = {
      catalog_version: "3.0",
      strategies: [
        {
          id: SIMPLE_REGIME_STRATEGY_ID,
          display_name: "Simple Regime",
          hyperparam_schema: {},
          recommended_params: { signal_provider: "fgi" },
        },
      ],
    };

    const result = buildDefaultPayloadFromCatalog(catalog, TEST_DEFAULTS);

    expect(result.days).toBe(365);
    expect(result.total_capital).toBe(50000);
    expect(result.configs).toHaveLength(2);
    expect(result.configs[0].config_id).toBe(DCA_CLASSIC_STRATEGY_ID);
    expect(result.configs[0].params).toEqual({});
    expect(result.configs[1].config_id).toBe(SIMPLE_REGIME_STRATEGY_ID);
    expect(result.configs[1].params).toEqual({ signal_provider: "fgi" });
  });

  it("uses empty params when simple_regime not found in catalog", () => {
    const catalog: BacktestStrategyCatalogResponseV3 = {
      catalog_version: "3.0",
      strategies: [],
    };

    const result = buildDefaultPayloadFromCatalog(catalog, TEST_DEFAULTS);

    expect(result.configs[1].params).toEqual({});
  });

  it("uses FALLBACK_DEFAULTS when no defaults provided", () => {
    const result = buildDefaultPayloadFromCatalog(null);

    expect(result.days).toBe(DEFAULT_DAYS);
    expect(result.total_capital).toBe(DEFAULT_TOTAL_CAPITAL);
  });

  it("handles null catalog gracefully", () => {
    const result = buildDefaultPayloadFromCatalog(null, TEST_DEFAULTS);

    expect(result.configs).toHaveLength(2);
    expect(result.configs[0].config_id).toBe(DCA_CLASSIC_STRATEGY_ID);
    expect(result.configs[1].config_id).toBe(SIMPLE_REGIME_STRATEGY_ID);
    expect(result.configs[1].params).toEqual({});
  });

  it("uses custom defaults when provided", () => {
    const customDefaults: BacktestDefaults = {
      days: 180,
      total_capital: 25000,
    };

    const result = buildDefaultPayloadFromCatalog(null, customDefaults);

    expect(result.days).toBe(180);
    expect(result.total_capital).toBe(25000);
  });
});
