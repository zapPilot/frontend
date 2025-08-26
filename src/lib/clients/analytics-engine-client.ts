/**
 * Analytics Engine Client
 * Handles portfolio analysis and quantitative operations (port 8001)
 */

import { BaseApiClient, APIError } from "./base-client";

export class AnalyticsEngineError extends APIError {
  constructor(message: string, status: number, code?: string, details?: any) {
    super(message, status, code, details);
    this.name = "AnalyticsEngineError";
  }
}

/**
 * Analytics interfaces
 */
export interface PortfolioSummary {
  totalValue: number;
  categories: Array<{
    name: string;
    value: number;
    percentage: number;
    color: string;
    protocols: Array<{
      name: string;
      value: number;
      percentage: number;
    }>;
  }>;
  performance: {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
  };
  apr: {
    current: number;
    historical: Array<{
      date: string;
      value: number;
    }>;
  };
}

export interface RebalanceRecommendations {
  recommendations: Array<{
    action: "buy" | "sell";
    token: string;
    amount: string;
    reason: string;
    expectedImpact: number;
  }>;
  totalImpact: number;
  riskScore: number;
  estimatedCost: string;
}

export interface PoolPerformance {
  pools: Array<{
    poolId: string;
    protocol: string;
    tokens: string[];
    apr: number;
    tvl: string;
    volume24h: string;
    performance: {
      daily: number;
      weekly: number;
      monthly: number;
    };
    riskMetrics: {
      impermanentLoss: number;
      volatility: number;
      liquidityRisk: number;
    };
  }>;
  summary: {
    averageApr: number;
    totalValue: string;
    riskScore: number;
  };
}

/**
 * Analytics Engine Client for portfolio analysis
 */
export class AnalyticsEngineClient extends BaseApiClient {
  constructor(baseURL: string) {
    super({
      baseURL,
      timeout: 15000, // Analysis operations can take time
      retries: 2,
      retryDelay: 1000,
      headers: {
        "X-Service": "analytics-engine",
      },
    });
  }

  /**
   * Create analytics-specific errors
   */
  protected override createServiceError(
    status: number,
    errorData: any
  ): AnalyticsEngineError {
    let message = errorData.message;

    switch (status) {
      case 400:
        if (message?.includes("address")) {
          message = "Invalid wallet address provided for analysis.";
        } else if (message?.includes("timeframe")) {
          message =
            "Invalid analysis timeframe. Supported: 1d, 7d, 30d, 90d, 1y.";
        }
        break;
      case 404:
        message = "No portfolio data found for this wallet address.";
        break;
      case 429:
        message =
          "Analysis rate limit reached. Please wait before requesting another analysis.";
        break;
      case 503:
        message =
          "Analytics engine is temporarily unavailable. Please try again later.";
        break;
    }

    return new AnalyticsEngineError(
      message,
      status,
      errorData.code,
      errorData.details
    );
  }

  // Portfolio Analysis Operations

  /**
   * Get comprehensive portfolio summary
   */
  async getPortfolioSummary(
    walletAddress: string,
    chainIds?: number[]
  ): Promise<PortfolioSummary> {
    const params: Record<string, string> = { wallet: walletAddress };
    if (chainIds && chainIds.length > 0) {
      params["chains"] = chainIds.join(",");
    }

    return this.get<PortfolioSummary>("/portfolio/summary", params);
  }

  /**
   * Get portfolio APR data with historical context
   */
  async getPortfolioAPR(
    userId: string,
    timeframe: "1d" | "7d" | "30d" | "90d" | "1y" = "30d"
  ): Promise<{
    currentApr: number;
    estimatedMonthlyIncome: number;
    historical: Array<{
      date: string;
      apr: number;
      category?: string;
    }>;
    pools: Array<{
      poolId: string;
      protocol: string;
      apr: number;
      contribution: number;
      value: string;
      chain: string;
    }>;
  }> {
    return this.get<{
      currentApr: number;
      estimatedMonthlyIncome: number;
      historical: Array<{
        date: string;
        apr: number;
        category?: string;
      }>;
      pools: Array<{
        poolId: string;
        protocol: string;
        apr: number;
        contribution: number;
        value: string;
        chain: string;
      }>;
    }>(`/api/v1/apr/portfolio/${userId}/summary`, { timeframe });
  }

