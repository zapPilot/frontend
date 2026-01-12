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
 * Schema for period window
 */
const periodWindowSchema = z.object({
  start_date: z.string(),
  end_date: z.string(),
  days: z.number(),
});

/**
 * Schema for yield window summary with IQR outlier detection
 */
export const yieldWindowSummarySchema = z.object({
  user_id: z.string(),
  period: periodWindowSchema,
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
 * Risk Metrics Schema (MVP: Portfolio-Level)
 */
const riskMetricsSchema = z.object({
  has_leverage: z.boolean(),
  health_rate: z.number().positive(),
  leverage_ratio: z.number().positive(),
  collateral_value_usd: z.number().nonnegative(),
  debt_value_usd: z.number().nonnegative(),
  liquidation_threshold: z.number().positive(),
  protocol_source: z.string(),
  position_count: z.number().int().nonnegative(),
});

/**
 * Borrowing Summary Schema
 *
 * Pre-computed debt position health aggregation from backend.
 * Provides quick overview of borrowing position health across all protocols.
 */
const borrowingSummarySchema = z.object({
  has_debt: z.boolean(),
  worst_health_rate: z.number().positive(),
  overall_status: z.enum(["HEALTHY", "WARNING", "CRITICAL"]),
  critical_count: z.number().int().nonnegative(),
  warning_count: z.number().int().nonnegative(),
  healthy_count: z.number().int().nonnegative(),
});

/**
 * Schema for token details in borrowing positions
 */
const tokenDetailSchema = z.object({
  symbol: z.string(),
  amount: z.number(),
  value_usd: z.number().nonnegative(),
});

/**
 * Schema for individual borrowing position
 */
const borrowingPositionSchema = z.object({
  protocol_id: z.string(),
  protocol_name: z.string(),
  chain: z.string(),
  health_rate: z.number().positive(),
  health_status: z.enum(["HEALTHY", "WARNING", "CRITICAL"]),
  collateral_usd: z.number().nonnegative(),
  debt_usd: z.number().positive(),
  net_value_usd: z.number(),
  collateral_tokens: z.array(tokenDetailSchema),
  debt_tokens: z.array(tokenDetailSchema),
  updated_at: z.string(), // ISO 8601 datetime string
});

/**
 * Schema for borrowing positions response
 */
export const borrowingPositionsResponseSchema = z.object({
  positions: z.array(borrowingPositionSchema),
  total_collateral_usd: z.number().nonnegative(),
  total_debt_usd: z.number().positive(),
  worst_health_rate: z.number().positive(),
  last_updated: z.string(), // ISO 8601 datetime string
});

/**
 * Validator function for borrowing positions response
 */
export function validateBorrowingPositionsResponse(
  data: unknown
): BorrowingPositionsResponse {
  return borrowingPositionsResponseSchema.parse(data);
}

/**
 * Schema for landing page response
 */
export const landingPageResponseSchema = z
  .object({
    // Financials
    total_assets_usd: z.number().optional(),
    total_debt_usd: z.number().optional(),
    total_net_usd: z.number().describe("Previously total_net_usd"),
    net_portfolio_value: z.number().nullable().optional().default(0),

    // Counts (New optimization)
    positions: z.number().optional().default(0),
    protocols: z.number().optional().default(0),
    chains: z.number().optional().default(0),

    // Allocation
    portfolio_allocation: portfolioAllocationSchema,

    // ROI
    portfolio_roi: portfolioROISchema.optional(),

    // Legacy / Deprecated (Made optional or removed from strict requirement)
    pool_details: z.array(z.any()).optional(), // Kept for cache compatibility
    wallet_token_summary: z.any().optional(),
    category_summary_debt: z.any().optional(),

    // Metadata
    wallet_count: z.number().int().nonnegative().optional().default(0),
    last_updated: z.string().nullable().optional(),
    message: z.string().optional(),

    // Coverage
    apr_coverage: z
      .object({
        matched_pools: z.number().default(0),
        total_pools: z.number().default(0),
        coverage_percentage: z.number().default(0),
        matched_asset_value_usd: z.number().default(0),
      })
      .optional()
      .default({
        matched_pools: 0,
        total_pools: 0,
        coverage_percentage: 0,
        matched_asset_value_usd: 0,
      }),

    // Risk Metrics (MVP: portfolio-level calculation)
    risk_metrics: riskMetricsSchema.nullable().optional(),

    // Borrowing Summary (pre-computed debt health aggregation)
    borrowing_summary: borrowingSummarySchema.nullable().optional(),
  })
  .catchall(z.unknown());

// ============================================================================
// UNIFIED DASHBOARD SCHEMAS
// ============================================================================

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
 * Schema for daily yield period - reuses period window schema
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
export type YieldReturnsSummaryResponse = z.infer<
  typeof yieldReturnsSummaryResponseSchema
>;
export type LandingPageResponse = z.infer<typeof landingPageResponseSchema>;
export type RiskMetrics = z.infer<typeof riskMetricsSchema>;
export type BorrowingSummary = z.infer<typeof borrowingSummarySchema>;
export type BorrowingPosition = z.infer<typeof borrowingPositionSchema>;
export type BorrowingPositionsResponse = z.infer<
  typeof borrowingPositionsResponseSchema
>;
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
