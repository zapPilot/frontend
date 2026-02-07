import type { StrategyPreset } from "@/types/strategy";

interface StrategyPresetSelectorProps {
  presets: StrategyPreset[];
  selectedConfigId: string;
  onSelect: (configId: string) => void;
}

export function StrategyPresetSelector({
  presets,
  selectedConfigId,
  onSelect,
}: StrategyPresetSelectorProps) {
  const selected = presets.find(p => p.config_id === selectedConfigId);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-4">
        <label className="text-xs font-medium text-gray-400">
          Strategy preset
        </label>
        <select
          value={selectedConfigId}
          onChange={e => onSelect(e.target.value)}
          className="text-sm bg-white/5 text-white rounded-md px-3 py-2 border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
        >
          {presets.map(preset => (
            <option key={preset.config_id} value={preset.config_id}>
              {preset.display_name}
              {preset.is_default ? " (Recommended)" : ""}
            </option>
          ))}
        </select>
      </div>

      {selected?.description ? (
        <p className="text-xs text-gray-500 leading-snug">
          {selected.description}
        </p>
      ) : null}
    </div>
  );
}
