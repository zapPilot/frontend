interface VariationSelectorProps {
  currentVariation: "v3" | "v4" | "v5" | "v6";
  onSelect: (variation: "v3" | "v4" | "v5" | "v6") => void;
}

// Component is intentionally disabled; props kept for interface compatibility
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function VariationSelector(_props: VariationSelectorProps) {
  return (
    // Hidden for production/demo unless debug is needed
    <div className="hidden" />
  );
}
