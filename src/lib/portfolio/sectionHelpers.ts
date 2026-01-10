import type { SectionState } from "@/types/portfolio-progressive";

/**
 * Creates a section state from query results with combined loading/error states
 *
 * This utility eliminates duplication when transforming React Query results into
 * section states for progressive rendering. It handles:
 * - Combining loading states (any query loading → section loading)
 * - Combining error states (first query error → section error)
 * - Extracting and transforming data using a provided extractor function
 * - Only calls extractor when all required data is present
 *
 * @template TInput - Input data type from queries
 * @template TOutput - Output data type for the section
 * @param queries - Array of query results with data/isLoading/error
 * @param extractor - Function to extract/transform data from query results (receives non-undefined values)
 * @returns SectionState with combined loading/error states and extracted data
 *
 * @example
 * ```typescript
 * // Single query dependency
 * const balanceSection = createSectionState(
 *   [landingQuery],
 *   extractBalanceData
 * );
 *
 * // Multiple query dependencies
 * const strategySection = createSectionState(
 *   [landingQuery, sentimentQuery, regimeQuery],
 *   combineStrategyData
 * );
 * ```
 */
export function createSectionState<TOutput>(
  queries: Array<{ data?: unknown; isLoading: boolean; error: unknown }>,
  extractor: (...args: any[]) => TOutput | null
): SectionState<TOutput> {
  const isLoading = queries.some(q => q.isLoading);
  const error = queries.find(q => q.error)?.error as Error | null;

  // Only call extractor if all queries have data
  // This matches the original pattern: landingQuery.data ? extractor(landingQuery.data) : null
  // Using != null to check both undefined and null (matches truthiness check)
  const allDataPresent = queries.every(q => q.data != null);
  const data = allDataPresent
    ? extractor(...queries.map(q => q.data))
    : null;

  return { data, isLoading, error };
}
