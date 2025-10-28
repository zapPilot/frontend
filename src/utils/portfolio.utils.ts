/**
 * Category summary utilities for unified landing page data
 *
 * Functions to transform pool_details from landing-page API into category summaries
 * for progressive disclosure UX (show summaries on landing, full details in analytics)
 */

export interface CategorySummary {
  id: string;
  name: string;
  color: string;
  totalValue: number;
  percentage: number;
  averageAPR: number;
  // Removed poolCount as this data is no longer provided by the unified API
  topProtocols: Array<{
    name: string;
    value: number;
    count: number;
  }>;
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

/**
 * Categorize pool details by asset type based on symbols
 */
import { ASSET_SYMBOL_SETS } from "@/constants/assetSymbols";
import { ASSET_CATEGORIES } from "@/constants/portfolio";

export function categorizePool(
  poolSymbols: string[]
): "btc" | "eth" | "stablecoins" | "others" {
  const symbols = poolSymbols.map(s => s.toLowerCase());

  if (symbols.some(s => ASSET_SYMBOL_SETS.btc.has(s))) return "btc";
  if (symbols.some(s => ASSET_SYMBOL_SETS.eth.has(s))) return "eth";
  if (symbols.some(s => ASSET_SYMBOL_SETS.stablecoins.has(s)))
    return "stablecoins";
  return "others";
}

/**
 * Create category summaries from unified API data structure
 * Works for both assets (pie_chart_categories) and debt (category_summary_debt)
 */
export function createCategoriesFromApiData(
  categoryData: {
    btc: number;
    eth: number;
    stablecoins: number;
    others: number;
  },
  totalValue: number
): CategorySummary[] {
  if (!categoryData) {
    return [];
  }

  const categoryInfo = {
    btc: { name: "Bitcoin", color: ASSET_CATEGORIES.btc.brandColor },
    eth: { name: "Ethereum", color: ASSET_CATEGORIES.eth.brandColor },
    stablecoins: {
      name: "Stablecoins",
      color: ASSET_CATEGORIES.stablecoin.brandColor,
    },
    others: { name: "Others", color: ASSET_CATEGORIES.altcoin.brandColor },
  };

  return Object.entries(categoryData)
    .filter(([, value]) => value > 0) // Only include categories with value
    .map(([categoryId, value]) => {
      const info = categoryInfo[categoryId as keyof typeof categoryInfo];
      const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0;

      return {
        id: categoryId,
        name: info.name,
        color: info.color,
        totalValue: value,
        percentage,
        averageAPR: 0, // Not available in simplified API structure
        topProtocols: [], // Not available in simplified API structure
      };
    })
    .sort((a, b) => b.totalValue - a.totalValue);
}

/**
 * Filter pool details by category for analytics tab
 */
export function filterPoolDetailsByCategory(
  poolDetails: PoolDetail[],
  categoryId: string
): PoolDetail[] {
  if (!poolDetails || poolDetails.length === 0) {
    return [];
  }

  return poolDetails.filter(pool => {
    const category = categorizePool(pool.pool_symbols);
    return category === categoryId;
  });
}
