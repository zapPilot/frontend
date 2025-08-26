import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../src/lib/api-client", () => ({
  handleAPIError: vi.fn(),
}));

vi.mock("../../../src/lib/clients", () => ({
  accountApiClient: {
    connectWallet: vi.fn(),
    getUserProfile: vi.fn(),
    getUserWallets: vi.fn(),
    addWalletToBundle: vi.fn(),
    removeWalletFromBundle: vi.fn(),
    updateUserEmail: vi.fn(),
  },
  AccountApiError: class MockAccountApiError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "AccountApiError";
    }
  },
}));

// Import types and functions after mocking
import type {
  ConnectWalletResponse,
  UserProfileResponse,
  UserCryptoWallet,
  AddWalletResponse,
  UpdateEmailResponse,
} from "../../../src/types/user.types";

import {
  connectWallet,
  getUserProfile,
  getUserWallets,
  addWalletToBundle,
  removeWalletFromBundle,
  updateUserEmail,
  validateWalletAddress,
  transformWalletData,
  getMainWallet,
  handleWalletError,
} from "../../../src/services/userService";

// Import the api-client module to get the mocked function
import { handleAPIError } from "../../../src/lib/api-client";
import { AccountApiError, accountApiClient } from "../../../src/lib/clients";
const mockHandleAPIError = vi.mocked(handleAPIError);
const mockAccountApiClient = vi.mocked(accountApiClient);

// API Error for testing
class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = "APIError";
  }
}

