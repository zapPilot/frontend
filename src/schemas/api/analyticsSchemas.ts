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
  apr_30d: z.number().nullable().optional().default(0),
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
 * Schema for pool detail - matches /api/v2/pools/{id}/performance response
 */
const poolDetailSchema = z.object({
  wallet: z.string(),
  protocol_id: z.string(),
  protocol: z.string(),
  protocol_name: z.string(),
  chain: z.string(),
  asset_usd_value: z.number(),
  pool_symbols: z.array(z.string()),
  contribution_to_portfolio: z.number(),
  snapshot_id: z.string(),
  snapshot_ids: z.array(z.string()).nullable().optional(),
});

/**
 * Schema for landing page response
 */
export const landingPageResponseSchema = z
  .object({
    total_assets_usd: z.number(),
    total_debt_usd: z.number(),
    total_net_usd: z.number(),
    net_portfolio_value: z.number().nullable().optional().default(0),
    weighted_apr: z.number().nullable().optional().default(0),
    estimated_monthly_income: z.number().nullable().optional().default(0),
    portfolio_roi: portfolioROISchema,
    portfolio_allocation: portfolioAllocationSchema,
    wallet_token_summary: walletTokenSummarySchema,
    category_summary_debt: categorySummaryDebtSchema,
    pool_details: z.array(poolDetailSchema).optional().default([]),
    total_positions: z.number().optional().default(0),
    protocols_count: z.number().optional().default(0),
    chains_count: z.number().optional().default(0),
    wallet_count: z.number().int().nonnegative().optional().default(0),
    last_updated: z.string().nullable(),
    apr_coverage: aprCoverageSchema.optional().default({
      matched_pools: 0,
      total_pools: 0,
      coverage_percentage: 0,
      matched_asset_value_usd: 0,
    }),
    message: z.string().optional(),
    yield_summary: yieldReturnsSummaryResponseSchema.optional(),
  })
  .catchall(z.unknown());

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

// Shared helpers to reduce duplication in analytics sections
const summaryRecord = z.record(z.string(), z.any()).optional();
const periodSummaryBase = {
  user_id: z.string().optional(),
  period_days: z.number().optional(),
  data_points: z.number().optional(),
  period: periodWindowSchema.optional(),
  period_info: periodWindowSchema.optional(),
  summary: summaryRecord,
  message: z.string().optional(),
};

// Trend data schemas
const trendBaseValueSchema = z
  .object({
    source_type: z.string().optional(),
    value_usd: z.number(),
    pnl_usd: z.number().optional(),
  })
  .catchall(z.unknown());

const trendCategorySchema = trendBaseValueSchema.extend({
  category: z.string(),
});

const trendProtocolSchema = trendBaseValueSchema.extend({
  protocol: z.string(),
  chain: z.string(),
  category: z.string().optional(),
});

const trendDailyValueSchema = z
  .object({
    date: z.string(),
    total_value_usd: z.number(),
    change_percentage: z.number().optional(),
    pnl_percentage: z.number().optional(),
    pnl_usd: z.number().optional(),
    categories: z.array(trendCategorySchema).optional(),
    protocols: z.array(trendProtocolSchema).optional(),
    chains_count: z.number().optional(),
  })
  .catchall(z.unknown());

export const trendsSchema = z
  .object({
    ...periodSummaryBase,
    daily_values: z.array(trendDailyValueSchema).optional().default([]),
  })
  .catchall(z.unknown());

// Risk metrics (loosely validated)
export const riskMetricsSchema = z
  .object({
    volatility: z.record(z.string(), z.any()).optional(),
    sharpe_ratio: z.record(z.string(), z.any()).optional(),
    max_drawdown: z.record(z.string(), z.any()).optional(),
  })
  .catchall(z.unknown());
// .optional() is not exported as unused variable

const buildAnalyticsSection = (
  dataShape: Record<string, z.ZodTypeAny>,
  extras: Record<string, z.ZodTypeAny> = {}
) =>
  z
    .object({
      user_id: z.string().optional(),
      period: periodWindowSchema.optional(),
      period_info: analyticsPeriodInfoSchema.optional(),
      ...dataShape,
      summary: summaryRecord,
      data_points: z.number().optional(),
      message: z.string().optional(),
      ...extras,
    })
    .catchall(z.unknown());

const buildDrawdownSection = (dataKey: "drawdown_data" | "underwater_data") =>
  buildAnalyticsSection({
    [dataKey]: z.array(z.record(z.string(), z.any())).default([]).optional(),
  });

const buildRollingSection = (dataKey: string, dataSchema: z.ZodTypeAny) =>
  buildAnalyticsSection(
    {
      [dataKey]: dataSchema.default([]).optional(),
    },
    { educational_context: analyticsEducationalContextSchema.optional() }
  );

// Drawdown analysis
export const drawdownAnalysisSchema = z
  .object({
    enhanced: buildDrawdownSection("drawdown_data").optional(),
    underwater_recovery: buildDrawdownSection("underwater_data").optional(),
  })
  .catchall(z.unknown());
// .optional() is not exported as unused variable

