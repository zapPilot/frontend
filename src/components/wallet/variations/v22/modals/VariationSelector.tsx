
interface VariationSelectorProps {
  currentVariation: "v3" | "v4" | "v5" | "v6";
  onSelect: (variation: "v3" | "v4" | "v5" | "v6") => void;
}

export function VariationSelector({
  currentVariation: _currentVariation,
  onSelect: _onSelect,
}: VariationSelectorProps) {
  return (
    // Hidden for production/demo unless debug is needed
    <div className="hidden" />
  );
}