describe("userService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHandleAPIError.mockReturnValue("Mock API error");
  });

  describe("connectWallet", () => {
    const mockResponse: ConnectWalletResponse = {
      user_id: "user-123",
      is_new_user: false,
    };

    it("successfully connects wallet for existing user", async () => {
      mockAccountApiClient.connectWallet.mockResolvedValue(mockResponse);

      const result = await connectWallet(
        "0x1234567890123456789012345678901234567890"
      );

      expect(result).toEqual({
        data: mockResponse,
        success: true,
      });
      expect(mockAccountApiClient.connectWallet).toHaveBeenCalledWith(
        "0x1234567890123456789012345678901234567890"
      );
    });

    it("successfully connects wallet for new user", async () => {
      const newUserResponse: ConnectWalletResponse = {
        user_id: "user-456",
        is_new_user: true,
      };
      mockAccountApiClient.connectWallet.mockResolvedValue(newUserResponse);

      const result = await connectWallet(
        "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
      );

      expect(result).toEqual({
        data: newUserResponse,
        success: true,
      });
      expect(mockAccountApiClient.connectWallet).toHaveBeenCalledWith(
        "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
      );
    });

    it("handles API errors correctly", async () => {
      const apiError = new AccountApiError("User not found");
      mockAccountApiClient.connectWallet.mockRejectedValue(apiError);

      const result = await connectWallet(
        "0x1234567890123456789012345678901234567890"
      );

      expect(result).toEqual({
        error: "User not found",
        success: false,
      });
    });

    it("handles network errors correctly", async () => {
      const networkError = new Error("Network connection failed");
      mockAccountApiClient.connectWallet.mockRejectedValue(networkError);
      mockHandleAPIError.mockReturnValue("Network connection failed");

      const result = await connectWallet(
        "0x1234567890123456789012345678901234567890"
      );

      expect(result).toEqual({
        error: "Network connection failed",
        success: false,
      });
    });
  });

  describe("getUserProfile", () => {
    const mockUserProfile: UserProfileResponse = {
      user: {
        id: "user-123",
        email: "test@example.com",
        is_active: true,
        created_at: "2024-01-01T00:00:00Z",
      },
      wallets: [
        {
          id: "wallet-1",
          user_id: "user-123",
          wallet: "0x1234567890123456789012345678901234567890",
          is_main: true,
          label: "Primary Wallet",
          is_visible: true,
          created_at: "2024-01-01T00:00:00Z",
        },
      ],
      subscription: {
        id: "sub-1",
        user_id: "user-123",
        plan_code: "premium",
        starts_at: "2024-01-01T00:00:00Z",
        is_canceled: false,
        created_at: "2024-01-01T00:00:00Z",
      },
    };

    it("successfully retrieves user profile", async () => {
      mockAccountApiClient.getUserProfile.mockResolvedValue(mockUserProfile);

      const result = await getUserProfile("user-123");

      expect(result).toEqual({
        data: mockUserProfile,
        success: true,
      });
      expect(mockAccountApiClient.getUserProfile).toHaveBeenCalledWith(
        "user-123"
      );
    });

    it("handles missing user error", async () => {
      const apiError = new AccountApiError("User not found");
      mockAccountApiClient.getUserProfile.mockRejectedValue(apiError);

      const result = await getUserProfile("nonexistent-user");

      expect(result).toEqual({
        error: "User not found",
        success: false,
      });
    });
  });

  describe("getUserWallets", () => {
    const mockWallets: UserCryptoWallet[] = [
      {
        id: "wallet-1",
        user_id: "user-123",
        wallet: "0x1234567890123456789012345678901234567890",
        is_main: true,
        label: "Primary Wallet",
        is_visible: true,
        created_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "wallet-2",
        user_id: "user-123",
        wallet: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
        is_main: false,
        label: "Trading Wallet",
        is_visible: true,
        created_at: "2024-01-02T00:00:00Z",
      },
    ];

    it("successfully retrieves user wallets", async () => {
      mockAccountApiClient.getUserWallets.mockResolvedValue(mockWallets);

      const result = await getUserWallets("user-123");

      expect(result).toEqual({
        data: mockWallets,
        success: true,
      });
      expect(mockAccountApiClient.getUserWallets).toHaveBeenCalledWith(
        "user-123"
      );
    });

    it("handles empty wallet list", async () => {
      mockAccountApiClient.getUserWallets.mockResolvedValue([]);

      const result = await getUserWallets("user-123");

      expect(result).toEqual({
        data: [],
        success: true,
      });
    });
  });

  describe("addWalletToBundle", () => {
    const mockAddResponse: AddWalletResponse = {
      wallet_id: "wallet-new",
      message: "Wallet added successfully",
    };

    it("successfully adds wallet with label", async () => {
      mockAccountApiClient.addWalletToBundle.mockResolvedValue(mockAddResponse);

      const result = await addWalletToBundle(
        "user-123",
        "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
        "Trading Wallet"
      );

      expect(result).toEqual({
        data: mockAddResponse,
        success: true,
      });
      expect(mockAccountApiClient.addWalletToBundle).toHaveBeenCalledWith(
        "user-123",
        "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
        "Trading Wallet"
      );
    });

    it("successfully adds wallet without label", async () => {
      mockAccountApiClient.addWalletToBundle.mockResolvedValue(mockAddResponse);

      const result = await addWalletToBundle(
        "user-123",
        "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
      );

      expect(result).toEqual({
        data: mockAddResponse,
        success: true,
      });
      expect(mockAccountApiClient.addWalletToBundle).toHaveBeenCalledWith(
        "user-123",
        "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
        undefined
      );
    });

    it("handles duplicate wallet error", async () => {
      const duplicateError = new AccountApiError(
        "Wallet already exists in bundle"
      );
      mockAccountApiClient.addWalletToBundle.mockRejectedValue(duplicateError);

      const result = await addWalletToBundle(
        "user-123",
        "0x1234567890123456789012345678901234567890"
      );

      expect(result).toEqual({
        error: "Wallet already exists in bundle",
        success: false,
      });
    });
  });

  describe("removeWalletFromBundle", () => {
    const mockRemoveResponse = { message: "Wallet removed successfully" };

    it("successfully removes wallet", async () => {
      mockAccountApiClient.removeWalletFromBundle.mockResolvedValue(
        mockRemoveResponse
      );

      const result = await removeWalletFromBundle("user-123", "wallet-2");

      expect(result).toEqual({
        data: mockRemoveResponse,
        success: true,
      });
      expect(mockAccountApiClient.removeWalletFromBundle).toHaveBeenCalledWith(
        "user-123",
        "wallet-2"
      );
    });

    it("handles attempt to remove main wallet", async () => {
      const mainWalletError = new AccountApiError("Cannot remove main wallet");
      mockAccountApiClient.removeWalletFromBundle.mockRejectedValue(
        mainWalletError
      );

      const result = await removeWalletFromBundle("user-123", "wallet-1");

      expect(result).toEqual({
        error: "Cannot remove main wallet",
        success: false,
      });
    });
  });

  describe("updateUserEmail", () => {
    const mockEmailResponse: UpdateEmailResponse = {
      success: true,
      message: "Email updated successfully",
    };

    it("successfully updates email", async () => {
      mockAccountApiClient.updateUserEmail.mockResolvedValue(mockEmailResponse);

      const result = await updateUserEmail("user-123", "newemail@example.com");

      expect(result).toEqual({
        data: mockEmailResponse,
        success: true,
      });
      expect(mockAccountApiClient.updateUserEmail).toHaveBeenCalledWith(
        "user-123",
        "newemail@example.com"
      );
    });

    it("handles duplicate email error", async () => {
      const duplicateEmailError = new AccountApiError("Email already in use");
      mockAccountApiClient.updateUserEmail.mockRejectedValue(
        duplicateEmailError
      );

      const result = await updateUserEmail("user-123", "existing@example.com");

      expect(result).toEqual({
        error: "Email already in use",
        success: false,
      });
    });
  });

  describe("validateWalletAddress", () => {
    it("validates correct Ethereum addresses", () => {
      expect(
        validateWalletAddress("0x1234567890123456789012345678901234567890")
      ).toBe(true);
      expect(
        validateWalletAddress("0xABCDEFabcdef1234567890123456789012345678")
      ).toBe(true);
      expect(
        validateWalletAddress("0x0000000000000000000000000000000000000000")
      ).toBe(true);
      expect(
        validateWalletAddress("0xffffffffffffffffffffffffffffffffffffffff")
      ).toBe(true);
    });

    it("rejects invalid addresses", () => {
      expect(validateWalletAddress("")).toBe(false);
      expect(validateWalletAddress("0x")).toBe(false);
      expect(
        validateWalletAddress("1234567890123456789012345678901234567890")
      ).toBe(false); // Missing 0x
      expect(
        validateWalletAddress("0x12345678901234567890123456789012345678")
      ).toBe(false); // Too short
      expect(
        validateWalletAddress("0x123456789012345678901234567890123456789012")
      ).toBe(false); // Too long
      expect(
        validateWalletAddress("0x123456789012345678901234567890123456789g")
      ).toBe(false); // Invalid hex
      expect(
        validateWalletAddress("0X1234567890123456789012345678901234567890")
      ).toBe(false); // Wrong case prefix
    });

    it("handles null and undefined inputs", () => {
      expect(validateWalletAddress(null as any)).toBe(false);
      expect(validateWalletAddress(undefined as any)).toBe(false);
    });
  });

  describe("transformWalletData", () => {
    const mockWallets: UserCryptoWallet[] = [
      {
        id: "wallet-1",
        user_id: "user-123",
        wallet: "0x1234567890123456789012345678901234567890",
        is_main: true,
        label: "My Main Wallet",
        is_visible: true,
        created_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "wallet-2",
        user_id: "user-123",
        wallet: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
        is_main: false,
        is_visible: true,
        created_at: "2024-01-02T00:00:00Z",
      },
    ];

    it("transforms wallet data correctly", () => {
      const result = transformWalletData(mockWallets);

      expect(result).toEqual([
        {
          id: "wallet-1",
          address: "0x1234567890123456789012345678901234567890",
          label: "My Main Wallet",
          isMain: true,
          isActive: true,
          isVisible: true,
          createdAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "wallet-2",
          address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
          label: "Additional Wallet",
          isMain: false,
          isActive: false,
          isVisible: true,
          createdAt: "2024-01-02T00:00:00Z",
        },
      ]);
    });

    it("handles empty wallet list", () => {
      const result = transformWalletData([]);
      expect(result).toEqual([]);
    });
  });

  describe("getMainWallet", () => {
    it("returns main wallet when present", () => {
      const wallets: UserCryptoWallet[] = [
        {
          id: "wallet-1",
          user_id: "user-123",
          wallet: "0x1234567890123456789012345678901234567890",
          is_main: false,
          is_visible: true,
          created_at: "2024-01-01T00:00:00Z",
        },
        {
          id: "wallet-2",
          user_id: "user-123",
          wallet: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
          is_main: true,
          label: "Main Wallet",
          is_visible: true,
          created_at: "2024-01-02T00:00:00Z",
        },
      ];

      const result = getMainWallet(wallets);
      expect(result).toEqual(wallets[1]);
    });

    it("returns null when no main wallet present", () => {
      const wallets: UserCryptoWallet[] = [
        {
          id: "wallet-1",
          user_id: "user-123",
          wallet: "0x1234567890123456789012345678901234567890",
          is_main: false,
          is_visible: true,
          created_at: "2024-01-01T00:00:00Z",
        },
      ];

      const result = getMainWallet(wallets);
      expect(result).toBeNull();
    });

    it("returns null for empty wallet list", () => {
      const result = getMainWallet([]);
      expect(result).toBeNull();
    });
  });

  describe("handleWalletError", () => {
    it("handles AccountApiError by returning message directly", () => {
      const accountError = new AccountApiError("Invalid wallet address");
      const result = handleWalletError(accountError);
      expect(result).toBe("Invalid wallet address");
    });

    it("falls back to generic error handling for non-AccountApiError", () => {
      const genericError = new Error("Network connection failed");
      mockHandleAPIError.mockReturnValue("Network connection failed");

      const result = handleWalletError(genericError);
      expect(result).toBe("Network connection failed");
      expect(mockHandleAPIError).toHaveBeenCalledWith(genericError);
    });

    it("handles unknown error types", () => {
      mockHandleAPIError.mockReturnValue("Unknown error occurred");

      const result = handleWalletError("string error");
      expect(result).toBe("Unknown error occurred");
      expect(mockHandleAPIError).toHaveBeenCalledWith("string error");
    });
  });
});
