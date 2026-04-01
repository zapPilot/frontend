import type {
  BacktestRequest,
  BacktestStrategyCatalogResponseV3,
} from "@/types/backtesting";
import type { BacktestDefaults, StrategyPreset } from "@/types/strategy";

import {
  DEFAULT_DAYS,
  DEFAULT_TOTAL_CAPITAL,
  ETH_BTC_ROTATION_DEFAULT_CONFIG_ID,
  ETH_BTC_ROTATION_STRATEGY_ID,
} from "../constants";

/** Fallback defaults when API response is unavailable. */
export const FALLBACK_DEFAULTS: BacktestDefaults = {
  days: DEFAULT_DAYS,
  total_capital: DEFAULT_TOTAL_CAPITAL,
};

/**
 * Build default backtest payload from curated strategy presets.
 * Sends only the default (first) preset to avoid unnecessary backend computation.
 * The backend compare endpoint auto-injects the DCA baseline when needed.
 */
export function buildDefaultPayloadFromPresets(
  presets: StrategyPreset[],
  defaults: BacktestDefaults
): BacktestRequest {
  const seenConfigIds = new Set<string>();
  const orderedPresets = [...presets].sort(
    (left, right) => Number(right.is_default) - Number(left.is_default)
  );

  // Find the first non-duplicate preset (the default one)
  const defaultPreset = orderedPresets.find(preset => {
    if (seenConfigIds.has(preset.config_id)) {
      return false;
    }
    seenConfigIds.add(preset.config_id);
    return true;
  });

  if (!defaultPreset) {
    return buildDefaultPayloadFromCatalog(null, defaults);
  }

  return {
    days: defaults.days,
    total_capital: defaults.total_capital,
    configs: [
      {
        config_id: defaultPreset.config_id,
        strategy_id: defaultPreset.strategy_id,
        params: defaultPreset.params,
      },
    ],
  };
}

/**
 * Build a single live-strategy payload from the catalog fallback.
 * The backend compare endpoint auto-injects the DCA baseline.
 */
export function buildDefaultPayloadFromCatalog(
  catalog: BacktestStrategyCatalogResponseV3 | null,
  defaults: BacktestDefaults = FALLBACK_DEFAULTS
): BacktestRequest {
  const ethBtcRotation = catalog?.strategies.find(
    strategy => strategy.strategy_id === ETH_BTC_ROTATION_STRATEGY_ID
  );
  const defaultParams = ethBtcRotation?.default_params ?? {};

  return {
    days: defaults.days,
    total_capital: defaults.total_capital,
    configs: [
      {
        config_id: ETH_BTC_ROTATION_DEFAULT_CONFIG_ID,
        strategy_id: ETH_BTC_ROTATION_STRATEGY_ID,
        params: defaultParams,
      },
    ],
  };
}
