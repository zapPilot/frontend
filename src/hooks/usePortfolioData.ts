/**
 * Enhanced portfolio data hook that integrates with quant-engine API
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { apiClient } from "../lib/api";
import { useSubscription } from "./useSubscription";
import {
  AssetCategory,
  PieChartData,
  PortfolioMetrics,
} from "../types/portfolio";
import { calculatePortfolioMetrics } from "../lib/utils";

interface UsePortfolioDataReturn {
  // Data state
  portfolioData: AssetCategory[];
  portfolioMetrics: PortfolioMetrics;
  pieChartData: PieChartData[];

  // API data
  portfolioHistory: any[];
  aprMetrics: any[];
  featuredStrategies: any[];
  topPools: any[];

  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  // UI state
  balanceHidden: boolean;
  expandedCategory: string | null;

  // Actions
  toggleBalanceVisibility: () => void;
  toggleCategoryExpansion: (categoryId: string) => void;
  handleLegendItemClick: (item: PieChartData) => void;
  refreshPortfolio: () => Promise<void>;
  setWalletAddress: (address: string) => void;
}

export function usePortfolioData(): UsePortfolioDataReturn {
  // Subscription context for feature access
  const { canAccessFeature, currentTier } = useSubscription();

  // State management
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [portfolioData, setPortfolioData] = useState<AssetCategory[]>([]);
  const [portfolioHistory, setPortfolioHistory] = useState<any[]>([]);
  const [aprMetrics, setAprMetrics] = useState<any[]>([]);
  const [featuredStrategies, setFeaturedStrategies] = useState<any[]>([]);
  const [topPools, setTopPools] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Calculate portfolio metrics from current data
  const portfolioMetrics: PortfolioMetrics = useMemo(
    () => calculatePortfolioMetrics(portfolioData),
    [portfolioData]
  );

  // Transform data for pie chart
  const pieChartData: PieChartData[] = useMemo(
    () =>
      portfolioData.map(cat => ({
        label: cat.name,
        value: cat.totalValue,
        percentage: cat.percentage,
        color: cat.color,
      })),
    [portfolioData]
  );

  // Load portfolio data from API
  const loadPortfolioData = useCallback(
    async (address: string, refresh = false) => {
      if (!address) return;

      const loadingState = refresh ? setIsRefreshing : setIsLoading;
      loadingState(true);
      setError(null);

      try {
        // Check rate limits based on subscription tier
        const refreshRate = currentTier.limits.dataRefreshRate;
        const lastUpdate = localStorage.getItem(
          `portfolio_last_update_${address}`
        );

        if (!refresh && lastUpdate) {
          const timeSinceUpdate = Date.now() - parseInt(lastUpdate);
          const minInterval = refreshRate * 60 * 1000; // Convert minutes to milliseconds

          if (
            timeSinceUpdate < minInterval &&
            !canAccessFeature("Real-time data refresh")
          ) {
            throw new Error(
              `Rate limited. Next update available in ${Math.ceil((minInterval - timeSinceUpdate) / 60000)} minutes.`
            );
          }
        }

        // Parallel API calls for better performance
        const [
          portfolioResponse,
          historyResponse,
          metricsResponse,
          strategiesResponse,
          poolsResponse,
        ] = await Promise.allSettled([
          canAccessFeature("Advanced portfolio analytics")
            ? apiClient.getPortfolio(address)
            : Promise.resolve(null),
          canAccessFeature("1-year historical data")
            ? apiClient.getPortfolioHistory(address, "30d")
            : Promise.resolve([]),
          canAccessFeature("Advanced portfolio analytics")
            ? apiClient.getPortfolioMetrics(address)
            : Promise.resolve([]),
          apiClient.getFeaturedStrategies(5),
          apiClient.getTopPools(10),
        ]);

        // Process portfolio data
        if (
          portfolioResponse.status === "fulfilled" &&
          portfolioResponse.value
        ) {
          const transformedData = transformPortfolioData(
            portfolioResponse.value
          );
          setPortfolioData(transformedData);
        }

        // Process history data
        if (historyResponse.status === "fulfilled") {
          setPortfolioHistory(historyResponse.value || []);
        }

        // Process metrics
        if (metricsResponse.status === "fulfilled") {
          setAprMetrics(metricsResponse.value || []);
        }

        // Process strategies (always available)
        if (strategiesResponse.status === "fulfilled") {
          setFeaturedStrategies(strategiesResponse.value || []);
        }

        // Process pools (always available)
        if (poolsResponse.status === "fulfilled") {
          setTopPools(poolsResponse.value?.pools || []);
        }

        // Update last refresh timestamp
        localStorage.setItem(
          `portfolio_last_update_${address}`,
          Date.now().toString()
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load portfolio data";
        setError(errorMessage);
        console.error("Portfolio data loading error:", err);
      } finally {
        loadingState(false);
      }
    },
    [canAccessFeature, currentTier]
  );

  // Transform API response to portfolio data format
  const transformPortfolioData = (apiData: any): AssetCategory[] => {
    // Mock transformation - replace with actual API response mapping
    return [
      {
        id: "defi",
        name: "DeFi",
        totalValue: apiData.defi_value || 45000,
        percentage: 35.2,
        color: "#8B5CF6",
        change24h: 2.4,
        assets: [],
      },
      {
        id: "stablecoins",
        name: "Stablecoins",
        totalValue: apiData.stable_value || 25000,
        percentage: 20.1,
        color: "#10B981",
        change24h: 0.1,
        assets: [],
      },
      {
        id: "crypto",
        name: "Crypto",
        totalValue: apiData.crypto_value || 58000,
        percentage: 44.7,
        color: "#F59E0B",
        change24h: -1.2,
        assets: [],
      },
    ];
  };

  // Refresh portfolio data
  const refreshPortfolio = useCallback(async () => {
    if (walletAddress) {
      await loadPortfolioData(walletAddress, true);
    }
  }, [walletAddress, loadPortfolioData]);

  // UI action handlers
  const toggleBalanceVisibility = useCallback(() => {
    setBalanceHidden(prev => !prev);
  }, []);

  const toggleCategoryExpansion = useCallback((categoryId: string) => {
    setExpandedCategory(prev => (prev === categoryId ? null : categoryId));
  }, []);

  const handleLegendItemClick = useCallback(
    (item: PieChartData) => {
      const category = portfolioData.find(cat => cat.name === item.label);
      if (category) {
        toggleCategoryExpansion(category.id);
      }
    },
    [portfolioData, toggleCategoryExpansion]
  );

  // Auto-refresh based on subscription tier
  useEffect(() => {
    if (!walletAddress || !canAccessFeature("Real-time data refresh")) return;

    const refreshInterval = currentTier.limits.dataRefreshRate * 60 * 1000; // Convert to milliseconds
    const interval = setInterval(() => {
      refreshPortfolio();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [walletAddress, canAccessFeature, currentTier, refreshPortfolio]);

  // Load data when wallet address changes
  useEffect(() => {
    if (walletAddress) {
      loadPortfolioData(walletAddress);
    }
  }, [walletAddress, loadPortfolioData]);

  return {
    // Data state
    portfolioData,
    portfolioMetrics,
    pieChartData,

    // API data
    portfolioHistory,
    aprMetrics,
    featuredStrategies,
    topPools,

    // Loading states
    isLoading,
    isRefreshing,
    error,

    // UI state
    balanceHidden,
    expandedCategory,

    // Actions
    toggleBalanceVisibility,
    toggleCategoryExpansion,
    handleLegendItemClick,
    refreshPortfolio,
    setWalletAddress,
  };
}
