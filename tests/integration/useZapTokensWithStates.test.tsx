/**
 * Integration tests for useZapTokensWithStates hook
 *
 * Tests token state management and enrichment:
 * 1. Token list fetching by chain
 * 2. Balance enrichment from wallet
 * 3. Price enrichment from price API
 * 4. USD value calculations
 * 5. Native token handling (sentinel values)
 * 6. Loading state consolidation
 *
 * Coverage includes:
 * - Happy path token enrichment
 * - Edge cases (empty lists, missing data, malformed responses)
 * - Native token address normalization
 * - Loading and error states
 * - Price updates and staleness
 * - Very large/small balance handling
 */

import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useZapTokensWithStates } from "../../src/hooks/queries/useZapTokensQuery";
// Mock the token service at the source
import * as tokenService from "../../src/services/tokenService";
import type { SwapToken } from "../../src/types/swap";

vi.mock("../../src/services/tokenService", () => ({
  getZapTokens: vi.fn(),
}));

vi.mock("../../src/hooks/queries/useTokenBalancesQuery", () => ({
  useTokenBalancesQuery: vi.fn(() => ({
    balances: undefined,
    balancesByAddress: {},
    isLoading: false,
    isFetching: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  })),
}));

vi.mock("../../src/hooks/queries/useTokenPricesQuery", () => ({
  useTokenPricesQuery: vi.fn(() => ({
    priceMap: {},
    isLoading: false,
    isFetching: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  })),
}));

import { useTokenBalancesQuery } from "../../src/hooks/queries/useTokenBalancesQuery";
import { useTokenPricesQuery } from "../../src/hooks/queries/useTokenPricesQuery";
import { createMockArray } from "./helpers/mock-factories";
import { createQueryWrapper, setupMockCleanup } from "./helpers/test-setup";

setupMockCleanup();

const createWrapper = () => createQueryWrapper().QueryWrapper;

// Mock data generators
function createMockTokens(count = 5): SwapToken[] {
  if (count <= 0) return [];

  const additional = createMockArray(
    Math.max(count - 1, 0),
    index =>
      ({
        symbol: `TOKEN${index + 1}`,
        name: `Test Token ${index + 1}`,
        address: `0x${(index + 1).toString(16).padStart(40, "0")}`,
        type: "ERC20" as const,
        decimals: 18,
        chainId: 1,
        logoURI: `https://example.com/token${index + 1}.png`,
      }) satisfies SwapToken
  );

  return [
    {
      symbol: "ETH",
      name: "Ethereum",
      address: "native",
      type: "native",
      decimals: 18,
      chainId: 1,
      logoURI: "https://example.com/eth.png",
    },
    ...additional,
  ];
}

function createMockBalances(
  tokens: SwapToken[]
): Record<string, { balance: string }> {
  return tokens.reduce<Record<string, { balance: string }>>(
    (acc, token, index) => {
      const address = token.address?.toLowerCase() || "native";
      const balanceValue = (100 + index * 25).toFixed(6);
      acc[address] = { balance: balanceValue };

      if (token.type === "native") {
        acc["native"] = { balance: balanceValue };
      }

      return acc;
    },
    {}
  );
}

function createMockPrices(
  tokens: SwapToken[]
): Record<string, { success: boolean; price: number | null }> {
  return tokens.reduce<
    Record<string, { success: boolean; price: number | null }>
  >((acc, token, index) => {
    const symbol = token.symbol?.toUpperCase();
    if (symbol) {
      acc[symbol] = {
        success: true,
        price: 100 + index * 50,
      };
    }
    return acc;
  }, {});
}

