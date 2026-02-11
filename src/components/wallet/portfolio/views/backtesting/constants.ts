/** Canonical strategy ID for the regime-based strategy used across configuration helpers. */
export const SIMPLE_REGIME_STRATEGY_ID = "simple_regime";

export const SIGNAL_PROVIDER_OPTIONS = [
  { value: "", label: "default" },
  { value: "fgi", label: "fgi" },
  { value: "hybrid_fgi_dma", label: "hybrid_fgi_dma" },
  { value: "dma_200", label: "dma_200" },
  { value: "vix", label: "vix" },
  { value: "mvrv", label: "mvrv" },
] as const;

export const PACING_POLICY_OPTIONS = [
  { value: "fgi_exponential", label: "fgi_exponential" },
] as const;
