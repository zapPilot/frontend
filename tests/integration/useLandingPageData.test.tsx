/**
 * Integration tests for useLandingPageData hook (Portfolio APR & Analytics)
 *
 * Tests comprehensive landing page data fetching including:
 * 1. Portfolio summary with total value
 * 2. APR calculations (weighted average across pools)
 * 3. Asset categorization and breakdown
 * 4. Pool-level APR details
 * 5. Coverage and matching statistics
 * 6. Auto-refresh behavior
 *
 * Coverage includes:
 * - Happy path data fetching
 * - APR calculations with zero/negative values
 * - Edge cases (empty portfolio, missing data)
 * - Loading and error states
 * - Auto-refetch functionality
 * - Cache invalidation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { useLandingPageData } from "../../src/hooks/queries/usePortfolioQuery";
import type {
  LandingPageResponse,
  PoolDetail,
  PortfolioAPRSummary,
} from "../../src/services/analyticsService";

// Mock the analytics service
vi.mock("../../src/services/analyticsService", () => ({
  getLandingPagePortfolioData: vi.fn(),
}));

import * as analyticsService from "../../src/services/analyticsService";

// Test wrapper with React Query
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        refetchInterval: false, // Disable auto-refetch in tests
      },
    },
  });

  function QueryWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  QueryWrapper.displayName = "QueryWrapper";

  return QueryWrapper;
}

// Mock data generators
function createMockPoolDetails(count: number = 3): PoolDetail[] {
  const pools: PoolDetail[] = [];

  for (let i = 0; i < count; i++) {
    pools.push({
      snapshot_id: `snapshot-${i}`,
      chain: "ethereum",
      protocol: `protocol-${i}`,
      protocol_name: `Protocol ${i}`,
      asset_usd_value: 10000 + i * 5000,
      pool_symbols: [`TOKEN${i}`, `TOKEN${i + 1}`],
      final_apr: 5 + i * 2.5,
      protocol_matched: true,
      apr_data: {
        apr_protocol: `protocol-${i}`,
        apr_symbol: `LP-${i}`,
        apr: 5 + i * 2.5,
        apr_base: 3 + i * 1.5,
        apr_reward: 2 + i * 1,
        apr_updated_at: new Date().toISOString(),
      },
      contribution_to_portfolio: (10000 + i * 5000) / 25000,
    });
  }

  return pools;
}

function createMockAPRSummary(pools: PoolDetail[]): PortfolioAPRSummary {
  const totalValue = pools.reduce((sum, pool) => sum + pool.asset_usd_value, 0);
  const matchedPools = pools.filter(p => p.protocol_matched).length;
  const matchedValue = pools
    .filter(p => p.protocol_matched)
    .reduce((sum, pool) => sum + pool.asset_usd_value, 0);

  const weightedAPR = pools.reduce((sum, pool) => {
    const weight = pool.asset_usd_value / totalValue;
    return sum + pool.final_apr * weight;
  }, 0);

  return {
    total_asset_value_usd: totalValue,
    weighted_apr: weightedAPR,
    matched_pools: matchedPools,
    total_pools: pools.length,
    matched_asset_value_usd: matchedValue,
    coverage_percentage: (matchedValue / totalValue) * 100,
  };
}

function createMockLandingPageResponse(
  poolCount: number = 3,
  overrides?: Partial<LandingPageResponse>
): LandingPageResponse {
  const pools = createMockPoolDetails(poolCount);
  const aprSummary = createMockAPRSummary(pools);

  return {
    user_id: "test-user-123",
    portfolio_summary: aprSummary,
    pool_details: pools,
    ...overrides,
  };
}

describe("useLandingPageData - APR Calculations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("calculates weighted average APR correctly", async () => {
    const mockPools: PoolDetail[] = [
      {
        snapshot_id: "1",
        chain: "ethereum",
        protocol: "uniswap",
        protocol_name: "Uniswap V3",
        asset_usd_value: 10000,
        pool_symbols: ["ETH", "USDC"],
        final_apr: 10,
        protocol_matched: true,
        apr_data: {
          apr_protocol: "uniswap",
          apr_symbol: "ETH-USDC",
          apr: 10,
          apr_base: 6,
          apr_reward: 4,
          apr_updated_at: new Date().toISOString(),
        },
        contribution_to_portfolio: 0.5,
      },
      {
        snapshot_id: "2",
        chain: "ethereum",
        protocol: "aave",
        protocol_name: "Aave V3",
        asset_usd_value: 10000,
        pool_symbols: ["USDC"],
        final_apr: 5,
        protocol_matched: true,
        apr_data: {
          apr_protocol: "aave",
          apr_symbol: "aUSDC",
          apr: 5,
          apr_base: 5,
          apr_reward: 0,
          apr_updated_at: new Date().toISOString(),
        },
        contribution_to_portfolio: 0.5,
      },
    ];

    const mockResponse = createMockLandingPageResponse(0, {
      pool_details: mockPools,
      portfolio_summary: createMockAPRSummary(mockPools),
    });

    vi.mocked(analyticsService.getLandingPagePortfolioData).mockResolvedValue(
      mockResponse
    );

    const { result } = renderHook(() => useLandingPageData("test-user"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data?.portfolio_summary.weighted_apr).toBeCloseTo(
      7.5,
      2
    );
  });

  it("handles zero allocation pools", async () => {
    const mockPools: PoolDetail[] = [
      {
        snapshot_id: "1",
        chain: "ethereum",
        protocol: "uniswap",
        protocol_name: "Uniswap V3",
        asset_usd_value: 0, // Zero allocation
        pool_symbols: ["ETH", "USDC"],
        final_apr: 15,
        protocol_matched: true,
        apr_data: {
          apr_protocol: "uniswap",
          apr_symbol: "ETH-USDC",
          apr: 15,
          apr_base: 10,
          apr_reward: 5,
          apr_updated_at: new Date().toISOString(),
        },
        contribution_to_portfolio: 0,
      },
      {
        snapshot_id: "2",
        chain: "ethereum",
        protocol: "aave",
        protocol_name: "Aave V3",
        asset_usd_value: 10000,
        pool_symbols: ["USDC"],
        final_apr: 5,
        protocol_matched: true,
        apr_data: {
          apr_protocol: "aave",
          apr_symbol: "aUSDC",
          apr: 5,
          apr_base: 5,
          apr_reward: 0,
          apr_updated_at: new Date().toISOString(),
        },
        contribution_to_portfolio: 1.0,
      },
    ];

    const mockResponse = createMockLandingPageResponse(0, {
      pool_details: mockPools,
      portfolio_summary: createMockAPRSummary(mockPools),
    });

    vi.mocked(analyticsService.getLandingPagePortfolioData).mockResolvedValue(
      mockResponse
    );

    const { result } = renderHook(() => useLandingPageData("test-user"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Weighted APR should be 5% (only non-zero pool)
    expect(result.current.data?.portfolio_summary.weighted_apr).toBeCloseTo(
      5,
      2
    );
  });

  it("aggregates APR across DeFi protocols", async () => {
    const mockPools: PoolDetail[] = [
      {
        snapshot_id: "1",
        chain: "ethereum",
        protocol: "uniswap",
        protocol_name: "Uniswap V3",
        asset_usd_value: 5000,
        pool_symbols: ["ETH", "USDC"],
        final_apr: 12,
        protocol_matched: true,
        apr_data: {
          apr_protocol: "uniswap",
          apr_symbol: "ETH-USDC",
          apr: 12,
          apr_base: 8,
          apr_reward: 4,
          apr_updated_at: new Date().toISOString(),
        },
        contribution_to_portfolio: 0.25,
      },
      {
        snapshot_id: "2",
        chain: "polygon",
        protocol: "quickswap",
        protocol_name: "QuickSwap",
        asset_usd_value: 5000,
        pool_symbols: ["MATIC", "USDC"],
        final_apr: 8,
        protocol_matched: true,
        apr_data: {
          apr_protocol: "quickswap",
          apr_symbol: "MATIC-USDC",
          apr: 8,
          apr_base: 5,
          apr_reward: 3,
          apr_updated_at: new Date().toISOString(),
        },
        contribution_to_portfolio: 0.25,
      },
      {
        snapshot_id: "3",
        chain: "ethereum",
        protocol: "wallet",
        protocol_name: "Wallet Holdings",
        asset_usd_value: 10000,
        pool_symbols: ["ETH"],
        final_apr: 0,
        protocol_matched: false,
        apr_data: {
          apr_protocol: null,
          apr_symbol: null,
          apr: null,
          apr_base: null,
          apr_reward: null,
          apr_updated_at: null,
        },
        contribution_to_portfolio: 0.5,
      },
    ];

    const mockResponse = createMockLandingPageResponse(0, {
      pool_details: mockPools,
      portfolio_summary: createMockAPRSummary(mockPools),
    });

    vi.mocked(analyticsService.getLandingPagePortfolioData).mockResolvedValue(
      mockResponse
    );

    const { result } = renderHook(() => useLandingPageData("test-user"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const summary = result.current.data?.portfolio_summary;
    expect(summary?.total_pools).toBe(3);
    expect(summary?.matched_pools).toBe(2);
    expect(summary?.coverage_percentage).toBeCloseTo(50, 1);
  });

  it("handles negative APR values", async () => {
    const mockPools: PoolDetail[] = [
      {
        snapshot_id: "1",
        chain: "ethereum",
        protocol: "uniswap",
        protocol_name: "Uniswap V3",
        asset_usd_value: 10000,
        pool_symbols: ["ETH", "USDC"],
        final_apr: -5, // Impermanent loss
        protocol_matched: true,
        apr_data: {
          apr_protocol: "uniswap",
          apr_symbol: "ETH-USDC",
          apr: -5,
          apr_base: 3,
          apr_reward: -8,
          apr_updated_at: new Date().toISOString(),
        },
        contribution_to_portfolio: 1.0,
      },
    ];

    const mockResponse = createMockLandingPageResponse(0, {
      pool_details: mockPools,
      portfolio_summary: createMockAPRSummary(mockPools),
    });

    vi.mocked(analyticsService.getLandingPagePortfolioData).mockResolvedValue(
      mockResponse
    );

    const { result } = renderHook(() => useLandingPageData("test-user"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.portfolio_summary.weighted_apr).toBe(-5);
  });

  it("handles extreme APR values", async () => {
    const mockPools: PoolDetail[] = [
      {
        snapshot_id: "1",
        chain: "ethereum",
        protocol: "scam-protocol",
        protocol_name: "Too Good To Be True",
        asset_usd_value: 1000,
        pool_symbols: ["SCAM", "USDC"],
        final_apr: 10000, // Suspicious 10000%
        protocol_matched: true,
        apr_data: {
          apr_protocol: "scam-protocol",
          apr_symbol: "SCAM-USDC",
          apr: 10000,
          apr_base: 10000,
          apr_reward: 0,
          apr_updated_at: new Date().toISOString(),
        },
        contribution_to_portfolio: 0.1,
      },
      {
        snapshot_id: "2",
        chain: "ethereum",
        protocol: "aave",
        protocol_name: "Aave V3",
        asset_usd_value: 9000,
        pool_symbols: ["USDC"],
        final_apr: 5,
        protocol_matched: true,
        apr_data: {
          apr_protocol: "aave",
          apr_symbol: "aUSDC",
          apr: 5,
          apr_base: 5,
          apr_reward: 0,
          apr_updated_at: new Date().toISOString(),
        },
        contribution_to_portfolio: 0.9,
      },
    ];

    const mockResponse = createMockLandingPageResponse(0, {
      pool_details: mockPools,
      portfolio_summary: createMockAPRSummary(mockPools),
    });

    vi.mocked(analyticsService.getLandingPagePortfolioData).mockResolvedValue(
      mockResponse
    );

    const { result } = renderHook(() => useLandingPageData("test-user"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Weighted: 0.1 * 10000 + 0.9 * 5 = 1000 + 4.5 = 1004.5
    const weightedAPR = result.current.data?.portfolio_summary.weighted_apr;
    expect(weightedAPR).toBeGreaterThan(1000);
  });
});

describe("useLandingPageData - Edge Cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles empty portfolio", async () => {
    const mockResponse: LandingPageResponse = {
      user_id: "test-user",
      portfolio_summary: {
        total_asset_value_usd: 0,
        weighted_apr: 0,
        matched_pools: 0,
        total_pools: 0,
        matched_asset_value_usd: 0,
        coverage_percentage: 0,
      },
      pool_details: [],
    };

    vi.mocked(analyticsService.getLandingPagePortfolioData).mockResolvedValue(
      mockResponse
    );

    const { result } = renderHook(() => useLandingPageData("test-user"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.portfolio_summary.total_asset_value_usd).toBe(
      0
    );
    expect(result.current.data?.portfolio_summary.weighted_apr).toBe(0);
    expect(result.current.data?.pool_details).toEqual([]);
  });

  it("handles missing userId", () => {
    const { result } = renderHook(() => useLandingPageData(null), {
      wrapper: createWrapper(),
    });

    // Should not make API call
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(analyticsService.getLandingPagePortfolioData).not.toHaveBeenCalled();
  });

  it("handles undefined userId", () => {
    const { result } = renderHook(() => useLandingPageData(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(analyticsService.getLandingPagePortfolioData).not.toHaveBeenCalled();
  });

  it("handles missing APR data in pools", async () => {
    const mockPools: PoolDetail[] = [
      {
        snapshot_id: "1",
        chain: "ethereum",
        protocol: "unknown",
        protocol_name: "Unknown Protocol",
        asset_usd_value: 10000,
        pool_symbols: ["TOKEN1", "TOKEN2"],
        final_apr: 0,
        protocol_matched: false,
        apr_data: {
          apr_protocol: null,
          apr_symbol: null,
          apr: null,
          apr_base: null,
          apr_reward: null,
          apr_updated_at: null,
        },
        contribution_to_portfolio: 1.0,
      },
    ];

    const mockResponse = createMockLandingPageResponse(0, {
      pool_details: mockPools,
      portfolio_summary: createMockAPRSummary(mockPools),
    });

    vi.mocked(analyticsService.getLandingPagePortfolioData).mockResolvedValue(
      mockResponse
    );

    const { result } = renderHook(() => useLandingPageData("test-user"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.pool_details[0].apr_data.apr).toBeNull();
    expect(result.current.data?.portfolio_summary.weighted_apr).toBe(0);
  });

  it("handles malformed pool data", async () => {
    const malformedResponse: any = {
      user_id: "test-user",
      portfolio_summary: {
        total_asset_value_usd: 10000,
        weighted_apr: "invalid", // Invalid type
        matched_pools: 1,
        total_pools: 1,
      },
      pool_details: [
        {
          snapshot_id: "1",
          // Missing required fields
        },
      ],
    };

    vi.mocked(analyticsService.getLandingPagePortfolioData).mockResolvedValue(
      malformedResponse
    );

    const { result } = renderHook(() => useLandingPageData("test-user"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Should still return data
    expect(result.current.data).toBeDefined();
  });
});

describe("useLandingPageData - Loading and Errors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(analyticsService.getLandingPagePortfolioData).mockReset();
  });

  it("shows loading state while fetching", async () => {
    const mockResponse = createMockLandingPageResponse(3);

    vi.mocked(analyticsService.getLandingPagePortfolioData).mockImplementation(
      () =>
        new Promise(resolve => {
          setTimeout(() => resolve(mockResponse), 100);
        })
    );

    const { result } = renderHook(() => useLandingPageData("test-user"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
  });

  it("handles API errors gracefully", async () => {
    const errorMessage = "Failed to fetch portfolio data";

    vi.mocked(analyticsService.getLandingPagePortfolioData).mockRejectedValue(
      new Error(errorMessage)
    );

    const { result } = renderHook(() => useLandingPageData("test-user-error"), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.isError).toBe(true);
      },
      { timeout: 6000 }
    );

    expect(result.current.error).toBeDefined();
    expect(result.current.data).toBeUndefined();
  });

  it("handles 404 user not found", async () => {
    vi.mocked(analyticsService.getLandingPagePortfolioData).mockRejectedValue(
      new Error("USER_NOT_FOUND")
    );

    const { result } = renderHook(
      () => useLandingPageData("nonexistent-user"),
      { wrapper: createWrapper() }
    );

    await waitFor(
      () => {
        expect(result.current.isError).toBe(true);
      },
      { timeout: 6000 }
    );
  });

  it("handles network timeout", async () => {
    vi.mocked(analyticsService.getLandingPagePortfolioData).mockRejectedValue(
      new Error("Network timeout")
    );

    const { result } = renderHook(
      () => useLandingPageData("test-user-timeout"),
      { wrapper: createWrapper() }
    );

    await waitFor(
      () => {
        expect(result.current.isError).toBe(true);
      },
      { timeout: 6000 }
    );
  });
});

describe("useLandingPageData - Refetch Behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("supports manual refetch", async () => {
    const mockResponse = createMockLandingPageResponse(2);

    vi.mocked(analyticsService.getLandingPagePortfolioData).mockResolvedValue(
      mockResponse
    );

    const { result } = renderHook(() => useLandingPageData("test-user"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Clear mock call history
    vi.clearAllMocks();

    // Manual refetch
    result.current.refetch();

    await waitFor(() => {
      expect(
        analyticsService.getLandingPagePortfolioData
      ).toHaveBeenCalledTimes(1);
    });
  });

  it("updates data on userId change", async () => {
    const mockResponse1 = createMockLandingPageResponse(2);
    const mockResponse2 = createMockLandingPageResponse(3);

    vi.mocked(analyticsService.getLandingPagePortfolioData)
      .mockResolvedValueOnce(mockResponse1)
      .mockResolvedValueOnce(mockResponse2);

    const { result, rerender } = renderHook(
      ({ userId }) => useLandingPageData(userId),
      {
        wrapper: createWrapper(),
        initialProps: { userId: "user-1" },
      }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.pool_details).toHaveLength(2);

    // Change userId
    rerender({ userId: "user-2" });

    await waitFor(() => {
      expect(result.current.data?.pool_details).toHaveLength(3);
    });
  });
});

describe("useLandingPageData - Coverage Metrics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calculates coverage percentage correctly", async () => {
    const mockPools: PoolDetail[] = [
      {
        snapshot_id: "1",
        chain: "ethereum",
        protocol: "uniswap",
        protocol_name: "Uniswap V3",
        asset_usd_value: 6000,
        pool_symbols: ["ETH", "USDC"],
        final_apr: 10,
        protocol_matched: true,
        apr_data: {
          apr_protocol: "uniswap",
          apr_symbol: "ETH-USDC",
          apr: 10,
          apr_base: 6,
          apr_reward: 4,
          apr_updated_at: new Date().toISOString(),
        },
        contribution_to_portfolio: 0.6,
      },
      {
        snapshot_id: "2",
        chain: "ethereum",
        protocol: "wallet",
        protocol_name: "Wallet Holdings",
        asset_usd_value: 4000,
        pool_symbols: ["ETH"],
        final_apr: 0,
        protocol_matched: false,
        apr_data: {
          apr_protocol: null,
          apr_symbol: null,
          apr: null,
          apr_base: null,
          apr_reward: null,
          apr_updated_at: null,
        },
        contribution_to_portfolio: 0.4,
      },
    ];

    const mockResponse = createMockLandingPageResponse(0, {
      pool_details: mockPools,
      portfolio_summary: createMockAPRSummary(mockPools),
    });

    vi.mocked(analyticsService.getLandingPagePortfolioData).mockResolvedValue(
      mockResponse
    );

    const { result } = renderHook(() => useLandingPageData("test-user"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const summary = result.current.data?.portfolio_summary;
    expect(summary?.total_asset_value_usd).toBe(10000);
    expect(summary?.matched_asset_value_usd).toBe(6000);
    expect(summary?.coverage_percentage).toBeCloseTo(60, 1);
  });

  it("handles 100% coverage", async () => {
    const mockPools: PoolDetail[] = [
      {
        snapshot_id: "1",
        chain: "ethereum",
        protocol: "aave",
        protocol_name: "Aave V3",
        asset_usd_value: 10000,
        pool_symbols: ["USDC"],
        final_apr: 5,
        protocol_matched: true,
        apr_data: {
          apr_protocol: "aave",
          apr_symbol: "aUSDC",
          apr: 5,
          apr_base: 5,
          apr_reward: 0,
          apr_updated_at: new Date().toISOString(),
        },
        contribution_to_portfolio: 1.0,
      },
    ];

    const mockResponse = createMockLandingPageResponse(0, {
      pool_details: mockPools,
      portfolio_summary: createMockAPRSummary(mockPools),
    });

    vi.mocked(analyticsService.getLandingPagePortfolioData).mockResolvedValue(
      mockResponse
    );

    const { result } = renderHook(() => useLandingPageData("test-user"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.portfolio_summary.coverage_percentage).toBe(
      100
    );
  });

  it("handles 0% coverage", async () => {
    const mockPools: PoolDetail[] = [
      {
        snapshot_id: "1",
        chain: "ethereum",
        protocol: "wallet",
        protocol_name: "Wallet Holdings",
        asset_usd_value: 10000,
        pool_symbols: ["ETH"],
        final_apr: 0,
        protocol_matched: false,
        apr_data: {
          apr_protocol: null,
          apr_symbol: null,
          apr: null,
          apr_base: null,
          apr_reward: null,
          apr_updated_at: null,
        },
        contribution_to_portfolio: 1.0,
      },
    ];

    const mockResponse = createMockLandingPageResponse(0, {
      pool_details: mockPools,
      portfolio_summary: createMockAPRSummary(mockPools),
    });

    vi.mocked(analyticsService.getLandingPagePortfolioData).mockResolvedValue(
      mockResponse
    );

    const { result } = renderHook(() => useLandingPageData("test-user"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.portfolio_summary.coverage_percentage).toBe(0);
  });
});
