import { useActiveAccount } from "thirdweb/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  useCurrentUser,
  useUserByWallet,
} from "../../../../src/hooks/queries/useUserQuery";
import {
  connectWallet as connectWalletService,
  getUserProfile as getUserProfileService,
} from "../../../../src/services/accountService";
import { renderHook, waitFor } from "../../../test-utils";

// Mock query defaults to disable retries
vi.mock("../../../../src/hooks/queries/queryDefaults", async () => {
  const actual = await vi.importActual(
    "../../../../src/hooks/queries/queryDefaults"
  );
  return {
    ...(actual as any),
    createQueryConfig: () => ({
      retry: false,
      staleTime: 0,
      gcTime: 0,
    }),
  };
});

// Mock dependencies
vi.mock("../../../../src/services/accountService", () => ({
  connectWallet: vi.fn(),
  getUserProfile: vi.fn(),
}));

vi.mock("thirdweb/react", () => ({
  useActiveAccount: vi.fn(),
}));

describe("useUserQuery", () => {
  const mockConnectWallet = vi.mocked(connectWalletService);
  const mockGetUserProfile = vi.mocked(getUserProfileService);
  const mockUseActiveAccount = vi.mocked(useActiveAccount);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useUserByWallet", () => {
    const walletAddress = "0x123";
    const userId = "user-123";

    it("should return successfully with full profile data", async () => {
      mockConnectWallet.mockResolvedValue({
        user_id: userId,
        is_new_user: false,
      });
      mockGetUserProfile.mockResolvedValue({
        user: {
          id: userId,
          email: "test@example.com",
          is_active: true,
          created_at: "",
        },
        wallets: [
          {
            id: "w1",
            user_id: userId,
            wallet: walletAddress,
            label: "Main",
            created_at: "",
          },
        ],
      });

      const { result } = renderHook(() => useUserByWallet(walletAddress));

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toMatchObject({
        userId,
        email: "test@example.com",
        bundleWallets: [walletAddress],
        totalWallets: 1,
      });
    });

    it("should handle missing wallet address (not enabled)", async () => {
      const { result } = renderHook(() => useUserByWallet(null));
      expect(result.current.isLoading).toBe(false); // Should be idle/disabled
      expect(result.current.data).toBeUndefined();
    });

    it("should handle empty email in profile", async () => {
      mockConnectWallet.mockResolvedValue({
        user_id: userId,
        is_new_user: false,
      });
      mockGetUserProfile.mockResolvedValue({
        user: { id: userId, email: "", is_active: true, created_at: "" }, // Empty email
        wallets: [],
      });

      const { result } = renderHook(() => useUserByWallet(walletAddress));

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.email).toBe("");
    });

    it("should handle profile with no wallets (fallback to connected wallet)", async () => {
      mockConnectWallet.mockResolvedValue({
        user_id: userId,
        is_new_user: false,
      });
      mockGetUserProfile.mockResolvedValue({
        user: {
          id: userId,
          email: "test@example.com",
          is_active: true,
          created_at: "",
        },
        wallets: [], // Empty wallets
      });

      const { result } = renderHook(() => useUserByWallet(walletAddress));

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.bundleWallets).toEqual([walletAddress]);
      expect(result.current.data?.totalWallets).toBe(1);
    });
  });

  describe("Error handling", () => {
    it("should handle connectWallet failure", async () => {
      const walletAddress = "0x123";
      mockConnectWallet.mockRejectedValue(new Error("Connection failed"));

      const { result } = renderHook(() => useUserByWallet(walletAddress));

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toBeDefined();
    });

    it("should expose error messages", async () => {
      mockUseActiveAccount.mockReturnValue({ address: "0xBad" } as any);
      mockConnectWallet.mockRejectedValue(new Error("Auth failed"));

      const { result } = renderHook(() => useCurrentUser());

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toBe("Auth failed");
    });
  });

  describe("useCurrentUser", () => {
    it("should return null userInfo when not connected", () => {
      mockUseActiveAccount.mockReturnValue(undefined); // Not connected

      const { result } = renderHook(() => useCurrentUser());

      expect(result.current.isConnected).toBe(false);
      expect(result.current.connectedWallet).toBeNull();
      expect(result.current.userInfo).toBeNull();
    });

    it("should return userInfo when connected", async () => {
      const walletAddress = "0x456";
      mockUseActiveAccount.mockReturnValue({ address: walletAddress } as any);

      mockConnectWallet.mockResolvedValue({
        user_id: "u1",
        is_new_user: false,
      });
      mockGetUserProfile.mockResolvedValue({
        user: { id: "u1", email: "", is_active: true, created_at: "" },
        wallets: [],
      });

      const { result } = renderHook(() => useCurrentUser());

      expect(result.current.isConnected).toBe(true);
      expect(result.current.connectedWallet).toBe(walletAddress);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.userInfo).toBeDefined();
    });
  });
});
