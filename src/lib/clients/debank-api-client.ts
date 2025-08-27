/**
 * DeBank API Client
 * Handles external DeFi data aggregation and portfolio tracking
 */

import { APIError, BaseApiClient } from "./base-client";

export class DebankApiError extends APIError {
  constructor(message: string, status: number, code?: string, details?: any) {
    super(message, status, code, details);
    this.name = "DebankApiError";
  }
}

/**
 * DeBank API interfaces
 */
export interface DebankPortfolioItem {
  id: string;
  chain: string;
  name: string;
  site_url: string;
  logo_url: string;
  has_supported_portfolio: boolean;
  tvl: number;
  portfolio_item_list: Array<{
    stats: {
      asset_usd_value: number;
      debt_usd_value: number;
      net_usd_value: number;
    };
    asset_token_list: Array<{
      id: string;
      chain: string;
      name: string;
      symbol: string;
      display_symbol: string;
      optimized_symbol: string;
      decimals: number;
      logo_url: string;
      protocol_id: string;
      price: number;
      is_verified: boolean;
      is_core: boolean;
      is_wallet: boolean;
      time_at: number;
      amount: number;
    }>;
  }>;
}

export interface DebankTokenBalance {
  id: string;
  chain: string;
  name: string;
  symbol: string;
  display_symbol: string;
  optimized_symbol: string;
  decimals: number;
  logo_url: string;
  protocol_id: string;
  price: number;
  is_verified: boolean;
  is_core: boolean;
  is_wallet: boolean;
  time_at: number;
  amount: number;
  raw_amount: number;
  raw_amount_hex_str: string;
}

export interface DebankProtocolPosition {
  id: string;
  chain: string;
  name: string;
  site_url: string;
  logo_url: string;
  has_supported_portfolio: boolean;
  tvl: number;
  portfolio_item_list: Array<{
    stats: {
      asset_usd_value: number;
      debt_usd_value: number;
      net_usd_value: number;
    };
    asset_token_list: DebankTokenBalance[];
    debt_token_list: DebankTokenBalance[];
  }>;
}

/**
 * DeBank API Client for DeFi data aggregation
 */
export class DebankApiClient extends BaseApiClient {
  constructor(baseURL: string, apiKey?: string) {
    super({
      baseURL,
      timeout: 10000,
      retries: 3,
      retryDelay: 1000,
      headers: {
        "X-Service": "debank-api",
        ...(apiKey && { AccessKey: apiKey }),
      },
    });
  }

  /**
   * Create DeBank-specific errors
   */
  protected override createServiceError(
    status: number,
    errorData: any
  ): DebankApiError {
    let message = errorData.message || errorData.error_msg;

    switch (status) {
      case 400:
        message =
          "Invalid request parameters. Please check wallet address format.";
        break;
      case 401:
        message =
          "DeBank API authentication failed. Please check your API key.";
        break;
      case 403:
        message =
          "DeBank API access denied. Your API key may not have sufficient permissions.";
        break;
      case 429:
        message =
          "DeBank API rate limit exceeded. Please wait before making more requests.";
        break;
      case 500:
        message = "DeBank API server error. Please try again later.";
        break;
    }

    return new DebankApiError(message, status, errorData.error_code, errorData);
  }

  // Portfolio Data Operations

  /**
   * Get user's total balance across all protocols
   */
  async getTotalBalance(userAddress: string): Promise<{
    total_usd_value: number;
    chain_list: Array<{
      id: string;
      community_id: number;
      name: string;
      native_token_id: string;
      logo_url: string;
      wrapped_token_id: string;
      usd_value: number;
    }>;
  }> {
    return this.get<{
      total_usd_value: number;
      chain_list: Array<{
        id: string;
        community_id: number;
        name: string;
        native_token_id: string;
        logo_url: string;
        wrapped_token_id: string;
        usd_value: number;
      }>;
    }>(`/v1/user/total_balance`, { id: userAddress });
  }

  /**
   * Get user's token balances on a specific chain
   */
  async getTokenBalances(
    userAddress: string,
    chainId?: string,
    isAll = false
  ): Promise<DebankTokenBalance[]> {
    const params: Record<string, string> = {
      id: userAddress,
      is_all: isAll.toString(),
    };
    if (chainId) {
      params["chain_id"] = chainId;
    }

    return this.get<DebankTokenBalance[]>("/v1/user/token_list", params);
  }

  /**
   * Get user's DeFi protocol positions
   */
  async getProtocolPositions(
    userAddress: string
  ): Promise<DebankProtocolPosition[]> {
    return this.get<DebankProtocolPosition[]>(
      "/v1/user/complex_protocol_list",
      {
        id: userAddress,
      }
    );
  }

