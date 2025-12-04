import { z } from "zod";

/**
 * Zod schemas for analytics service API responses
 *
 * These schemas provide runtime validation for analytics-related API responses,
 * ensuring type safety and catching malformed data before it causes runtime errors.
 */

// ============================================================================
// YIELD RETURNS SCHEMAS
// ============================================================================

/**
 * Schema for protocol yield window data
 */
export const protocolYieldWindowSchema = z.object({
  total_yield_usd: z.number(),
  average_daily_yield_usd: z.number(),
  data_points: z.number(),
  positive_days: z.number(),
  negative_days: z.number(),
});

/**
 * Schema for protocol yield today data
 */
export const protocolYieldTodaySchema = z.object({
  date: z.string(),
  yield_usd: z.number(),
});

/**
 * Schema for protocol yield breakdown
 */
export const protocolYieldBreakdownSchema = z.object({
  protocol: z.string(),
  chain: z.string().nullable().optional(),
  window: protocolYieldWindowSchema,
  today: protocolYieldTodaySchema.nullable().optional(),
});

/**
 * Schema for yield window summary with IQR outlier detection
 */
export const yieldWindowSummarySchema = z.object({
  user_id: z.string(),
  period: z.object({
    start_date: z.string(),
    end_date: z.string(),
    days: z.number(),
  }),
  average_daily_yield_usd: z.number(),
  median_daily_yield_usd: z.number(),
  total_yield_usd: z.number(),
  statistics: z.object({
    mean: z.number(),
    median: z.number(),
    std_dev: z.number(),
    min_value: z.number(),
    max_value: z.number(),
    total_days: z.number(),
    filtered_days: z.number(),
    outliers_removed: z.number(),
  }),
  outlier_strategy: z.enum(["iqr", "none", "zscore", "percentile"]),
  outliers_detected: z.array(
    z.object({
      date: z.string(),
      value: z.number(),
      reason: z.string(),
      z_score: z.number().nullable(),
    })
  ),
  protocol_breakdown: z.array(protocolYieldBreakdownSchema),
});

/**
 * Schema for yield returns summary response
 */
export const yieldReturnsSummaryResponseSchema = z.object({
  user_id: z.string(),
  windows: z.record(z.string(), yieldWindowSummarySchema),
  recommended_period: z.string().optional(),
});

// ============================================================================
// LANDING PAGE SCHEMAS
// ============================================================================

/**
 * Schema for ROI window data
 */
const roiWindowSchema = z.object({
  value: z.number(),
  data_points: z.number(),
  start_balance: z.number().optional(),
});

/**
 * Schema for portfolio ROI data
 */
const portfolioROISchema = z.object({
  recommended_roi: z.number(),
  recommended_period: z.string(),
  recommended_yearly_roi: z.number(),
  estimated_yearly_pnl_usd: z.number(),
  windows: z.record(z.string(), roiWindowSchema).optional(),
  // Legacy fields for backward compatibility
  roi_7d: roiWindowSchema.optional(),
  roi_30d: roiWindowSchema.optional(),
  roi_365d: roiWindowSchema.optional(),
  roi_windows: z.record(z.string(), z.number()).optional(),
});

/**
 * Schema for allocation category data
 */
const allocationCategorySchema = z.object({
  total_value: z.number(),
  percentage_of_portfolio: z.number(),
  wallet_tokens_value: z.number(),
  other_sources_value: z.number(),
});

/**
 * Schema for portfolio allocation
 */
const portfolioAllocationSchema = z.object({
  btc: allocationCategorySchema,
  eth: allocationCategorySchema,
  stablecoins: allocationCategorySchema,
  others: allocationCategorySchema,
});

/**
 * Schema for wallet token summary
 */
const walletTokenSummarySchema = z.object({
  total_value_usd: z.number(),
  token_count: z.number(),
  apr_30d: z.number(),
});

/**
 * Schema for category summary debt
 */
const categorySummaryDebtSchema = z.object({
  btc: z.number(),
  eth: z.number(),
  stablecoins: z.number(),
  others: z.number(),
});

/**
 * Schema for APR coverage info
 */
const aprCoverageSchema = z.object({
  matched_pools: z.number(),
  total_pools: z.number(),
  coverage_percentage: z.number(),
  matched_asset_value_usd: z.number(),
});

