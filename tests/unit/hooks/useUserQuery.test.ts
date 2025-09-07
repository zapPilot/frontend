import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "../../test-utils";

// Mock account and user services used by the hook
vi.mock("../../../src/services/accountService", () => ({
  connectWallet: vi.fn(),
}));

vi.mock("../../../src/services/userService", () => ({
  getUserProfile: vi.fn(),
  getUserWallets: vi.fn(), // ensure not called by the hook
}));

import { useUserByWallet } from "../../../src/hooks/queries/useUserQuery";
import {
  ConnectWalletResponse,
  UserCryptoWallet,
  UserProfileResponse,
} from "../../../src/types/user.types";
import { connectWallet as connectWalletService } from "../../../src/services/accountService";
import {
  getUserProfile as getUserProfileService,
  getUserWallets as getUserWalletsService,
} from "../../../src/services/userService";

const mockConnectWallet = vi.mocked(connectWalletService);
const mockGetUserProfile = vi.mocked(getUserProfileService);
const mockGetUserWallets = vi.mocked(getUserWalletsService);

describe("useUserByWallet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("connects wallet, fetches profile once, and derives user info from profile wallets", async () => {
    const walletAddress = "0x1234567890123456789012345678901234567890";
    const mockConnect: ConnectWalletResponse = {
      user_id: "user-123",
      is_new_user: false,
    };
    const profileWallets: UserCryptoWallet[] = [
      {
        id: "w1",
        user_id: "user-123",
        wallet: walletAddress,
        is_main: true,
        label: "Primary Wallet",
        created_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "w2",
        user_id: "user-123",
        wallet: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
        is_main: false,
        label: "Trading Wallet",
        created_at: "2024-01-02T00:00:00Z",
      },
    ];
    const mockProfile: UserProfileResponse = {
      user: {
        id: "user-123",
        email: "test@example.com",
        is_active: true,
        created_at: "",
      },
      wallets: profileWallets,
    };

    mockConnectWallet.mockResolvedValue(mockConnect);
    mockGetUserProfile.mockResolvedValue({ success: true, data: mockProfile });

    const { result } = renderHook(() => useUserByWallet(walletAddress));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Only connect + profile are called
    expect(mockConnectWallet).toHaveBeenCalledWith(walletAddress);
    expect(mockGetUserProfile).toHaveBeenCalledWith("user-123");
    expect(mockGetUserWallets).not.toHaveBeenCalled();

    // Derived user info
    expect(result.current.data).toEqual(
      expect.objectContaining({
        userId: "user-123",
        email: "test@example.com",
        primaryWallet: walletAddress,
        bundleWallets: [
          walletAddress,
          "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
        ],
        totalWallets: 2,
        totalVisibleWallets: 2,
      })
    );

    // Additional wallets derived from non-main entries
    expect(result.current.data?.additionalWallets).toEqual([
      expect.objectContaining({
        wallet_address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
        label: "Trading Wallet",
        is_main: false,
      }),
    ]);
  });

  it("falls back gracefully when profile fetch fails (no duplicate wallet call)", async () => {
    const walletAddress = "0x9999999999999999999999999999999999999999";
    mockConnectWallet.mockResolvedValue({
      user_id: "user-xyz",
      is_new_user: false,
    });
    mockGetUserProfile.mockRejectedValue(new Error("profile failed"));

    const { result } = renderHook(() => useUserByWallet(walletAddress));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockConnectWallet).toHaveBeenCalledWith(walletAddress);
    expect(mockGetUserProfile).toHaveBeenCalledWith("user-xyz");
    expect(mockGetUserWallets).not.toHaveBeenCalled();

    expect(result.current.data).toEqual(
      expect.objectContaining({
        userId: "user-xyz",
        email: "",
        primaryWallet: walletAddress,
        bundleWallets: [walletAddress],
        totalWallets: 1,
        totalVisibleWallets: 1,
      })
    );
    expect(result.current.data?.additionalWallets).toEqual([]);
  });
});
