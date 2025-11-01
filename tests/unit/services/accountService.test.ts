import { describe, it, expect, vi, beforeEach } from "vitest";
import { httpUtils } from "@/lib/http-utils";
import * as accountService from "@/services/accountService";
import type {
  ConnectWalletResponse,
  UserProfileResponse,
  AddWalletResponse,
  UpdateEmailResponse,
} from "@/types/user.types";

// Mock HTTP utilities
vi.mock("@/lib/http-utils", () => ({
  httpUtils: {
    accountApi: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    },
    backendApi: {
      get: vi.fn(),
    },
  },
}));

describe("accountService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("connectWallet", () => {
    it("should connect wallet successfully", async () => {
      const mockResponse: ConnectWalletResponse = {
        user_id: "user123",
        is_new_user: false,
      };

      vi.mocked(httpUtils.accountApi.post).mockResolvedValue(mockResponse);

      const result = await accountService.connectWallet(
        "0x1234567890123456789012345678901234567890"
      );

      expect(result).toEqual(mockResponse);
      expect(httpUtils.accountApi.post).toHaveBeenCalledWith(
        "/users/connect-wallet",
        {
          wallet: "0x1234567890123456789012345678901234567890",
        }
      );
    });

    it("should handle new user creation", async () => {
      const mockResponse: ConnectWalletResponse = {
        user_id: "user456",
        is_new_user: true,
      };

      vi.mocked(httpUtils.accountApi.post).mockResolvedValue(mockResponse);

      const result = await accountService.connectWallet(
        "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
      );

      expect(result.is_new_user).toBe(true);
      expect(result.user_id).toBe("user456");
    });

    it("should handle invalid wallet address format (400)", async () => {
      const mockError = {
        status: 400,
        message: "Invalid wallet address",
      };

      vi.mocked(httpUtils.accountApi.post).mockRejectedValue(mockError);

      await expect(
        accountService.connectWallet("invalid-address")
      ).rejects.toThrow();
    });

    it("should handle network errors", async () => {
      vi.mocked(httpUtils.accountApi.post).mockRejectedValue(
        new Error("Network error")
      );

      await expect(
        accountService.connectWallet(
          "0x1234567890123456789012345678901234567890"
        )
      ).rejects.toThrow();
    });
  });

  describe("getUserProfile", () => {
    it("should fetch user profile successfully", async () => {
      const mockProfile: UserProfileResponse = {
        user: {
          id: "user123",
          email: "test@example.com",
          is_active: true,
          is_subscribed_to_reports: true,
          created_at: "2024-01-01T00:00:00Z",
        },
        wallets: [
          {
            id: "wallet1",
            user_id: "user123",
            wallet: "0x1234567890123456789012345678901234567890",
            label: "Main Wallet",
            created_at: "2024-01-01T00:00:00Z",
          },
        ],
      };

      vi.mocked(httpUtils.accountApi.get).mockResolvedValue(mockProfile);

      const result = await accountService.getUserProfile("user123");

      expect(result).toEqual(mockProfile);
      expect(httpUtils.accountApi.get).toHaveBeenCalledWith("/users/user123");
    });

    it("should handle user not found (404)", async () => {
      const mockError = {
        status: 404,
        message: "User not found",
      };

      vi.mocked(httpUtils.accountApi.get).mockRejectedValue(mockError);

      await expect(
        accountService.getUserProfile("nonexistent")
      ).rejects.toThrow();
    });

    it("should fetch profile with subscription data", async () => {
      const mockProfile: UserProfileResponse = {
        user: {
          id: "user123",
          email: "test@example.com",
          is_active: true,
          is_subscribed_to_reports: true,
          created_at: "2024-01-01T00:00:00Z",
        },
        wallets: [],
        subscription: {
          id: "sub123",
          user_id: "user123",
          plan_code: "PRO",
          starts_at: "2024-01-01T00:00:00Z",
          is_canceled: false,
          created_at: "2024-01-01T00:00:00Z",
        },
      };

      vi.mocked(httpUtils.accountApi.get).mockResolvedValue(mockProfile);

      const result = await accountService.getUserProfile("user123");

      expect(result.subscription).toBeDefined();
      expect(result.subscription?.plan_code).toBe("PRO");
    });
  });

  describe("updateUserEmail", () => {
    it("should update email successfully", async () => {
      const mockResponse: UpdateEmailResponse = {
        success: true,
        message: "Email updated successfully",
      };

      vi.mocked(httpUtils.accountApi.put).mockResolvedValue(mockResponse);

      const result = await accountService.updateUserEmail(
        "user123",
        "newemail@example.com"
      );

      expect(result).toEqual(mockResponse);
      expect(httpUtils.accountApi.put).toHaveBeenCalledWith(
        "/users/user123/email",
        {
          email: "newemail@example.com",
        }
      );
    });

    it("should handle duplicate email (409)", async () => {
      const mockError = {
        status: 409,
        message: "Email already in use",
      };

      vi.mocked(httpUtils.accountApi.put).mockRejectedValue(mockError);

      await expect(
        accountService.updateUserEmail("user123", "existing@example.com")
      ).rejects.toThrow();
    });

    it("should handle invalid email format (422)", async () => {
      const mockError = {
        status: 422,
        message: "Invalid email format",
      };

      vi.mocked(httpUtils.accountApi.put).mockRejectedValue(mockError);

      await expect(
        accountService.updateUserEmail("user123", "invalid-email")
      ).rejects.toThrow();
    });
  });

  describe("removeUserEmail", () => {
    it("should remove email successfully", async () => {
      const mockResponse: UpdateEmailResponse = {
        success: true,
        message: "Email removed successfully",
      };

      vi.mocked(httpUtils.accountApi.delete).mockResolvedValue(mockResponse);

      const result = await accountService.removeUserEmail("user123");

      expect(result).toEqual(mockResponse);
      expect(httpUtils.accountApi.delete).toHaveBeenCalledWith(
        "/users/user123/email"
      );
    });

    it("should handle user not found (404)", async () => {
      const mockError = {
        status: 404,
        message: "User not found",
      };

      vi.mocked(httpUtils.accountApi.delete).mockRejectedValue(mockError);

      await expect(
        accountService.removeUserEmail("nonexistent")
      ).rejects.toThrow();
    });
  });

  describe("deleteUser", () => {
    it("should delete user successfully", async () => {
      const mockResponse: UpdateEmailResponse = {
        success: true,
        message: "User deleted successfully",
      };

      vi.mocked(httpUtils.accountApi.delete).mockResolvedValue(mockResponse);

      const result = await accountService.deleteUser("user123");

      expect(result).toEqual(mockResponse);
      expect(httpUtils.accountApi.delete).toHaveBeenCalledWith(
        "/users/user123"
      );
    });

    it("should handle user not found (404)", async () => {
      const mockError = {
        status: 404,
        message: "User not found",
      };

      vi.mocked(httpUtils.accountApi.delete).mockRejectedValue(mockError);

      await expect(accountService.deleteUser("nonexistent")).rejects.toThrow();
    });
  });

  describe("getUserWallets", () => {
    it("should fetch user wallets successfully", async () => {
      const mockWallets = [
        {
          id: "wallet1",
          user_id: "user123",
          wallet: "0x1234567890123456789012345678901234567890",
          label: "Main Wallet",
          created_at: "2024-01-01T00:00:00Z",
        },
        {
          id: "wallet2",
          user_id: "user123",
          wallet: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
          created_at: "2024-01-02T00:00:00Z",
        },
      ];

      vi.mocked(httpUtils.accountApi.get).mockResolvedValue(mockWallets);

      const result = await accountService.getUserWallets("user123");

      expect(result).toEqual(mockWallets);
      expect(result).toHaveLength(2);
      expect(httpUtils.accountApi.get).toHaveBeenCalledWith(
        "/users/user123/wallets"
      );
    });

    it("should handle empty wallet list", async () => {
      vi.mocked(httpUtils.accountApi.get).mockResolvedValue([]);

      const result = await accountService.getUserWallets("user123");

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe("addWalletToBundle", () => {
    it("should add wallet without label", async () => {
      const mockResponse: AddWalletResponse = {
        wallet_id: "wallet123",
        message: "Wallet added successfully",
      };

      vi.mocked(httpUtils.accountApi.post).mockResolvedValue(mockResponse);

      const result = await accountService.addWalletToBundle(
        "user123",
        "0x1234567890123456789012345678901234567890"
      );

      expect(result).toEqual(mockResponse);
      expect(httpUtils.accountApi.post).toHaveBeenCalledWith(
        "/users/user123/wallets",
        {
          wallet: "0x1234567890123456789012345678901234567890",
          label: undefined,
        }
      );
    });

    it("should add wallet with custom label", async () => {
      const mockResponse: AddWalletResponse = {
        wallet_id: "wallet456",
        message: "Wallet added successfully",
      };

      vi.mocked(httpUtils.accountApi.post).mockResolvedValue(mockResponse);

      const result = await accountService.addWalletToBundle(
        "user123",
        "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
        "Trading Wallet"
      );

      expect(result).toEqual(mockResponse);
      expect(httpUtils.accountApi.post).toHaveBeenCalledWith(
        "/users/user123/wallets",
        {
          wallet: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
          label: "Trading Wallet",
        }
      );
    });

    it("should handle duplicate wallet (409)", async () => {
      const mockError = {
        status: 409,
        message: "Wallet already associated",
      };

      vi.mocked(httpUtils.accountApi.post).mockRejectedValue(mockError);

      await expect(
        accountService.addWalletToBundle(
          "user123",
          "0x1234567890123456789012345678901234567890"
        )
      ).rejects.toThrow();
    });

    it("should handle wallet belongs to another user (409)", async () => {
      const mockError = {
        status: 409,
        message:
          "Wallet already belongs to another user, please delete one of the accounts instead",
      };

      vi.mocked(httpUtils.accountApi.post).mockRejectedValue(mockError);

      await expect(
        accountService.addWalletToBundle(
          "user123",
          "0x1234567890123456789012345678901234567890"
        )
      ).rejects.toThrow();
    });

    it("should handle invalid wallet format (400)", async () => {
      const mockError = {
        status: 400,
        message: "Invalid wallet address",
      };

      vi.mocked(httpUtils.accountApi.post).mockRejectedValue(mockError);

      await expect(
        accountService.addWalletToBundle("user123", "invalid-address")
      ).rejects.toThrow();
    });
  });

  describe("removeWalletFromBundle", () => {
    it("should remove wallet successfully", async () => {
      const mockResponse = {
        message: "Wallet removed successfully",
      };

      vi.mocked(httpUtils.accountApi.delete).mockResolvedValue(mockResponse);

      const result = await accountService.removeWalletFromBundle(
        "user123",
        "wallet456"
      );

      expect(result).toEqual(mockResponse);
      expect(httpUtils.accountApi.delete).toHaveBeenCalledWith(
        "/users/user123/wallets/wallet456"
      );
    });

    it("should handle wallet not found (404)", async () => {
      const mockError = {
        status: 404,
        message: "Wallet not found",
      };

      vi.mocked(httpUtils.accountApi.delete).mockRejectedValue(mockError);

      await expect(
        accountService.removeWalletFromBundle("user123", "nonexistent")
      ).rejects.toThrow();
    });
  });

  describe("updateWalletLabel", () => {
    it("should update wallet label successfully", async () => {
      const mockResponse = {
        message: "Label updated successfully",
      };

      vi.mocked(httpUtils.accountApi.put).mockResolvedValue(mockResponse);

      const result = await accountService.updateWalletLabel(
        "user123",
        "0x1234567890123456789012345678901234567890",
        "New Label"
      );

      expect(result).toEqual(mockResponse);
      expect(httpUtils.accountApi.put).toHaveBeenCalledWith(
        "/users/user123/wallets/0x1234567890123456789012345678901234567890/label",
        {
          label: "New Label",
        }
      );
    });

    it("should handle empty label", async () => {
      const mockResponse = {
        message: "Label updated successfully",
      };

      vi.mocked(httpUtils.accountApi.put).mockResolvedValue(mockResponse);

      const result = await accountService.updateWalletLabel(
        "user123",
        "0x1234567890123456789012345678901234567890",
        ""
      );

      expect(result).toEqual(mockResponse);
      expect(httpUtils.accountApi.put).toHaveBeenCalledWith(
        "/users/user123/wallets/0x1234567890123456789012345678901234567890/label",
        {
          label: "",
        }
      );
    });

    it("should handle wallet not found (404)", async () => {
      const mockError = {
        status: 404,
        message: "Wallet not found",
      };

      vi.mocked(httpUtils.accountApi.put).mockRejectedValue(mockError);

      await expect(
        accountService.updateWalletLabel("user123", "nonexistent", "Label")
      ).rejects.toThrow();
    });
  });

  describe("checkAccountServiceHealth", () => {
    it("should return healthy status", async () => {
      const mockResponse = {
        status: "healthy",
        timestamp: "2024-01-01T00:00:00Z",
      };

      vi.mocked(httpUtils.accountApi.get).mockResolvedValue(mockResponse);

      const result = await accountService.checkAccountServiceHealth();

      expect(result).toEqual(mockResponse);
      expect(result.status).toBe("healthy");
      expect(httpUtils.accountApi.get).toHaveBeenCalledWith("/health");
    });

    it("should handle service unavailable", async () => {
      vi.mocked(httpUtils.accountApi.get).mockRejectedValue(
        new Error("Service unavailable")
      );

      await expect(
        accountService.checkAccountServiceHealth()
      ).rejects.toThrow();
    });
  });

  describe("getUserTokens", () => {
    it("should fetch tokens for valid chain", async () => {
      const mockTokens = [
        {
          id: "token1",
          chain: "eth",
          name: "Ethereum",
          symbol: "ETH",
          display_symbol: "ETH",
          optimized_symbol: "ETH",
          decimals: 18,
          logo_url: "https://example.com/eth.png",
          protocol_id: "eth",
          price: 2000,
          is_verified: true,
          is_core: true,
          is_wallet: true,
          time_at: 1704067200,
          amount: 1.5,
        },
      ];

      vi.mocked(httpUtils.backendApi.get).mockResolvedValue(mockTokens);

      const result = await accountService.getUserTokens(
        "0x1234567890123456789012345678901234567890",
        "eth"
      );

      expect(result).toEqual(mockTokens);
      expect(httpUtils.backendApi.get).toHaveBeenCalledWith(
        "/user/0x1234567890123456789012345678901234567890/eth/tokens"
      );
    });

    it("should handle empty token list", async () => {
      vi.mocked(httpUtils.backendApi.get).mockResolvedValue([]);

      const result = await accountService.getUserTokens(
        "0x1234567890123456789012345678901234567890",
        "polygon"
      );

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it("should handle invalid chain", async () => {
      const mockError = {
        status: 400,
        message: "Invalid chain",
      };

      vi.mocked(httpUtils.backendApi.get).mockRejectedValue(mockError);

      await expect(
        accountService.getUserTokens(
          "0x1234567890123456789012345678901234567890",
          "invalid-chain"
        )
      ).rejects.toThrow();
    });

    it("should handle network error", async () => {
      vi.mocked(httpUtils.backendApi.get).mockRejectedValue(
        new Error("Network error")
      );

      await expect(
        accountService.getUserTokens(
          "0x1234567890123456789012345678901234567890",
          "eth"
        )
      ).rejects.toThrow();
    });
  });

  describe("AccountServiceError", () => {
    it("should create error with correct properties", () => {
      const error = new accountService.AccountServiceError(
        "Test error",
        400,
        "TEST_ERROR",
        { field: "wallet" }
      );

      expect(error.message).toBe("Test error");
      expect(error.status).toBe(400);
      expect(error.code).toBe("TEST_ERROR");
      expect(error.details).toEqual({ field: "wallet" });
      expect(error.name).toBe("AccountServiceError");
    });
  });
});