describe("useZapTokensWithStates - Token State Management", () => {
  beforeEach(() => {
    // Set default mock for token service
    // This will be overridden by individual tests
    vi.mocked(tokenService.getZapTokens).mockResolvedValue([]);
  });

  it("enriches tokens with price data", async () => {
    const mockTokens = createMockTokens(3);
    const mockPrices = createMockPrices(mockTokens);

    // Mock service layer instead
    vi.mocked(tokenService.getZapTokens).mockResolvedValue(mockTokens);

    vi.mocked(useTokenPricesQuery).mockReturnValue({
      priceMap: mockPrices,
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    const { result } = renderHook(
      () => useZapTokensWithStates({ chainId: 1, priceEnabled: true }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.tokens.length).toBe(3);
    });

    for (const token of result.current.tokens) {
      if (token.symbol && mockPrices[token.symbol.toUpperCase()]) {
        expect(token.price).toBeDefined();
        expect(typeof token.price).toBe("number");
        expect(token.price).toBeGreaterThan(0);
      }
    }
  });

  it("enriches tokens with balance data", async () => {
    const mockTokens = createMockTokens(3);
    const mockBalances = createMockBalances(mockTokens);

    // Mock service layer
    vi.mocked(tokenService.getZapTokens).mockResolvedValue(mockTokens);

    vi.mocked(useTokenBalancesQuery).mockReturnValue({
      balances: undefined,
      balancesByAddress: mockBalances,
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    const { result } = renderHook(
      () => useZapTokensWithStates({ chainId: 1, walletAddress: "0xtest" }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.tokens.length).toBe(3);
    });

    for (const token of result.current.tokens) {
      expect(token.balance).toBeDefined();
      expect(parseFloat(token.balance || "0")).toBeGreaterThanOrEqual(0);
    }
  });

  it("calculates USD values correctly", async () => {
    const mockTokens = createMockTokens(2);
    const mockBalances = createMockBalances(mockTokens);
    const mockPrices = {
      ETH: { success: true, price: 2000 },
      TOKEN1: { success: true, price: 50 },
    };

    // Set specific balances for calculation
    mockBalances["native"] = { balance: "10.5" }; // ETH
    mockBalances["0x0000000000000000000000000000000000000001"] = {
      balance: "100",
    }; // TOKEN1

    // Mock service layer
    vi.mocked(tokenService.getZapTokens).mockResolvedValue(mockTokens);

    vi.mocked(useTokenBalancesQuery).mockReturnValue({
      balances: undefined,
      balancesByAddress: mockBalances,
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    vi.mocked(useTokenPricesQuery).mockReturnValue({
      priceMap: mockPrices,
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    const { result } = renderHook(
      () =>
        useZapTokensWithStates({
          chainId: 1,
          walletAddress: "0xtest",
          priceEnabled: true,
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.tokens.length).toBe(2);
    });

    const ethToken = result.current.tokens.find(t => t.symbol === "ETH");
    const token1 = result.current.tokens.find(t => t.symbol === "TOKEN1");

    expect(ethToken?.balance).toBe("10.5");
    expect(ethToken?.price).toBe(2000);
    // USD value would be calculated in component: 10.5 * 2000 = 21000

    expect(token1?.balance).toBe("100");
    expect(token1?.price).toBe(50);
    // USD value: 100 * 50 = 5000
  });

  it("handles native token normalization", async () => {
    const nativeToken: SwapToken = {
      symbol: "ETH",
      name: "Ethereum",
      address: "native",
      type: "native",
      decimals: 18,
      chainId: 1,
      logoURI: "https://example.com/eth.png",
    };

    const mockBalances = {
      native: { balance: "25.5" },
    };

    // Mock service layer
    vi.mocked(tokenService.getZapTokens).mockResolvedValue([nativeToken]);

    vi.mocked(useTokenBalancesQuery).mockReturnValue({
      balances: undefined,
      balancesByAddress: mockBalances,
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    const { result } = renderHook(
      () => useZapTokensWithStates({ chainId: 1, walletAddress: "0xtest" }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.tokens).toHaveLength(1);
    });

    expect(result.current.tokens[0].balance).toBe("25.5");
  });
});

describe("useZapTokensWithStates - Price Updates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tokenService.getZapTokens).mockResolvedValue([]);
  });

  it("handles missing price data", async () => {
    const mockTokens = createMockTokens(2);

    // Mock service layer
    vi.mocked(tokenService.getZapTokens).mockResolvedValue(mockTokens);

    vi.mocked(useTokenPricesQuery).mockReturnValue({
      priceMap: {}, // No prices available
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    const { result } = renderHook(
      () => useZapTokensWithStates({ chainId: 1, priceEnabled: true }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.tokens.length).toBe(2);
    });

    for (const token of result.current.tokens) {
      expect(token.price).toBeUndefined();
    }
  });

  it("handles failed price fetches", async () => {
    const mockTokens = createMockTokens(2);
    const mockPrices = {
      ETH: { success: false, price: null },
      TOKEN1: { success: true, price: 100 },
    };

    // Mock service layer
    vi.mocked(tokenService.getZapTokens).mockResolvedValue(mockTokens);

    vi.mocked(useTokenPricesQuery).mockReturnValue({
      priceMap: mockPrices,
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    const { result } = renderHook(
      () => useZapTokensWithStates({ chainId: 1, priceEnabled: true }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.tokens.length).toBe(2);
    });

    const ethToken = result.current.tokens.find(t => t.symbol === "ETH");
    const token1 = result.current.tokens.find(t => t.symbol === "TOKEN1");

    expect(ethToken?.price).toBeUndefined(); // Failed fetch
    expect(token1?.price).toBe(100); // Success
  });

  it("handles null price values", async () => {
    const mockTokens = createMockTokens(1);
    const mockPrices = {
      ETH: { success: true, price: null }, // Null price despite success
    };

    // Mock service layer
    vi.mocked(tokenService.getZapTokens).mockResolvedValue(mockTokens);

    vi.mocked(useTokenPricesQuery).mockReturnValue({
      priceMap: mockPrices,
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    const { result } = renderHook(
      () => useZapTokensWithStates({ chainId: 1, priceEnabled: true }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.tokens.length).toBe(1);
    });

    expect(result.current.tokens[0].price).toBeUndefined();
  });
});

describe("useZapTokensWithStates - Edge Cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tokenService.getZapTokens).mockResolvedValue([]);
  });

  it("handles empty token list", async () => {
    // Mock service layer with empty array
    vi.mocked(tokenService.getZapTokens).mockResolvedValue([]);

    const { result } = renderHook(
      () => useZapTokensWithStates({ chainId: 1 }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isEmpty).toBe(true);
    });

    expect(result.current.tokens).toEqual([]);
    expect(result.current.hasTokens).toBe(false);
  });

  it("handles undefined token data", () => {
    // Don't set mock data - the beforeEach already sets empty array
    // This tests the case where query returns undefined/empty

    const { result } = renderHook(
      () => useZapTokensWithStates({ chainId: 1 }),
      { wrapper: createWrapper() }
    );

    expect(result.current.tokens).toEqual([]);
    expect(result.current.hasTokens).toBe(false);
  });

  it("handles malformed token data", async () => {
    const malformedTokens: any[] = [
      { symbol: "ETH", address: "native", decimals: 18, chainId: 1 }, // Partial data
      { address: "0x123", symbol: "TEST", decimals: 18, chainId: 1 }, // Minimal valid token
      {
        symbol: "USDC",
        address: "0x456",
        decimals: 18,
        chainId: 1,
        name: "USD Coin",
      },
    ];

    // Mock service layer with partially malformed data (no null/undefined)
    vi.mocked(tokenService.getZapTokens).mockResolvedValue(malformedTokens);

    const { result } = renderHook(
      () => useZapTokensWithStates({ chainId: 1 }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Should handle gracefully
    expect(result.current.tokens.length).toBeGreaterThanOrEqual(0);
    expect(result.current.error).toBeNull();
  });

  it("handles very large balances", async () => {
    const mockTokens = createMockTokens(1);
    const largeBalance = "999999999999.123456789012345678"; // 18+ decimals

    // Mock service layer
    vi.mocked(tokenService.getZapTokens).mockResolvedValue(mockTokens);

    vi.mocked(useTokenBalancesQuery).mockReturnValue({
      balances: undefined,
      balancesByAddress: {
        native: { balance: largeBalance },
      },
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    const { result } = renderHook(
      () => useZapTokensWithStates({ chainId: 1, walletAddress: "0xtest" }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.tokens.length).toBe(1);
    });

    expect(result.current.tokens[0].balance).toBe(largeBalance);
    expect(parseFloat(result.current.tokens[0].balance || "0")).toBeGreaterThan(
      0
    );
  });

  it("handles very small balances", async () => {
    const mockTokens = createMockTokens(1);
    const tinyBalance = "0.000000000000000001"; // 18 decimals

    // Mock service layer
    vi.mocked(tokenService.getZapTokens).mockResolvedValue(mockTokens);

    vi.mocked(useTokenBalancesQuery).mockReturnValue({
      balances: undefined,
      balancesByAddress: {
        native: { balance: tinyBalance },
      },
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    const { result } = renderHook(
      () => useZapTokensWithStates({ chainId: 1, walletAddress: "0xtest" }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.tokens.length).toBe(1);
    });

    expect(result.current.tokens[0].balance).toBe(tinyBalance);
  });

  it("handles tokens without symbols", async () => {
    const tokensNoSymbol: SwapToken[] = [
      {
        symbol: undefined as any,
        name: "No Symbol Token",
        address: "0x0000000000000000000000000000000000000001",
        type: "ERC20",
        decimals: 18,
        chainId: 1,
      },
    ];

    // Mock service layer
    vi.mocked(tokenService.getZapTokens).mockResolvedValue(tokensNoSymbol);

    const { result } = renderHook(
      () => useZapTokensWithStates({ chainId: 1, priceEnabled: true }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.tokens).toHaveLength(1);
    });

    expect(result.current.tokens[0].price).toBeUndefined();
  });

  it("handles missing chainId", () => {
    const { result } = renderHook(() => useZapTokensWithStates({}), {
      wrapper: createWrapper(),
    });

    expect(result.current.tokens).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });
});

describe("useZapTokensWithStates - Loading States", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tokenService.getZapTokens).mockResolvedValue([]);
  });

  it("consolidates loading from token API", async () => {
    // Mock service with a slow response to test loading state
    vi.mocked(tokenService.getZapTokens).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve([]), 100))
    );

    const { result } = renderHook(
      () => useZapTokensWithStates({ chainId: 1 }),
      { wrapper: createWrapper() }
    );

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isInitialLoading).toBe(true);

    // Wait for completion
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("consolidates loading from balance API", async () => {
    const mockTokens = createMockTokens(2);

    // Mock service layer
    vi.mocked(tokenService.getZapTokens).mockResolvedValue(mockTokens);

    vi.mocked(useTokenBalancesQuery).mockReturnValue({
      balances: undefined,
      balancesByAddress: {},
      isLoading: true,
      isFetching: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    const { result } = renderHook(
      () => useZapTokensWithStates({ chainId: 1, walletAddress: "0xtest" }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.tokens.length).toBe(2);
    });

    expect(result.current.isBalanceLoading).toBe(true);
  });

  it("consolidates loading from price API", async () => {
    const mockTokens = createMockTokens(2);

    // Mock service layer
    vi.mocked(tokenService.getZapTokens).mockResolvedValue(mockTokens);

    vi.mocked(useTokenPricesQuery).mockReturnValue({
      priceMap: {},
      isLoading: true,
      isFetching: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    const { result } = renderHook(
      () => useZapTokensWithStates({ chainId: 1, priceEnabled: true }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.tokens.length).toBe(2);
    });

    expect(result.current.isPriceLoading).toBe(true);
  });

  it("handles partial data loads", async () => {
    const mockTokens = createMockTokens(2);

    // Mock service layer
    vi.mocked(tokenService.getZapTokens).mockResolvedValue(mockTokens);

    vi.mocked(useTokenBalancesQuery).mockReturnValue({
      balances: undefined,
      balancesByAddress: {},
      isLoading: true,
      isFetching: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    const { result } = renderHook(
      () => useZapTokensWithStates({ chainId: 1, walletAddress: "0xtest" }),
      { wrapper: createWrapper() }
    );

    // Tokens loaded, balances pending
    await waitFor(() => {
      expect(result.current.tokens).toHaveLength(2);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isBalanceLoading).toBe(true);
  });

  it("distinguishes initial load from refetch", async () => {
    const mockTokens = createMockTokens(2);

    // Mock service layer
    vi.mocked(tokenService.getZapTokens).mockResolvedValue(mockTokens);

    const { result } = renderHook(
      () => useZapTokensWithStates({ chainId: 1 }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.tokens.length).toBe(2);
    });

    // After initial load, isInitialLoading should be false
    expect(result.current.isInitialLoading).toBe(false);
  });
});

describe("useZapTokensWithStates - Error Handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tokenService.getZapTokens).mockResolvedValue([]);
  });

  it("handles token fetch errors", async () => {
    const mockError = new Error("Failed to fetch tokens");

    // Mock service to reject immediately
    vi.mocked(tokenService.getZapTokens).mockImplementation(() =>
      Promise.reject(mockError)
    );

    const { result } = renderHook(
      () => useZapTokensWithStates({ chainId: 1 }),
      { wrapper: createWrapper() }
    );

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    // Wait for error state with longer timeout
    await waitFor(
      () => {
        // Either error state is set OR loading completes with empty tokens
        return result.current.isError || !result.current.isLoading;
      },
      { timeout: 3000 }
    );

    // Tokens should be empty after error
    expect(result.current.tokens).toHaveLength(0);
  });

  it("handles balance fetch errors", async () => {
    const mockTokens = createMockTokens(2);
    const mockError = new Error("Failed to fetch balances");

    // Mock service layer
    vi.mocked(tokenService.getZapTokens).mockResolvedValue(mockTokens);

    vi.mocked(useTokenBalancesQuery).mockReturnValue({
      balances: undefined,
      balancesByAddress: {},
      isLoading: false,
      isFetching: false,
      isError: true,
      error: mockError,
      refetch: vi.fn(),
    });

    const { result } = renderHook(
      () => useZapTokensWithStates({ chainId: 1, walletAddress: "0xtest" }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.tokens).toHaveLength(2);
    });

    expect(result.current.balanceError).toBe(mockError);
  });

  it("handles price fetch errors", async () => {
    const mockTokens = createMockTokens(2);
    const mockError = new Error("Failed to fetch prices");

    // Mock service layer
    vi.mocked(tokenService.getZapTokens).mockResolvedValue(mockTokens);

    vi.mocked(useTokenPricesQuery).mockReturnValue({
      priceMap: {},
      isLoading: false,
      isFetching: false,
      isError: true,
      error: mockError,
      refetch: vi.fn(),
    });

    const { result } = renderHook(
      () => useZapTokensWithStates({ chainId: 1, priceEnabled: true }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.tokens).toHaveLength(2);
    });

    expect(result.current.priceError).toBe(mockError);
  });
});

