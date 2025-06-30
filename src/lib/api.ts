/**
 * API client for connecting frontend to quant-engine backend
 */

// Environment configuration
const QUANT_ENGINE_URL =
  process.env.NEXT_PUBLIC_QUANT_ENGINE_URL || "http://localhost:8003";

class APIClient {
  private baseUrl: string;

  constructor(baseUrl: string = QUANT_ENGINE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      // API Request failed
      throw error;
    }
  }

  // Portfolio endpoints
  async getPortfolio(address: string) {
    return this.request(`/api/v1/portfolio?address=${address}`);
  }

  async getPortfolioHistory(address: string, period: string = "30d") {
    return this.request(
      `/api/v1/portfolio/history?address=${address}&period=${period}`
    );
  }

  async getPortfolioMetrics(address: string) {
    return this.request(`/api/v1/portfolio/metrics?address=${address}`);
  }

  async getPortfolioAllocation(address: string, period: string = "30d") {
    return this.request(
      `/api/v1/portfolio/allocation?address=${address}&period=${period}`
    );
  }

  async getPortfolioDrawdown(address: string, period: string = "30d") {
    return this.request(
      `/api/v1/portfolio/drawdown?address=${address}&period=${period}`
    );
  }

  // APR endpoints
  async getPools(
    filters: {
      protocol?: string;
      chain?: string;
      pool_type?: string;
      min_apr?: number;
      min_tvl?: number;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    return this.request(`/api/v1/apr/pools?${params}`);
  }

  async getTopPools(limit: number = 10) {
    return this.request(`/api/v1/apr/pools/top?limit=${limit}`);
  }

  async getPoolDetail(poolId: string) {
    return this.request(`/api/v1/apr/pools/${poolId}`);
  }

  async getAPRAnalytics(protocol?: string, chain?: string) {
    const params = new URLSearchParams();
    if (protocol) params.append("protocol", protocol);
    if (chain) params.append("chain", chain);

    return this.request(`/api/v1/apr/analytics?${params}`);
  }

  // Strategy endpoints
  async getStrategies(
    filters: {
      risk_level?: string;
      strategy_type?: string;
      min_apr?: number;
      chain?: string;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    return this.request(`/api/v1/strategies?${params}`);
  }

  async getFeaturedStrategies(limit: number = 5) {
    return this.request(`/api/v1/strategies/featured?limit=${limit}`);
  }

  async getStrategyDetail(strategyId: string) {
    return this.request(`/api/v1/strategies/${strategyId}`);
  }

  async getStrategyPerformance(strategyId: string, period: string = "30d") {
    return this.request(
      `/api/v1/strategies/${strategyId}/performance?period=${period}`
    );
  }

  // Market endpoints
  async getMarketData() {
    return this.request("/api/v1/market/overview");
  }

  // Health check
  async healthCheck() {
    return this.request("/health");
  }
}

export const apiClient = new APIClient();
export default apiClient;