  /**
   * Get pool performance analytics
   */
  async getPoolPerformance(
    walletAddress: string,
    sortBy: "apr" | "value" | "performance" = "apr",
    filterUnderperforming = false
  ): Promise<PoolPerformance> {
    return this.get<PoolPerformance>("/pools/performance", {
      wallet: walletAddress,
      sortBy,
      filterUnderperforming: filterUnderperforming.toString(),
    });
  }

  // Rebalancing and Optimization

  /**
   * Get rebalancing recommendations
   */
  async getRebalanceRecommendations(
    walletAddress: string,
    targetAllocation?: Record<string, number>
  ): Promise<RebalanceRecommendations> {
    const body: any = { walletAddress };
    if (targetAllocation) {
      body.targetAllocation = targetAllocation;
    }

    return this.post<RebalanceRecommendations>(
      "/rebalance/recommendations",
      body
    );
  }

  /**
   * Simulate rebalance impact
   */
  async simulateRebalance(
    walletAddress: string,
    actions: Array<{
      action: "buy" | "sell";
      token: string;
      amount: string;
    }>
  ): Promise<{
    expectedGas: string;
    priceImpact: number;
    expectedApr: number;
    riskChange: number;
    timeline: number;
  }> {
    return this.post<{
      expectedGas: string;
      priceImpact: number;
      expectedApr: number;
      riskChange: number;
      timeline: number;
    }>("/rebalance/simulate", {
      walletAddress,
      actions,
    });
  }

  // Performance Analytics

  /**
   * Get performance trend data
   */
  async getPerformanceTrend(
    walletAddress: string,
    timeframe: "7d" | "30d" | "90d" | "1y" = "30d",
    category?: string
  ): Promise<
    Array<{
      date: string;
      value: number;
      apr: number;
      category?: string;
    }>
  > {
    const params: Record<string, string> = {
      wallet: walletAddress,
      timeframe,
    };
    if (category) {
      params["category"] = category;
    }

    return this.get<
      Array<{
        date: string;
        value: number;
        apr: number;
        category?: string;
      }>
    >("/performance/trend", params);
  }

  /**
   * Get risk metrics analysis
   */
  async getRiskMetrics(walletAddress: string): Promise<{
    overallRisk: number;
    diversificationScore: number;
    volatilityRisk: number;
    liquidityRisk: number;
    smartContractRisk: number;
    impermanentLossRisk: number;
    recommendations: string[];
  }> {
    return this.get<{
      overallRisk: number;
      diversificationScore: number;
      volatilityRisk: number;
      liquidityRisk: number;
      smartContractRisk: number;
      impermanentLossRisk: number;
      recommendations: string[];
    }>("/risk/metrics", { wallet: walletAddress });
  }

  // Utility Operations

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: string;
    timestamp: string;
    dataFreshness: number;
    analysisQueue: number;
  }> {
    return this.get<{
      status: string;
      timestamp: string;
      dataFreshness: number;
      analysisQueue: number;
    }>("/health");
  }

  /**
   * Get supported protocols and chains
   */
  async getSupportedProtocols(): Promise<{
    protocols: Array<{
      name: string;
      chains: number[];
      categories: string[];
    }>;
    chains: Array<{
      chainId: number;
      name: string;
      supported: boolean;
    }>;
  }> {
    return this.get<{
      protocols: Array<{
        name: string;
        chains: number[];
        categories: string[];
      }>;
      chains: Array<{
        chainId: number;
        name: string;
        supported: boolean;
      }>;
    }>("/config/protocols");
  }
}

// Singleton instance
export const analyticsEngineClient = new AnalyticsEngineClient(
  process.env["NEXT_PUBLIC_QUANT_ENGINE_URL"] || "http://localhost:8001"
);