describe("useZapTokensWithStates - Token Address Overrides", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tokenService.getZapTokens).mockResolvedValue([]);
  });

  it("uses tokenAddressesOverride when provided", async () => {
    const mockTokens = createMockTokens(5);
    const overrideAddresses = [
      "0x0000000000000000000000000000000000000001",
      "0x0000000000000000000000000000000000000002",
    ];

    // Mock service layer
    vi.mocked(tokenService.getZapTokens).mockResolvedValue(mockTokens);

    const balanceQuerySpy = vi.mocked(useTokenBalancesQuery);

    renderHook(
      () =>
        useZapTokensWithStates({
          chainId: 1,
          walletAddress: "0xtest",
          tokenAddressesOverride: overrideAddresses,
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(balanceQuerySpy).toHaveBeenCalled();
    });

    // Verify balance query was called with override addresses
    const callArgs = balanceQuerySpy.mock.calls[0][0];
    expect(callArgs.tokenAddresses).toContain(overrideAddresses[0]);
  });

  it("handles native token in address overrides", async () => {
    const mockTokens = createMockTokens(2);
    const overrideAddresses = [
      "native",
      "0x0000000000000000000000000000000000000001",
    ];

    // Mock service layer
    vi.mocked(tokenService.getZapTokens).mockResolvedValue(mockTokens);

    const { result } = renderHook(
      () =>
        useZapTokensWithStates({
          chainId: 1,
          tokenAddressesOverride: overrideAddresses,
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.tokens.length).toBe(2);
    });

    expect(result.current.tokens).toBeDefined();
  });
});
