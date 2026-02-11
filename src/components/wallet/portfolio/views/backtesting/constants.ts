/** Canonical strategy ID for the regime-based strategy used across configuration helpers. */
export const SIMPLE_REGIME_STRATEGY_ID = "simple_regime";

/** Canonical strategy ID for the DCA classic (benchmark) strategy. */
export const DCA_CLASSIC_STRATEGY_ID = "dca_classic";

/** Default total capital when the API does not provide backtest defaults. */
export const DEFAULT_TOTAL_CAPITAL = 10000;

/** Available signal-provider options for the regime strategy backtest controls. */
export const SIGNAL_PROVIDER_OPTIONS = [
  { value: "", label: "default" },
  { value: "fgi", label: "fgi" },
  { value: "hybrid_fgi_dma", label: "hybrid_fgi_dma" },
  { value: "hybrid_dma_fgi", label: "hybrid_dma_fgi" },
  { value: "dma_200", label: "dma_200" },
  { value: "vix", label: "vix" },
  { value: "mvrv", label: "mvrv" },
] as const;

/** Available pacing-policy options for the regime strategy backtest controls. */
export const PACING_POLICY_OPTIONS = [
  { value: "fgi_exponential", label: "fgi_exponential" },
] as const;