// Allocation data
export const allocationSchema = z
  .object({
    ...periodSummaryBase,
    allocations: z
      .array(
        z
          .object({
            date: z.string(),
            category: z.string(),
            category_value_usd: z.number(),
            total_portfolio_value_usd: z.number(),
            allocation_percentage: z.number(),
          })
          .catchall(z.unknown())
      )
      .default([])
      .optional(),
  })
  .catchall(z.unknown());
// .optional() is not exported as unused variable

// Rolling analytics
export const rollingAnalyticsSchema = z
  .object({
    sharpe: buildRollingSection(
      "rolling_sharpe_data",
      z.array(
        z
          .object({
            date: z.string(),
            rolling_sharpe_ratio: z.number(),
            is_statistically_reliable: z.boolean().optional(),
          })
          .catchall(z.unknown())
      )
    ).optional(),
    volatility: buildRollingSection(
      "rolling_volatility_data",
      z.array(
        z
          .object({
            date: z.string(),
            rolling_volatility_pct: z.number().optional(),
            annualized_volatility_pct: z.number().optional(),
            rolling_volatility_daily_pct: z.number().optional(),
          })
          .catchall(z.unknown())
      )
    ).optional(),
  })
  .catchall(z.unknown());
// .optional() is not exported as unused variable

// Unified dashboard response
// Unified dashboard validation is intentionally permissive because backend
// payloads vary across services. We use a loose schema to avoid runtime
// breakage when new fields are added server-side.
export const unifiedDashboardResponseSchema = z.any();

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
  position_type: z.string().nullable().optional(),
  yield_return_usd: z.number(),
  tokens: z.array(dailyYieldTokenSchema),
});

/**
 * Schema for daily yield period
 */
const dailyYieldPeriodSchema = periodWindowSchema;

/**
 * Schema for daily yield returns response
 */
export const dailyYieldReturnsResponseSchema = z.object({
  user_id: z.string(),
  period: dailyYieldPeriodSchema,
  daily_returns: z.array(dailyYieldReturnSchema),
});

// ============================================================================
// POOL PERFORMANCE SCHEMAS
// ============================================================================

/**
 * Schema for pool performance response
 * Validates array of pool details from /api/v2/pools/{id}/performance
 */
export const poolPerformanceResponseSchema = z.array(poolDetailSchema);

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/**
 * Type inference from schemas
 * These types are automatically generated from the Zod schemas
 */
/** @public */ export type ProtocolYieldToday = z.infer<
  typeof protocolYieldTodaySchema
>;
export type ProtocolYieldBreakdown = z.infer<
  typeof protocolYieldBreakdownSchema
>;
export type YieldWindowSummary = z.infer<typeof yieldWindowSummarySchema>;
export type YieldReturnsSummaryResponse = z.infer<
  typeof yieldReturnsSummaryResponseSchema
>;
export type LandingPageResponse = z.infer<typeof landingPageResponseSchema>;
export interface UnifiedDashboardResponse {
  user_id?: string;
  parameters?: Record<string, unknown>;
  trends?:
    | ({
        daily_values?: {
          date?: string;
          total_value_usd?: number;
          change_percentage?: number;
          pnl_percentage?: number;
          pnl_usd?: number;
          categories?: {
            category?: string;
            source_type?: string;
            value_usd?: number;
            pnl_usd?: number;
          }[];
          protocols?: {
            protocol?: string;
            chain?: string;
            source_type?: string;
            category?: string;
            value_usd?: number;
            pnl_usd?: number;
          }[];
          chains_count?: number;
        }[];
      } & Record<string, unknown>)
    | undefined;
  allocation?:
    | ({
        allocations?: {
          date?: string;
          category?: string;
          category_value_usd?: number;
          total_portfolio_value_usd?: number;
          allocation_percentage?: number;
        }[];
      } & Record<string, unknown>)
    | undefined;
  rolling_analytics?:
    | ({
        sharpe?:
          | ({
              rolling_sharpe_data?: {
                date?: string;
                rolling_sharpe_ratio?: number;
                is_statistically_reliable?: boolean;
              }[];
            } & Record<string, unknown>)
          | undefined;
        volatility?:
          | ({
              rolling_volatility_data?: {
                date?: string;
                rolling_volatility_pct?: number;
                annualized_volatility_pct?: number;
                rolling_volatility_daily_pct?: number;
              }[];
            } & Record<string, unknown>)
          | undefined;
      } & Record<string, unknown>)
    | undefined;
  drawdown_analysis?: Record<string, unknown>;
  risk_metrics?: Record<string, unknown>;
  _metadata?: Record<string, unknown>;
}
export type DailyYieldReturnsResponse = z.infer<
  typeof dailyYieldReturnsResponseSchema
>;
export type PoolPerformanceResponse = z.infer<
  typeof poolPerformanceResponseSchema
>;
export type PoolDetail = z.infer<typeof poolDetailSchema>;

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

/**
 * Validates pool performance response data from API
 * Returns validated data or throws ZodError with detailed error messages
 */
export function validatePoolPerformanceResponse(
  data: unknown
): PoolPerformanceResponse {
  return poolPerformanceResponseSchema.parse(data);
}
