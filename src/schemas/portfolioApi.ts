import { z } from "zod";

/**
 * Zod schema for API Position data
 * Validates individual asset positions from the portfolio API
 */
export const apiPositionSchema = z.object({
  symbol: z.string().min(1, "Symbol is required"),
  total_usd_value: z.number().finite("Total USD value must be a finite number"),
  protocol_name: z.string().optional(),
  amount: z.number().finite("Amount must be a finite number").optional(),
  protocol_type: z.string().optional(),
});

/**
 * Zod schema for API Category data
 * Validates portfolio category groupings from the API
 */
export const apiCategorySchema = z.object({
  category: z.string().min(1, "Category name is required"),
  positions: z.array(apiPositionSchema).min(0, "Positions array is required"),
});

/**
 * Zod schema for Portfolio Metrics
 * Validates the metrics section of the portfolio API response
 */
export const portfolioMetricsSchema = z.object({
  total_value_usd: z.number().finite("Total value must be a finite number"),
  wallets_included: z
    .number()
    .int()
    .min(0, "Wallets included must be a non-negative integer")
    .optional()
    .default(1),
});

/**
 * Zod schema for complete Portfolio Summary API response
 * Validates the full structure returned by getPortfolioSummary
 * Updated to support new asset_positions and borrowing_positions structure
 */
export const portfolioSummarySchema = z
  .object({
    metrics: portfolioMetricsSchema,
    // Legacy structure support
    categories: z
      .array(apiCategorySchema)
      .min(0, "Categories array is required")
      .optional(),
    // New separated structure
    asset_positions: z
      .array(apiCategorySchema)
      .min(0, "Asset positions array is required")
      .optional(),
    borrowing_positions: z
      .array(apiCategorySchema)
      .min(0, "Borrowing positions array is required")
      .optional(),
  })
  .refine(
    data =>
      data.categories || (data.asset_positions && data.borrowing_positions),
    {
      message:
        "Either categories or both asset_positions and borrowing_positions must be provided",
      path: ["categories"],
    }
  );

/**
 * Type inference from Zod schemas
 * These types are automatically generated from the schemas above
 */
export type ApiPosition = z.infer<typeof apiPositionSchema>;
export type ApiCategory = z.infer<typeof apiCategorySchema>;
export type PortfolioMetrics = z.infer<typeof portfolioMetricsSchema>;
export type ApiPortfolioSummary = z.infer<typeof portfolioSummarySchema>;

/**
 * Validation helper functions
 */

/**
 * Safely parse portfolio summary data with detailed error messages
 * @param data - Raw API response data
 * @returns Parsed and validated portfolio summary or validation error
 */
export function parsePortfolioSummary(data: unknown) {
  const result = portfolioSummarySchema.safeParse(data);

  if (!result.success) {
    // Create a detailed error message for debugging
    const errorMessages = result.error.errors
      .map(err => `${err.path.join(".")}: ${err.message}`)
      .join("; ");

    throw new Error(`Portfolio API validation failed: ${errorMessages}`);
  }

  return result.data;
}

/**
 * Type guard to check if data matches ApiPortfolioSummary structure
 * @param data - Data to validate
 * @returns True if data is valid ApiPortfolioSummary
 */
export function isValidPortfolioSummary(
  data: unknown
): data is ApiPortfolioSummary {
  return portfolioSummarySchema.safeParse(data).success;
}

/**
 * Schema validation constants for error handling
 */
export const VALIDATION_ERRORS = {
  INVALID_STRUCTURE: "API response structure is invalid",
  MISSING_METRICS: "Portfolio metrics are missing or invalid",
  INVALID_CATEGORIES: "Portfolio categories are invalid",
  NEGATIVE_VALUES: "Portfolio contains negative values",
  MISSING_REQUIRED_FIELDS: "Required fields are missing from API response",
} as const;