/**
 * Schema for pool detail (simplified - full schema in poolSchemas.ts)
 */
const poolDetailSchema = z.object({}).passthrough();

/**
 * Schema for landing page response
 */
export const landingPageResponseSchema = z.object({
  total_assets_usd: z.number(),
  total_debt_usd: z.number(),
  total_net_usd: z.number(),
  weighted_apr: z.number(),
  estimated_monthly_income: z.number(),
  portfolio_roi: portfolioROISchema,
  portfolio_allocation: portfolioAllocationSchema,
  wallet_token_summary: walletTokenSummarySchema,
  category_summary_debt: categorySummaryDebtSchema,
  pool_details: z.array(poolDetailSchema),
  total_positions: z.number(),
  protocols_count: z.number(),
  chains_count: z.number(),
  last_updated: z.string().nullable(),
  apr_coverage: aprCoverageSchema,
  message: z.string().optional(),
  yield_summary: yieldReturnsSummaryResponseSchema.optional(),
});

// ============================================================================
// UNIFIED DASHBOARD SCHEMAS
// ============================================================================

/**
 * Schema for period window
 */
const periodWindowSchema = z.object({
  start_date: z.string(),
  end_date: z.string(),
  days: z.number(),
});

/**
 * Schema for analytics period info
 */
const analyticsPeriodInfoSchema = z.object({
  start_date: z.string(),
  end_date: z.string(),
  timezone: z.string().optional(),
  label: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * Schema for educational link
 */
const analyticsEducationalLinkSchema = z.object({
  label: z.string(),
  url: z.string(),
});

/**
 * Schema for educational context
 */
const analyticsEducationalContextSchema = z.object({
  title: z.string().optional(),
  summary: z.string().optional(),
  description: z.string().optional(),
  highlights: z.array(z.string()).optional(),
  links: z.array(analyticsEducationalLinkSchema).optional(),
});

/**
 * Schema for trend daily values
 */
const trendDailyValueSchema = z
  .object({
    date: z.string(),
    total_value_usd: z.number(),
    change_percentage: z.number(),
    categories: z
      .array(
        z.object({
          category: z.string(),
          source_type: z.string().optional(),
          value_usd: z.number(),
          pnl_usd: z.number(),
        })
      )
      .optional(),
    protocols: z
      .array(
        z.object({
          protocol: z.string(),
          chain: z.string(),
          value_usd: z.number(),
          pnl_usd: z.number(),
          source_type: z.string().optional(),
          category: z.string().optional(),
        })
      )
      .optional(),
    chains_count: z.number().optional(),
  })
  .passthrough();

/**
 * Schema for trends section
 */
const trendsSchema = z.object({
  user_id: z.string().optional(),
  period_days: z.number(),
  data_points: z.number(),
  period: periodWindowSchema,
  period_info: periodWindowSchema.optional(),
  daily_values: z.array(trendDailyValueSchema),
  summary: z.object({
    current_value_usd: z.number(),
    start_value_usd: z.number(),
    change_usd: z.number(),
    change_pct: z.number(),
  }),
});

/**
 * Schema for risk metrics
 */
const riskMetricsSchema = z.object({
  volatility: z.object({
    period: periodWindowSchema,
    volatility_pct: z.number(),
    annualized_volatility_pct: z.number(),
    interpretation: z.string(),
    summary: z.object({
      avg_volatility: z.number(),
      max_volatility: z.number(),
      min_volatility: z.number(),
    }),
  }),
  sharpe_ratio: z.object({
    period: periodWindowSchema,
    sharpe_ratio: z.number(),
    interpretation: z.string(),
    summary: z.object({
      avg_sharpe: z.number(),
      statistical_reliability: z.string(),
    }),
  }),
  max_drawdown: z.object({
    period: periodWindowSchema,
    max_drawdown_pct: z.number(),
    peak_date: z.string(),
    trough_date: z.string(),
    recovery_date: z.string().nullable(),
    summary: z.object({
      current_drawdown_pct: z.number(),
      is_recovered: z.boolean(),
    }),
  }),
});

/**
 * Schema for drawdown data point
 */
const drawdownDataPointSchema = z
  .object({
    date: z.string(),
    portfolio_value: z.number().optional(),
    portfolio_value_usd: z.number().optional(),
    peak_value: z.number().optional(),
    running_peak_usd: z.number().optional(),
    drawdown_pct: z.number().optional(),
    underwater_pct: z.number().optional(),
    is_underwater: z.boolean().optional(),
    recovery_point: z.boolean().optional(),
  })
  .passthrough();

/**
 * Schema for underwater data point
 */
const underwaterDataPointSchema = z
  .object({
    date: z.string(),
    underwater_pct: z.number(),
    drawdown_pct: z.number().optional(),
    portfolio_value: z.number().optional(),
    peak_value: z.number().optional(),
    is_underwater: z.boolean().optional(),
    recovery_point: z.boolean().optional(),
  })
  .passthrough();

/**
 * Schema for drawdown analysis
 */
const drawdownAnalysisSchema = z.object({
  enhanced: z.object({
    user_id: z.string().optional(),
    period: periodWindowSchema,
    period_info: analyticsPeriodInfoSchema.optional(),
    drawdown_data: z.array(drawdownDataPointSchema),
    summary: z.object({
      max_drawdown_pct: z.number(),
      current_drawdown_pct: z.number(),
      peak_value: z.number(),
      current_value: z.number(),
    }),
    data_points: z.number().optional(),
  }),
  underwater_recovery: z.object({
    user_id: z.string().optional(),
    period: periodWindowSchema,
    period_info: analyticsPeriodInfoSchema.optional(),
    underwater_data: z.array(underwaterDataPointSchema),
    summary: z.object({
      total_underwater_days: z.number(),
      underwater_percentage: z.number(),
      recovery_points: z.number(),
      current_underwater_pct: z.number(),
      is_currently_underwater: z.boolean(),
    }),
    data_points: z.number().optional(),
  }),
});

/**
 * Schema for allocation data point
 */
const allocationDataPointSchema = z
  .object({
    date: z.string(),
    category: z.string(),
    category_value_usd: z.number(),
    total_portfolio_value_usd: z.number(),
    allocation_percentage: z.number(),
  })
  .passthrough();

/**
 * Schema for allocation section
 */
const allocationSchema = z.object({
  user_id: z.string().optional(),
  period_days: z.number(),
  data_points: z.number(),
  period: periodWindowSchema,
  period_info: periodWindowSchema.optional(),
  allocations: z.array(allocationDataPointSchema),
  summary: z.object({
    unique_dates: z.number(),
    unique_protocols: z.number(),
    unique_chains: z.number(),
    categories: z.array(z.string()).optional(),
  }),
});

/**
 * Schema for rolling sharpe data point
 */
const rollingSharpeDataPointSchema = z
  .object({
    date: z.string(),
    rolling_sharpe_ratio: z.number(),
    is_statistically_reliable: z.boolean(),
  })
  .passthrough();

/**
 * Schema for rolling volatility data point
 */
const rollingVolatilityDataPointSchema = z
  .object({
    date: z.string(),
    rolling_volatility_pct: z.number(),
    annualized_volatility_pct: z.number(),
    rolling_volatility_daily_pct: z.number().optional(),
  })
  .passthrough();

/**
 * Schema for rolling analytics
 */
const rollingAnalyticsSchema = z.object({
  sharpe: z.object({
    user_id: z.string().optional(),
    period: periodWindowSchema,
    rolling_sharpe_data: z.array(rollingSharpeDataPointSchema),
    summary: z.object({
      latest_sharpe_ratio: z.number(),
      avg_sharpe_ratio: z.number(),
      reliable_data_points: z.number(),
      statistical_reliability: z.string(),
    }),
    data_points: z.number().optional(),
    educational_context: analyticsEducationalContextSchema.optional(),
  }),
  volatility: z.object({
    user_id: z.string().optional(),
    period: periodWindowSchema,
    rolling_volatility_data: z.array(rollingVolatilityDataPointSchema),
    summary: z.object({
      latest_daily_volatility: z.number(),
      latest_annualized_volatility: z.number(),
      avg_daily_volatility: z.number(),
      avg_annualized_volatility: z.number(),
    }),
    data_points: z.number().optional(),
    educational_context: analyticsEducationalContextSchema.optional(),
  }),
});

/**
 * Schema for unified dashboard response
 */
export const unifiedDashboardResponseSchema = z.object({
  user_id: z.string(),
  parameters: z.object({
    trend_days: z.number(),
    risk_days: z.number(),
    drawdown_days: z.number(),
    allocation_days: z.number(),
    rolling_days: z.number(),
  }),
  trends: trendsSchema,
  risk_metrics: riskMetricsSchema,
  drawdown_analysis: drawdownAnalysisSchema,
  allocation: allocationSchema,
  rolling_analytics: rollingAnalyticsSchema,
  _metadata: z.object({
    success_count: z.number(),
    error_count: z.number(),
    success_rate: z.number(),
    errors: z.record(z.string(), z.string()).optional(),
  }),
});

// ============================================================================
// DAILY YIELD RETURNS SCHEMAS
// ============================================================================

/**
 * Schema for daily yield token
 */
const dailyYieldTokenSchema = z.object({
  symbol: z.string(),
  amount_change: z.number(),
  current_price: z.number(),
  yield_return_usd: z.number(),
});

/**
 * Schema for daily yield return
 */
const dailyYieldReturnSchema = z.object({
  date: z.string(),
  protocol_name: z.string(),
  chain: z.string(),
  position_type: z.string(),
  yield_return_usd: z.number(),
  tokens: z.array(dailyYieldTokenSchema),
});

/**
 * Schema for daily yield period
 */
const dailyYieldPeriodSchema = z.object({
  start_date: z.string(),
  end_date: z.string(),
  days: z.number(),
});

/**
 * Schema for daily yield returns response
 */
export const dailyYieldReturnsResponseSchema = z.object({
  user_id: z.string(),
  period: dailyYieldPeriodSchema,
  daily_returns: z.array(dailyYieldReturnSchema),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/**
 * Type inference from schemas
 * These types are automatically generated from the Zod schemas
 */
export type ProtocolYieldWindow = z.infer<typeof protocolYieldWindowSchema>;
export type ProtocolYieldToday = z.infer<typeof protocolYieldTodaySchema>;
export type ProtocolYieldBreakdown = z.infer<
  typeof protocolYieldBreakdownSchema
>;
export type YieldWindowSummary = z.infer<typeof yieldWindowSummarySchema>;
export type YieldReturnsSummaryResponse = z.infer<
  typeof yieldReturnsSummaryResponseSchema
>;
export type LandingPageResponse = z.infer<typeof landingPageResponseSchema>;
export type UnifiedDashboardResponse = z.infer<
  typeof unifiedDashboardResponseSchema
>;
export type DailyYieldReturnsResponse = z.infer<
  typeof dailyYieldReturnsResponseSchema
>;

// ============================================================================
// VALIDATION HELPER FUNCTIONS
// ============================================================================

/**
 * Validates yield returns summary response data from API
 * Returns validated data or throws ZodError with detailed error messages
 */
export function validateYieldReturnsSummaryResponse(
  data: unknown
): YieldReturnsSummaryResponse {
  return yieldReturnsSummaryResponseSchema.parse(data);
}

/**
 * Validates landing page response data from API
 * Returns validated data or throws ZodError with detailed error messages
 */
export function validateLandingPageResponse(
  data: unknown
): LandingPageResponse {
  return landingPageResponseSchema.parse(data);
}

/**
 * Validates unified dashboard response data from API
 * Returns validated data or throws ZodError with detailed error messages
 */
export function validateUnifiedDashboardResponse(
  data: unknown
): UnifiedDashboardResponse {
  return unifiedDashboardResponseSchema.parse(data);
}

/**
 * Validates daily yield returns response data from API
 * Returns validated data or throws ZodError with detailed error messages
 */
export function validateDailyYieldReturnsResponse(
  data: unknown
): DailyYieldReturnsResponse {
  return dailyYieldReturnsResponseSchema.parse(data);
}

/**
 * Safe validation that returns result with success/error information
 * Useful for cases where you want to handle validation errors gracefully
 */
export function safeValidateUnifiedDashboardResponse(data: unknown) {
  return unifiedDashboardResponseSchema.safeParse(data);
}
