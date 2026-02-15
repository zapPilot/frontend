import type {
  BacktestRequest,
  BacktestStrategyCatalogResponseV3,
} from "@/types/backtesting";
import type { BacktestDefaults, StrategyPreset } from "@/types/strategy";

import {
  DCA_CLASSIC_STRATEGY_ID,
  DEFAULT_DAYS,
  DEFAULT_TOTAL_CAPITAL,
  SIMPLE_REGIME_STRATEGY_ID,
} from "../constants";

/** Fallback defaults when API response is unavailable. */
export const FALLBACK_DEFAULTS: BacktestDefaults = {
  days: DEFAULT_DAYS,
  total_capital: DEFAULT_TOTAL_CAPITAL,
};

/**
 * Build default backtest payload from curated strategy presets.
 * Uses benchmark (baseline) and default (recommended) presets,
 * plus backtest defaults from the API.
 */
export function buildDefaultPayloadFromPresets(
  presets: StrategyPreset[],
  defaults: BacktestDefaults
): BacktestRequest {
  const benchmark = presets.find(preset => preset.is_benchmark);
  const recommended = presets.find(preset => preset.is_default);
  const configs: BacktestRequest["configs"] = [];

  if (benchmark) {
    configs.push({
      config_id: benchmark.config_id,
      strategy_id: benchmark.strategy_id,
      params: benchmark.params,
    });
  }

  if (recommended && recommended.config_id !== benchmark?.config_id) {
    configs.push({
      config_id: recommended.config_id,
      strategy_id: recommended.strategy_id,
      params: recommended.params,
    });
  }

  if (configs.length === 0) {
    configs.push({
      config_id: DCA_CLASSIC_STRATEGY_ID,
      strategy_id: DCA_CLASSIC_STRATEGY_ID,
      params: {},
    });
  }

  return {
    days: defaults.days,
    total_capital: defaults.total_capital,
    configs,
  };
}

/**
 * Legacy fallback: build payload from catalog (used before presets load).
 */
export function buildDefaultPayloadFromCatalog(
  catalog: BacktestStrategyCatalogResponseV3 | null,
  defaults: BacktestDefaults = FALLBACK_DEFAULTS
): BacktestRequest {
  const simpleRegime = catalog?.strategies.find(
    strategy => strategy.id === SIMPLE_REGIME_STRATEGY_ID
  );
  const recommendedParams = simpleRegime?.recommended_params ?? {};

  return {
    days: defaults.days,
    total_capital: defaults.total_capital,
    configs: [
      {
        config_id: DCA_CLASSIC_STRATEGY_ID,
        strategy_id: DCA_CLASSIC_STRATEGY_ID,
        params: {},
      },
      {
        config_id: SIMPLE_REGIME_STRATEGY_ID,
        strategy_id: SIMPLE_REGIME_STRATEGY_ID,
        params: recommendedParams,
      },
    ],
  };
}