  /**
   * Get user's portfolio on a specific protocol
   */
  async getProtocolPortfolio(
    userAddress: string,
    protocolId: string
  ): Promise<DebankPortfolioItem> {
    return this.get<DebankPortfolioItem>("/v1/user/protocol", {
      id: userAddress,
      protocol_id: protocolId,
    });
  }

  // Transaction Operations

  /**
   * Get user's transaction history
   */
  async getTransactionHistory(
    userAddress: string,
    chainId?: string,
    startTime?: number,
    pageCount = 20
  ): Promise<{
    history_list: Array<{
      id: string;
      chain: string;
      time_at: number;
      tx_hash: string;
      tx_status: number;
      sends: DebankTokenBalance[];
      receives: DebankTokenBalance[];
      cate_id: string;
      project_id: string;
    }>;
    token_dict: Record<string, DebankTokenBalance>;
  }> {
    const params: Record<string, string> = {
      id: userAddress,
      page_count: pageCount.toString(),
    };
    if (chainId) params["chain_id"] = chainId;
    if (startTime) params["start_time"] = startTime.toString();

    return this.get<{
      history_list: Array<{
        id: string;
        chain: string;
        time_at: number;
        tx_hash: string;
        tx_status: number;
        sends: DebankTokenBalance[];
        receives: DebankTokenBalance[];
        cate_id: string;
        project_id: string;
      }>;
      token_dict: Record<string, DebankTokenBalance>;
    }>("/v1/user/history_list", params);
  }

  // Token and Protocol Information

  /**
   * Get token information by address
   */
  async getTokenInfo(tokenId: string): Promise<{
    id: string;
    chain: string;
    name: string;
    symbol: string;
    display_symbol: string;
    optimized_symbol: string;
    decimals: number;
    logo_url: string;
    protocol_id: string;
    price: number;
    is_verified: boolean;
    is_core: boolean;
    time_at: number;
  }> {
    return this.get<{
      id: string;
      chain: string;
      name: string;
      symbol: string;
      display_symbol: string;
      optimized_symbol: string;
      decimals: number;
      logo_url: string;
      protocol_id: string;
      price: number;
      is_verified: boolean;
      is_core: boolean;
      time_at: number;
    }>("/v1/token", { id: tokenId });
  }

  /**
   * Get protocol information
   */
  async getProtocolInfo(protocolId: string): Promise<{
    id: string;
    chain: string;
    name: string;
    site_url: string;
    logo_url: string;
    has_supported_portfolio: boolean;
    tvl: number;

    tag_ids: string[];
  }> {
    return this.get<{
      id: string;
      chain: string;
      name: string;
      site_url: string;
      logo_url: string;
      has_supported_portfolio: boolean;
      tvl: number;

      tag_ids: string[];
    }>("/v1/protocol", { id: protocolId });
  }

  /**
   * Get supported chains
   */
  async getSupportedChains(): Promise<
    Array<{
      id: string;
      community_id: number;
      name: string;
      native_token_id: string;
      logo_url: string;
      wrapped_token_id: string;
    }>
  > {
    return this.get<
      Array<{
        id: string;
        community_id: number;
        name: string;
        native_token_id: string;
        logo_url: string;
        wrapped_token_id: string;
      }>
    >("/v1/chain/list");
  }

  /**
   * Get all supported protocols
   */
  async getSupportedProtocols(): Promise<
    Array<{
      id: string;
      chain: string;
      name: string;
      site_url: string;
      logo_url: string;
      has_supported_portfolio: boolean;
      tvl: number;

      tag_ids: string[];
    }>
  > {
    return this.get<
      Array<{
        id: string;
        chain: string;
        name: string;
        site_url: string;
        logo_url: string;
        has_supported_portfolio: boolean;
        tvl: number;

        tag_ids: string[];
      }>
    >("/v1/protocol/list");
  }

  // Utility Operations

  /**
   * Check if wallet address is valid
   */
  async validateWalletAddress(address: string): Promise<{
    is_valid: boolean;
    normalized?: string;
  }> {
    try {
      await this.get("/v1/user/total_balance", { id: address });
      return { is_valid: true, normalized: address.toLowerCase() };
    } catch (error) {
      if (error instanceof DebankApiError && error.status === 400) {
        return { is_valid: false };
      }
      throw error;
    }
  }

  /**
   * Get current gas prices for supported chains
   */
  async getGasPrices(): Promise<
    Record<
      string,
      {
        slow: number;
        normal: number;
        fast: number;
        instant: number;
      }
    >
  > {
    return this.get<
      Record<
        string,
        {
          slow: number;
          normal: number;
          fast: number;
          instant: number;
        }
      >
    >("/v1/gas_price");
  }
}

// Singleton instance
export const debankApiClient = new DebankApiClient(
  process.env["NEXT_PUBLIC_DEBANK_API_URL"] || "https://pro-openapi.debank.com",
  process.env["DEBANK_API_KEY"] // Optional API key for higher rate limits
);
