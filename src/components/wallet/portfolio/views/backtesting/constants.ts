/** Canonical strategy ID for the DMA-first strategy used across configuration helpers. */
export const DMA_GATED_FGI_STRATEGY_ID = "dma_gated_fgi";

/** Default curated preset config ID served by the backend. */
export const DMA_GATED_FGI_DEFAULT_CONFIG_ID = "dma_gated_fgi_default";

/** Canonical strategy ID for the DCA classic (benchmark) strategy. */
export const DCA_CLASSIC_STRATEGY_ID = "dca_classic";

/** Default total capital when the API does not provide backtest defaults. */
export const DEFAULT_TOTAL_CAPITAL = 10000;

/** Default number of simulation days when no API default is available. */
export const DEFAULT_DAYS = 500;

/** Fixed pacing engine used by the DMA-first runtime. */
export const FIXED_PACING_ENGINE_ID = "fgi_exponential";
