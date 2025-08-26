import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryClient";
import { getPortfolioAPR } from "../../services/analyticsEngine";

export interface PoolDetail {
  snapshot_id: string;
  chain: string;
  protocol: string;
  protocol_name: string;
  asset_usd_value: number;
  pool_symbols: string[];
  final_apr: number;
  protocol_matched: boolean;
  apr_data: {
    apr_protocol: string | null;
    apr_symbol: string | null;
    apr: number | null;
    apr_base: number | null;
    apr_reward: number | null;
    apr_updated_at: string | null;
  };
  contribution_to_portfolio: number;
}

export interface PortfolioAPRSummary {
  total_asset_value_usd: number;
  weighted_apr: number;
  matched_pools: number;
  total_pools: number;
  matched_asset_value_usd: number;
  coverage_percentage: number;
}

export interface PortfolioAPRResponse {
  user_id: string;
  portfolio_summary: PortfolioAPRSummary;
  pool_details: PoolDetail[];
}

export interface UsePortfolioAPRReturn {
  data: PortfolioAPRResponse | null;
  portfolioAPR: number | null;
  estimatedMonthlyIncome: number | null;
  poolDetails: PoolDetail[] | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  isRefetching: boolean;
}

// Hook to get portfolio APR data with pool details
export function usePortfolioAPR(
  userId: string | null | undefined
): UsePortfolioAPRReturn {
  const query = useQuery({
    queryKey: queryKeys.portfolio.apr(userId || ""),
    queryFn: async (): Promise<PortfolioAPRResponse> => {
      if (!userId) {
        throw new Error("User ID is required");
      }

      // Fetch APR data from the new endpoint
      const response = await getPortfolioAPR(userId);
      return response;
    },
    enabled: !!userId, // Only run when userId is available
    staleTime: 30 * 1000, // APR data is stale after 30 seconds (financial data changes frequently)
    gcTime: 2 * 60 * 1000, // Keep in cache for 2 minutes
    refetchInterval: 60 * 1000, // Auto-refetch every minute when tab is active
    retry: (failureCount, error) => {
      // Don't retry USER_NOT_FOUND errors
      if (error instanceof Error && error.message.includes("USER_NOT_FOUND")) {
        return false;
      }
      // Retry other errors up to 2 times
      return failureCount < 2;
    },
  });

  // Calculate estimated monthly income from portfolio value and APR
  const estimatedMonthlyIncome =
    query.data?.portfolio_summary.total_asset_value_usd &&
    query.data?.portfolio_summary.weighted_apr
      ? (query.data.portfolio_summary.total_asset_value_usd *
          query.data.portfolio_summary.weighted_apr) /
        12
      : null;

  return {
    data: query.data || null,
    portfolioAPR: query.data?.portfolio_summary.weighted_apr || null,
    estimatedMonthlyIncome,
    poolDetails: query.data?.pool_details || null,
    isLoading: query.isLoading,
    error: query.error?.message || null,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
  };
}
