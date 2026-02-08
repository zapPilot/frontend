import { useMemo } from "react";

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
export function useDefaultPresetId(enabled: boolean) {
  const { data: configsResponse } = useStrategyConfigs(enabled);

  return useMemo(() => {
    const presets = configsResponse?.presets ?? [];
    const regimePreset = presets.find(p => p.strategy_id === "simple_regime");
    return regimePreset?.config_id ?? presets[0]?.config_id;
  }, [configsResponse]);
}
