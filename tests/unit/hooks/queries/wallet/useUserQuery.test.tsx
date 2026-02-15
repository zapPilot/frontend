/**
 * Unit tests for useUserQuery hooks
 *
 * Tests:
 * - useUserByWallet: Fetches user data by wallet address
 * - useCurrentUser: Combines wallet connection + user query
 * - useUserById: Fetches user data by userId (visitor mode)
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  useCurrentUser,
  useUserById,
  useUserByWallet,
} from "@/hooks/queries/wallet/useUserQuery";

// Mock thirdweb/react
const mockActiveAccount = vi.fn();
vi.mock("thirdweb/react", () => ({
  useActiveAccount: () => mockActiveAccount(),
}));

// Mock account service
const mockConnectWallet = vi.fn();
const mockGetUserProfile = vi.fn();
vi.mock("@/services/accountService", () => ({
  connectWallet: (...args: unknown[]) => mockConnectWallet(...args),
  getUserProfile: (...args: unknown[]) => mockGetUserProfile(...args),
}));

// Create test query wrapper
function createTestQueryWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  const TestQueryWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  TestQueryWrapper.displayName = "TestQueryWrapper";
  return TestQueryWrapper;
}

const mockUserProfile = {
  user: {
    id: "user-123",
    email: "test@example.com",
  },
  wallets: [
    {
      wallet: "0x123abc",
      label: "Main Wallet",
      created_at: "2024-01-01T00:00:00Z",
    },
    {
      wallet: "0x456def",
      label: "Trading Wallet",
      created_at: "2024-01-02T00:00:00Z",
    },
  ],
};

describe("useUserQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockActiveAccount.mockReturnValue(null);
    mockConnectWallet.mockResolvedValue({ user_id: "user-123" });
    mockGetUserProfile.mockResolvedValue(mockUserProfile);
  });

  describe("useUserByWallet", () => {
    it("should not fetch when wallet address is null", () => {
      const { result } = renderHook(() => useUserByWallet(null), {
        wrapper: createTestQueryWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(mockConnectWallet).not.toHaveBeenCalled();
    });

    it("should fetch user data when wallet address is provided", async () => {
      const { result } = renderHook(() => useUserByWallet("0x123abc"), {
        wrapper: createTestQueryWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockConnectWallet).toHaveBeenCalledWith("0x123abc");
      expect(mockGetUserProfile).toHaveBeenCalledWith("user-123");
      expect(result.current.data).toEqual({
        userId: "user-123",
        email: "test@example.com",
        bundleWallets: ["0x123abc", "0x456def"],
        additionalWallets: [
          {
            wallet_address: "0x123abc",
            label: "Main Wallet",
            created_at: "2024-01-01T00:00:00Z",
          },
          {
            wallet_address: "0x456def",
            label: "Trading Wallet",
            created_at: "2024-01-02T00:00:00Z",
          },
        ],
        visibleWallets: ["0x123abc", "0x456def"],
        totalWallets: 2,
        totalVisibleWallets: 2,
      });
    });

    it("should handle empty wallets array", async () => {
      mockGetUserProfile.mockResolvedValue({
        user: { id: "user-123", email: "" },
        wallets: [],
      });

      const { result } = renderHook(() => useUserByWallet("0x123abc"), {
        wrapper: createTestQueryWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Falls back to provided wallet address
      expect(result.current.data?.bundleWallets).toEqual(["0x123abc"]);
    });

    it("should call connectWallet when wallet address provided even if it fails", async () => {
      mockConnectWallet.mockRejectedValue(new Error("Connection failed"));

      renderHook(() => useUserByWallet("0x123abc"), {
        wrapper: createTestQueryWrapper(),
      });

      // Verify the service was called
      await waitFor(() => {
        expect(mockConnectWallet).toHaveBeenCalledWith("0x123abc");
      });
    });
  });

  describe("useCurrentUser", () => {
    it("should return isConnected false when no wallet connected", () => {
      mockActiveAccount.mockReturnValue(null);

      const { result } = renderHook(() => useCurrentUser(), {
        wrapper: createTestQueryWrapper(),
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.connectedWallet).toBeNull();
      expect(result.current.userInfo).toBeNull();
    });

    it("should fetch user data when wallet is connected", async () => {
      mockActiveAccount.mockReturnValue({ address: "0x123abc" });

      const { result } = renderHook(() => useCurrentUser(), {
        wrapper: createTestQueryWrapper(),
      });

      await waitFor(() => {
        expect(result.current.userInfo).not.toBeNull();
      });

      expect(result.current.isConnected).toBe(true);
      expect(result.current.connectedWallet).toBe("0x123abc");
      expect(result.current.userInfo?.userId).toBe("user-123");
    });
  });

  describe("useUserById", () => {
    it("should not fetch when userId is null", () => {
      const { result } = renderHook(() => useUserById(null), {
        wrapper: createTestQueryWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(mockGetUserProfile).not.toHaveBeenCalled();
    });

    it("should fetch user data by userId", async () => {
      const { result } = renderHook(() => useUserById("bundle-owner-123"), {
        wrapper: createTestQueryWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockGetUserProfile).toHaveBeenCalledWith("bundle-owner-123");
      expect(result.current.data).toEqual({
        userId: "bundle-owner-123",
        email: "test@example.com",
        bundleWallets: ["0x123abc", "0x456def"],
        additionalWallets: [
          {
            wallet_address: "0x123abc",
            label: "Main Wallet",
            created_at: "2024-01-01T00:00:00Z",
          },
          {
            wallet_address: "0x456def",
            label: "Trading Wallet",
            created_at: "2024-01-02T00:00:00Z",
          },
        ],
        visibleWallets: ["0x123abc", "0x456def"],
        totalWallets: 2,
        totalVisibleWallets: 2,
      });
    });

    it("should handle empty wallets for userId fetch", async () => {
      mockGetUserProfile.mockResolvedValue({
        user: { id: "user-123", email: "test@example.com" },
        wallets: [],
      });

      const { result } = renderHook(() => useUserById("bundle-owner-123"), {
        wrapper: createTestQueryWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Returns empty arrays (no fallback for userId-based fetch)
      expect(result.current.data?.bundleWallets).toEqual([]);
    });

    it("should handle API errors for userId fetch", async () => {
      mockGetUserProfile.mockRejectedValue(new Error("USER_NOT_FOUND"));

      const { result } = renderHook(() => useUserById("invalid-id"), {
        wrapper: createTestQueryWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe("USER_NOT_FOUND");
    });

    it("should handle null label in wallets", async () => {
      mockGetUserProfile.mockResolvedValue({
        user: { id: "user-123", email: "" },
        wallets: [
          { wallet: "0x789", label: null, created_at: "2024-01-01T00:00:00Z" },
        ],
      });

      const { result } = renderHook(() => useUserById("user-123"), {
        wrapper: createTestQueryWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.additionalWallets[0]?.label).toBeNull();
    });
  });
});
