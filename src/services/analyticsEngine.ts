/**
 * API service for analytics-engine integration
 * Migrated to use unified API client for consistent error handling
 */

import { apiClient, APIError } from "../lib/api-client";
import { PortfolioDataPoint } from "../types/portfolio";

// API Response Types
export interface UserResponse {
  id: string;
  email: string;
  primary_wallet: string;
  created_at: string;
  updated_at: string;
}

export interface AdditionalWallet {
  wallet_address: string;
  label?: string;
  is_main?: boolean;
  is_visible?: boolean;
  created_at?: string;
}

export interface BundleWalletsResponse {
  user_id: string;
  primary_wallet: string;
  main_wallet: string;
  visible_wallets: string[];
  bundle_wallets: string[];
  additional_wallets?: AdditionalWallet[];
}

export interface PortfolioSnapshot {
  id: string;
  user_id: string;
  wallet_address: string;
  chain: string;
  protocol: string;
  net_value_usd: number;
  snapshot_date: string;
  created_at: string;
}

export interface PortfolioTrend {
  id: string;
  user_id: string;
  wallet_address: string;
  chain: string;
  protocol: string;
  net_value_usd: number;
  pnl_usd: number;
  date: string;
  created_at: string;
}

export interface AssetCategory {
  category: string;
  total_value_usd: number;
  percentage: number;
  assets: Array<{
    name: string;
    symbol: string;
    protocol: string;
    amount: number;
    value_usd: number;
    apr?: number;
    type?: string;
  }>;
}

export interface PortfolioSummaryResponse {
  user_id: string;
  total_value_usd: number;
  total_change_24h: number;
  total_change_percentage: number;
  last_updated: string;
  categories?: AssetCategory[];
}

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

// Transformed data types for UI
export interface WalletAddress {
  id: string;
  address: string;
  label: string;
  isActive: boolean;
  isMain: boolean;
  isVisible: boolean;
  createdAt: string | null;
}

export interface ProtocolData {
  protocol: string;
  chain: string;
  value: number;
  pnl: number;
}

/**
 * Get user information by main wallet address
 */
export const getUserByWallet = async (
  walletAddress: string
): Promise<UserResponse> => {
  try {
    return await apiClient.get<UserResponse>(
      `/api/v1/users/by-wallet/${walletAddress}`
    );
  } catch (error) {
    if (error instanceof APIError && error.status === 404) {
      const userNotFoundError = new Error("USER_NOT_FOUND");
      userNotFoundError.name = "USER_NOT_FOUND";
      throw userNotFoundError;
    }
    throw error;
  }
};

/**
 * Get bundle wallet addresses by primary wallet
 */
export const getBundleWalletsByPrimary = async (
  userId: string
): Promise<BundleWalletsResponse> => {
  try {
    return await apiClient.get<BundleWalletsResponse>(
      `/api/v1/users/${userId}/bundle-wallets`
    );
  } catch (error) {
    if (error instanceof APIError && error.status === 404) {
      throw new Error("Bundle wallets not found");
    }
    throw error;
  }
};

/**
 * Get portfolio snapshots for a user
 */
export const getPortfolioSnapshots = async (
  userId: string,
  limit: number = 100,
  offset: number = 0
): Promise<PortfolioSnapshot[]> => {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });

  return await apiClient.get<PortfolioSnapshot[]>(
    `/api/v1/portfolio-snapshots/by-user/${userId}?${params}`
  );
};

/**
 * Get portfolio trends for a user
 */
export const getPortfolioTrends = async (
  userId: string,
  days: number = 30,
  limit: number = 100
): Promise<PortfolioTrend[]> => {
  const params = new URLSearchParams({
    days: days.toString(),
    limit: limit.toString(),
  });

  return await apiClient.get<PortfolioTrend[]>(
    `/api/v1/portfolio-trends/by-user/${userId}?${params}`
  );
};

/**
 * Get portfolio summary for a user
 */
export const getPortfolioSummary = async (
  userId: string,
  includeCategories: boolean = false
): Promise<PortfolioSummaryResponse> => {
  const params = new URLSearchParams();
  if (includeCategories) {
    params.set("include_categories", "true");
  }

  const endpoint = `/api/v1/users/${userId}/portfolio-summary`;
  const url = params.toString() ? `${endpoint}?${params}` : endpoint;

  return await apiClient.get<PortfolioSummaryResponse>(url);
};

/**
 * Get portfolio APR summary with pool details
 */
export const getPortfolioAPR = async (
  userId: string
): Promise<PortfolioAPRResponse> => {
  const endpoint = `/api/v1/apr/portfolio/${userId}/summary`;
  return await apiClient.get<PortfolioAPRResponse>(endpoint);
};

/**
 * Transform analytics-engine portfolio trends data into PortfolioDataPoint format
 */
export const transformPortfolioTrends = (
  trendsData: PortfolioTrend[]
): PortfolioDataPoint[] => {
  // Group by date and sum net_value_usd
  const groupedByDate = trendsData.reduce(
    (acc, item) => {
      const date = item.date;
      if (!acc[date]) {
        acc[date] = {
          date,
          totalValue: 0,
          protocols: [] as ProtocolData[],
          chains: new Set<string>(),
        };
      }
      acc[date].totalValue += item.net_value_usd;
      acc[date].protocols.push({
        protocol: item.protocol,
        chain: item.chain,
        value: item.net_value_usd,
        pnl: item.pnl_usd,
      });
      acc[date].chains.add(item.chain);
      return acc;
    },
    {} as Record<
      string,
      {
        date: string;
        totalValue: number;
        protocols: ProtocolData[];
        chains: Set<string>;
      }
    >
  );

  // Convert to array and sort by date
  const sortedData = Object.values(groupedByDate).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Calculate daily changes and format for chart
  return sortedData.map((item, index) => {
    const prevItem = index > 0 ? sortedData[index - 1] : null;
    const prevValue = prevItem ? prevItem.totalValue : item.totalValue;
    const change =
      prevValue > 0 ? ((item.totalValue - prevValue) / prevValue) * 100 : 0;

    return {
      date: item.date,
      value: item.totalValue,
      change,
      benchmark: item.totalValue * 0.95, // Mock benchmark - 5% below actual
      protocols: item.protocols,
      chainsCount: item.chains.size,
    };
  });
};

/**
 * Transform bundle addresses API response to WalletAddress format
 */
export const transformBundleWallets = (
  bundleData: BundleWalletsResponse | null | undefined
): WalletAddress[] => {
  if (!bundleData) {
    return [];
  }

  const wallets: WalletAddress[] = [];

  // Add primary wallet first
  wallets.push({
    id: "primary",
    address: bundleData.primary_wallet,
    label: "Main Wallet",
    isActive: true,
    isMain: true,
    isVisible: true,
    createdAt: null,
  });

  // Add additional wallets
  bundleData.additional_wallets?.forEach((wallet, index) => {
    wallets.push({
      id: wallet.wallet_address,
      address: wallet.wallet_address,
      label: wallet.label || `Wallet ${index + 2}`, // Auto-generate labels
      isActive: false,
      isMain: wallet.is_main ?? false,
      isVisible: wallet.is_visible ?? true, // Default to visible
      createdAt: wallet.created_at ?? null,
    });
  });

  return wallets;
};
