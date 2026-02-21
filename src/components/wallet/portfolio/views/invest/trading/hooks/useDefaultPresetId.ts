import { SIMPLE_REGIME_STRATEGY_ID } from "@/components/wallet/portfolio/views/backtesting/constants";

import { useStrategyConfigs } from "./useStrategyConfigs";

/**
 * Derives the default preset config ID from strategy configs.
 *
 * Selects the "simple_regime" strategy if available, otherwise falls back
 * to the first preset.
 *
 * @param enabled - Whether to enable the underlying configs query
 * @returns The config_id of the default preset, or undefined if not yet loaded
 */
export function useDefaultPresetId(enabled: boolean): string | undefined {
  const { data: configsResponse } = useStrategyConfigs(enabled);

  const presets = configsResponse?.presets ?? [];
  const regimePreset = presets.find(
    p => p.strategy_id === SIMPLE_REGIME_STRATEGY_ID
  );
  return regimePreset?.config_id ?? presets[0]?.config_id;
}
