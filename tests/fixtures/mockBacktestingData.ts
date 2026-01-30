import type { BacktestStrategyCatalogResponseV3 } from "@/types/backtesting";

/**
 * Mock catalog with complete pacing policies.
 * Contains simple_regime strategy with all 6 pacing policy options.
 */
export const mockCatalogWithPacingPolicies: BacktestStrategyCatalogResponseV3 =
  {
    catalog_version: "3.0.0",
    strategies: [
      {
        id: "dca_classic",
        display_name: "DCA Classic",
        description: "Traditional dollar-cost averaging",
        hyperparam_schema: {},
        recommended_params: {},
      },
      {
        id: "simple_regime",
        display_name: "Simple Regime",
        description: "Regime-based strategy with pacing policies",
        hyperparam_schema: {
          type: "object",
          properties: {
            pacing_policy: {
              type: "string",
              enum: [
                "regime_mapping",
                "fgi_linear",
                "fgi_exponential",
                "fgi_power",
                "fgi_logistic",
                "volatility_scaled_fgi_exponential",
              ],
              default: "regime_mapping",
            },
            drift_threshold: {
              type: "number",
              default: 0.05,
            },
          },
        },
        recommended_params: {
          pacing_policy: "regime_mapping",
          drift_threshold: 0.05,
        },
      },
    ],
  };

/**
 * Mock catalog without simple_regime strategy.
 * Used to test fallback behavior when pacing policies are unavailable.
 */
export const mockCatalogWithoutPacingPolicies: BacktestStrategyCatalogResponseV3 =
  {
    catalog_version: "3.0.0",
    strategies: [
      {
        id: "dca_classic",
        display_name: "DCA Classic",
        description: "Traditional dollar-cost averaging",
        hyperparam_schema: {},
        recommended_params: {},
      },
    ],
  };

/**
 * Mock catalog with malformed schema structure.
 * Tests edge case handling for incomplete hyperparam_schema.
 */
export const mockCatalogMalformedSchema: BacktestStrategyCatalogResponseV3 = {
  catalog_version: "3.0.0",
  strategies: [
    {
      id: "simple_regime",
      display_name: "Simple Regime",
      description: "Regime-based strategy",
      hyperparam_schema: {
        // Missing properties field
        type: "object",
      },
      recommended_params: {},
    },
  ],
};

/**
 * Mock catalog with simple_regime but no hyperparam_schema.
 * Tests handling of missing schema entirely.
 */
export const mockCatalogNoSchema: BacktestStrategyCatalogResponseV3 = {
  catalog_version: "3.0.0",
  strategies: [
    {
      id: "simple_regime",
      display_name: "Simple Regime",
      description: "Regime-based strategy",
      hyperparam_schema: {},
      recommended_params: {},
    },
  ],
};

/**
 * Mock catalog with properties but no pacing_policy field.
 * Tests handling of missing pacing_policy in schema.
 */
export const mockCatalogNoPacingPolicy: BacktestStrategyCatalogResponseV3 = {
  catalog_version: "3.0.0",
  strategies: [
    {
      id: "simple_regime",
      display_name: "Simple Regime",
      description: "Regime-based strategy",
      hyperparam_schema: {
        type: "object",
        properties: {
          drift_threshold: {
            type: "number",
            default: 0.05,
          },
        },
      },
      recommended_params: {
        drift_threshold: 0.05,
      },
    },
  ],
};

/**
 * Mock catalog with pacing_policy but no enum.
 * Tests handling of missing enum array.
 */
export const mockCatalogNoEnum: BacktestStrategyCatalogResponseV3 = {
  catalog_version: "3.0.0",
  strategies: [
    {
      id: "simple_regime",
      display_name: "Simple Regime",
      description: "Regime-based strategy",
      hyperparam_schema: {
        type: "object",
        properties: {
          pacing_policy: {
            type: "string",
            default: "regime_mapping",
          },
        },
      },
      recommended_params: {
        pacing_policy: "regime_mapping",
      },
    },
  ],
};

/**
 * Mock catalog with single strategy for testing comma separation.
 */
export const mockCatalogSingleStrategy: BacktestStrategyCatalogResponseV3 = {
  catalog_version: "3.0.0",
  strategies: [
    {
      id: "dca_classic",
      display_name: "DCA Classic",
      description: "Traditional dollar-cost averaging",
      hyperparam_schema: {},
      recommended_params: {},
    },
  ],
};

/**
 * Mock catalog with empty strategies array.
 * Tests edge case handling.
 */
export const mockCatalogEmpty: BacktestStrategyCatalogResponseV3 = {
  catalog_version: "3.0.0",
  strategies: [],
};
