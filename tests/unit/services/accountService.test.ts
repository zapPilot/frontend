import { beforeEach, describe, expect, it, vi } from "vitest";

import { httpUtils } from "@/lib/http";
import * as accountService from "@/services/accountService";
import type {
  AddWalletResponse,
  ConnectWalletResponse,
  UpdateEmailResponse,
  UserProfileResponse,
} from "@/types/domain/user.types";

// Mock HTTP utilities
vi.mock("@/lib/http", () => ({
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

  describe("Error handling edge cases", () => {
    it("should transform 400 'wallet' error to friendly message", async () => {
      vi.mocked(httpUtils.accountApi.post).mockRejectedValue({
        status: 400,
        message: "Invalid wallet parameter",
      });

      await expect(accountService.connectWallet("invalid")).rejects.toThrow(
        "Invalid wallet address format. Must be a 42-character Ethereum address."
      );
    });

    it("should transform 409 'wallet' error", async () => {
      vi.mocked(httpUtils.accountApi.post).mockRejectedValue({
        status: 409,
        // Lowercase 'wallet' to hit the branch
        message: "This wallet is taken",
      });

      await expect(
        accountService.addWalletToBundle("u1", "w1")
      ).rejects.toThrow("This wallet is already associated with an account.");
    });

    it("should transform 409 'email' error", async () => {
      vi.mocked(httpUtils.accountApi.put).mockRejectedValue({
        status: 409,
        message: "email exists",
      });

      await expect(accountService.updateUserEmail("u1", "e1")).rejects.toThrow(
        "This email address is already in use."
      );
    });

    it("should preserve 409 'belongs to another user' message", async () => {
      const msg =
        "wallet already belongs to another user, please delete one of the accounts instead";
      vi.mocked(httpUtils.accountApi.post).mockRejectedValue({
        status: 409,
        message: msg,
      });

      await expect(
        accountService.addWalletToBundle("u1", "w1")
      ).rejects.toThrow(msg);
    });

    it("should transform 422 error", async () => {
      vi.mocked(httpUtils.accountApi.post).mockRejectedValue({
        status: 422,
        message: "Whatever",
      });

      await expect(accountService.connectWallet("0x123")).rejects.toThrow(
        "Invalid request data. Please check your input and try again."
      );
    });

    it("should handle non-object/string errors", async () => {
      vi.mocked(httpUtils.accountApi.post).mockRejectedValue(
        "Just a string error"
      );

      try {
        await accountService.connectWallet("0x123");
        expect.fail("Should have thrown");
      } catch (e: any) {
        expect(e.message).toBe("Account service error");
        expect(e.status).toBe(500);
      }
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
