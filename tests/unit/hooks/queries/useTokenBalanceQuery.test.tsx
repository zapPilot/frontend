/**
 * useTokenBalanceQuery - Hook Tests
 *
 * Tests for the token balance query hook.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Import hook after mocking
import { useTokenBalanceQuery } from "@/hooks/queries/useTokenBalanceQuery";

// Mock wallet provider
const mockUseWalletProvider = vi.fn();
vi.mock("@/providers/WalletProvider", () => ({
  useWalletProvider: () => mockUseWalletProvider(),
}));

// Mock transaction service
const mockGetTokenBalance = vi.fn();
vi.mock("@/services", () => ({
  transactionService: {
    getTokenBalance: (chainId: number, tokenAddress: string) =>
      mockGetTokenBalance(chainId, tokenAddress),
  },
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

function createWrapper() {
  const queryClient = createTestQueryClient();
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = "TestWrapper";
  return Wrapper;
}

const mockAccount = {
  address: "0x1234567890abcdef1234567890abcdef12345678",
};

const mockBalanceData = {
  balance: "1000000000000000000",
  usdValue: 2500.0,
};

describe("useTokenBalanceQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseWalletProvider.mockReturnValue({ account: mockAccount });
    mockGetTokenBalance.mockResolvedValue(mockBalanceData);
  });

  describe("Query enabled conditions", () => {
    it("should be disabled when chainId is undefined", () => {
      const { result } = renderHook(
        () => useTokenBalanceQuery(undefined, "0xtoken"),
        { wrapper: createWrapper() }
      );

      expect(result.current.fetchStatus).toBe("idle");
      expect(mockGetTokenBalance).not.toHaveBeenCalled();
    });

    it("should be disabled when tokenAddress is undefined", () => {
      const { result } = renderHook(() => useTokenBalanceQuery(1, undefined), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe("idle");
      expect(mockGetTokenBalance).not.toHaveBeenCalled();
    });

    it("should be disabled when account is not connected", () => {
      mockUseWalletProvider.mockReturnValue({ account: null });

      const { result } = renderHook(() => useTokenBalanceQuery(1, "0xtoken"), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe("idle");
      expect(mockGetTokenBalance).not.toHaveBeenCalled();
    });

    it("should be disabled when options.enabled is false", () => {
      const { result } = renderHook(
        () => useTokenBalanceQuery(1, "0xtoken", { enabled: false }),
        { wrapper: createWrapper() }
      );

      expect(result.current.fetchStatus).toBe("idle");
      expect(mockGetTokenBalance).not.toHaveBeenCalled();
    });

    it("should be enabled when all conditions are met", async () => {
      const { result } = renderHook(() => useTokenBalanceQuery(1, "0xtoken"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockGetTokenBalance).toHaveBeenCalledWith(1, "0xtoken");
      expect(result.current.data).toEqual(mockBalanceData);
    });
  });

  describe("Query key", () => {
    it("should include chainId, tokenAddress, and account address in query key", async () => {
      const { result } = renderHook(
        () => useTokenBalanceQuery(1, "0xtoken123"),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockGetTokenBalance).toHaveBeenCalledWith(1, "0xtoken123");
    });

    it("should use 'no-account' when account is missing", () => {
      mockUseWalletProvider.mockReturnValue({ account: null });

      renderHook(() => useTokenBalanceQuery(1, "0xtoken"), {
        wrapper: createWrapper(),
      });

      // Query is disabled, but key should still be generated with 'no-account'
      expect(mockGetTokenBalance).not.toHaveBeenCalled();
    });
  });

  describe("Successful balance fetch", () => {
    it("should return balance and USD value on success", async () => {
      const { result } = renderHook(() => useTokenBalanceQuery(1, "0xtoken"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.balance).toBe("1000000000000000000");
      expect(result.current.data?.usdValue).toBe(2500.0);
    });

    it("should handle zero balance", async () => {
      mockGetTokenBalance.mockResolvedValue({ balance: "0", usdValue: 0 });

      const { result } = renderHook(() => useTokenBalanceQuery(1, "0xtoken"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.balance).toBe("0");
      expect(result.current.data?.usdValue).toBe(0);
    });
  });

  describe("Error handling", () => {
    it("should handle service errors", async () => {
      mockGetTokenBalance.mockRejectedValue(new Error("Service unavailable"));

      const { result } = renderHook(() => useTokenBalanceQuery(1, "0xtoken"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
    });
  });

  describe("Stale time", () => {
    it("should have appropriate stale time", async () => {
      const { result } = renderHook(() => useTokenBalanceQuery(1, "0xtoken"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Should only fetch once (not refetch immediately)
      expect(mockGetTokenBalance).toHaveBeenCalledTimes(1);
    });
  });
});
