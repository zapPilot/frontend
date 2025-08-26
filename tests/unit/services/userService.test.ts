import { beforeEach, describe, expect, it, vi } from "vitest";
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
import { APIError, handleAPIError } from "../../../src/lib/api-client";
import {
  ConnectWalletResponse,
  UserProfileResponse,
  UserCryptoWallet,
  AddWalletResponse,
  UpdateEmailResponse,
} from "../../../src/types/user.types";

// Mock the API client
const mockAccountApi = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
};

const mockHandleAPIError = vi.fn();

vi.mock("../../../src/lib/api-client", () => ({
  createApiClient: {
    accountApi: mockAccountApi,
  },
  APIError: class APIError extends Error {
    constructor(
      message: string,
      public status: number,
      public code?: string,
      public details?: any
    ) {
      super(message);
      this.name = "APIError";
    }
  },
  handleAPIError: mockHandleAPIError,
}));

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
      mockAccountApi.get.mockResolvedValue(mockResponse);

      const result = await connectWallet(
        "0x1234567890123456789012345678901234567890"
      );

      expect(result).toEqual({
        data: mockResponse,
        success: true,
      });
      expect(mockAccountApi.get).toHaveBeenCalledWith(
        "/users/connect-wallet?wallet=0x1234567890123456789012345678901234567890"
      );
    });

    it("successfully connects wallet for new user", async () => {
      const newUserResponse: ConnectWalletResponse = {
        user_id: "user-456",
        is_new_user: true,
      };
      mockAccountApi.get.mockResolvedValue(newUserResponse);

      const result = await connectWallet(
        "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
      );

      expect(result).toEqual({
        data: newUserResponse,
        success: true,
      });
      expect(mockAccountApi.get).toHaveBeenCalledWith(
        "/users/connect-wallet?wallet=0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
      );
    });

    it("properly encodes special characters in wallet address", async () => {
      mockAccountApi.get.mockResolvedValue(mockResponse);

      await connectWallet("0x1234+567890%123456789012345678901234567890");

      expect(mockAccountApi.get).toHaveBeenCalledWith(
        "/users/connect-wallet?wallet=0x1234%2B567890%25123456789012345678901234567890"
      );
    });

    it("handles API errors correctly", async () => {
      const apiError = new APIError("User not found", 404, "USER_NOT_FOUND");
      mockAccountApi.get.mockRejectedValue(apiError);
      mockHandleAPIError.mockReturnValue("User not found");

      const result = await connectWallet(
        "0x1234567890123456789012345678901234567890"
      );

      expect(result).toEqual({
        error: "User not found",
        success: false,
      });
      expect(mockHandleAPIError).toHaveBeenCalledWith(apiError);
    });

    it("handles network errors correctly", async () => {
      const networkError = new Error("Network connection failed");
      mockAccountApi.get.mockRejectedValue(networkError);
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
      mockAccountApi.get.mockResolvedValue(mockUserProfile);

      const result = await getUserProfile("user-123");

      expect(result).toEqual({
        data: mockUserProfile,
        success: true,
      });
      expect(mockAccountApi.get).toHaveBeenCalledWith("/users/user-123");
    });

    it("handles missing user error", async () => {
      const apiError = new APIError("User not found", 404);
      mockAccountApi.get.mockRejectedValue(apiError);
      mockHandleAPIError.mockReturnValue("User not found");

      const result = await getUserProfile("nonexistent-user");

      expect(result).toEqual({
        error: "User not found",
        success: false,
      });
    });

    it("handles server errors", async () => {
      const serverError = new APIError("Internal server error", 500);
      mockAccountApi.get.mockRejectedValue(serverError);
      mockHandleAPIError.mockReturnValue("Internal server error");

      const result = await getUserProfile("user-123");

      expect(result).toEqual({
        error: "Internal server error",
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
      mockAccountApi.get.mockResolvedValue(mockWallets);

      const result = await getUserWallets("user-123");

      expect(result).toEqual({
        data: mockWallets,
        success: true,
      });
      expect(mockAccountApi.get).toHaveBeenCalledWith(
        "/users/user-123/wallets"
      );
    });

    it("handles empty wallet list", async () => {
      mockAccountApi.get.mockResolvedValue([]);

      const result = await getUserWallets("user-123");

      expect(result).toEqual({
        data: [],
        success: true,
      });
    });

    it("handles unauthorized access", async () => {
      const unauthorizedError = new APIError("Unauthorized", 401);
      mockAccountApi.get.mockRejectedValue(unauthorizedError);
      mockHandleAPIError.mockReturnValue("Unauthorized access");

      const result = await getUserWallets("user-123");

      expect(result).toEqual({
        error: "Unauthorized access",
        success: false,
      });
    });
  });

  describe("addWalletToBundle", () => {
    const mockAddResponse: AddWalletResponse = {
      wallet_id: "wallet-new",
      message: "Wallet added successfully",
    };

    it("successfully adds wallet with label", async () => {
      mockAccountApi.post.mockResolvedValue(mockAddResponse);

      const result = await addWalletToBundle(
        "user-123",
        "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
        "Trading Wallet"
      );

      expect(result).toEqual({
        data: mockAddResponse,
        success: true,
      });
      expect(mockAccountApi.post).toHaveBeenCalledWith(
        "/users/user-123/wallets",
        {
          wallet: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
          label: "Trading Wallet",
        }
      );
    });

    it("successfully adds wallet without label", async () => {
      mockAccountApi.post.mockResolvedValue(mockAddResponse);

      const result = await addWalletToBundle(
        "user-123",
        "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
      );

      expect(result).toEqual({
        data: mockAddResponse,
        success: true,
      });
      expect(mockAccountApi.post).toHaveBeenCalledWith(
        "/users/user-123/wallets",
        {
          wallet: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
          label: undefined,
        }
      );
    });

    it("handles duplicate wallet error", async () => {
      const duplicateError = new APIError(
        "Wallet already exists in bundle",
        409,
        "DUPLICATE_WALLET"
      );
      mockAccountApi.post.mockRejectedValue(duplicateError);
      mockHandleAPIError.mockReturnValue("Wallet already exists in bundle");

      const result = await addWalletToBundle(
        "user-123",
        "0x1234567890123456789012345678901234567890"
      );

      expect(result).toEqual({
        error: "Wallet already exists in bundle",
        success: false,
      });
    });

    it("handles invalid wallet address error", async () => {
      const invalidAddressError = new APIError(
        "Invalid wallet address format",
        400,
        "INVALID_ADDRESS"
      );
      mockAccountApi.post.mockRejectedValue(invalidAddressError);
      mockHandleAPIError.mockReturnValue("Invalid wallet address format");

      const result = await addWalletToBundle("user-123", "invalid-address");

      expect(result).toEqual({
        error: "Invalid wallet address format",
        success: false,
      });
    });
  });

  describe("removeWalletFromBundle", () => {
    const mockRemoveResponse = { message: "Wallet removed successfully" };

    it("successfully removes wallet", async () => {
      mockAccountApi.delete.mockResolvedValue(mockRemoveResponse);

      const result = await removeWalletFromBundle("user-123", "wallet-2");

      expect(result).toEqual({
        data: mockRemoveResponse,
        success: true,
      });
      expect(mockAccountApi.delete).toHaveBeenCalledWith(
        "/users/user-123/wallets/wallet-2"
      );
    });

    it("handles attempt to remove main wallet", async () => {
      const mainWalletError = new APIError(
        "Cannot remove main wallet",
        400,
        "MAIN_WALLET_REMOVAL"
      );
      mockAccountApi.delete.mockRejectedValue(mainWalletError);
      mockHandleAPIError.mockReturnValue("Cannot remove main wallet");

      const result = await removeWalletFromBundle("user-123", "wallet-1");

      expect(result).toEqual({
        error: "Cannot remove main wallet",
        success: false,
      });
    });

    it("handles wallet not found error", async () => {
      const notFoundError = new APIError("Wallet not found", 404);
      mockAccountApi.delete.mockRejectedValue(notFoundError);
      mockHandleAPIError.mockReturnValue("Wallet not found");

      const result = await removeWalletFromBundle(
        "user-123",
        "nonexistent-wallet"
      );

      expect(result).toEqual({
        error: "Wallet not found",
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
      mockAccountApi.put.mockResolvedValue(mockEmailResponse);

      const result = await updateUserEmail("user-123", "newemail@example.com");

      expect(result).toEqual({
        data: mockEmailResponse,
        success: true,
      });
      expect(mockAccountApi.put).toHaveBeenCalledWith("/users/user-123/email", {
        email: "newemail@example.com",
      });
    });

    it("handles duplicate email error", async () => {
      const duplicateEmailError = new APIError(
        "Email already in use",
        409,
        "DUPLICATE_EMAIL"
      );
      mockAccountApi.put.mockRejectedValue(duplicateEmailError);
      mockHandleAPIError.mockReturnValue("Email already in use");

      const result = await updateUserEmail("user-123", "existing@example.com");

      expect(result).toEqual({
        error: "Email already in use",
        success: false,
      });
    });

    it("handles invalid email format error", async () => {
      const invalidEmailError = new APIError(
        "Invalid email format",
        400,
        "INVALID_EMAIL"
      );
      mockAccountApi.put.mockRejectedValue(invalidEmailError);
      mockHandleAPIError.mockReturnValue("Invalid email format");

      const result = await updateUserEmail("user-123", "invalid-email");

      expect(result).toEqual({
        error: "Invalid email format",
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
      {
        id: "wallet-3",
        user_id: "user-123",
        wallet: "0x9876543210987654321098765432109876543210",
        is_main: false,
        label: "Trading Wallet",
        is_visible: false,
        created_at: "2024-01-03T00:00:00Z",
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
        {
          id: "wallet-3",
          address: "0x9876543210987654321098765432109876543210",
          label: "Trading Wallet",
          isMain: false,
          isActive: false,
          isVisible: false,
          createdAt: "2024-01-03T00:00:00Z",
        },
      ]);
    });

    it("handles main wallet without label", () => {
      const walletWithoutLabel: UserCryptoWallet[] = [
        {
          id: "wallet-1",
          user_id: "user-123",
          wallet: "0x1234567890123456789012345678901234567890",
          is_main: true,
          is_visible: true,
          created_at: "2024-01-01T00:00:00Z",
        },
      ];

      const result = transformWalletData(walletWithoutLabel);

      expect(result[0].label).toBe("Primary Wallet");
      expect(result[0].isMain).toBe(true);
      expect(result[0].isActive).toBe(true);
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

    it("returns first main wallet when multiple marked as main", () => {
      const wallets: UserCryptoWallet[] = [
        {
          id: "wallet-1",
          user_id: "user-123",
          wallet: "0x1234567890123456789012345678901234567890",
          is_main: true,
          is_visible: true,
          created_at: "2024-01-01T00:00:00Z",
        },
        {
          id: "wallet-2",
          user_id: "user-123",
          wallet: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
          is_main: true,
          is_visible: true,
          created_at: "2024-01-02T00:00:00Z",
        },
      ];

      const result = getMainWallet(wallets);
      expect(result).toEqual(wallets[0]);
    });
  });

  describe("handleWalletError", () => {
    it("handles specific wallet validation errors", () => {
      const validationError = new APIError(
        "Wallet address must be 42 characters",
        400
      );
      const result = handleWalletError(validationError);
      expect(result).toBe(
        "Invalid wallet address format. Address must be 42 characters long."
      );
    });

    it("handles main wallet removal error", () => {
      const mainWalletError = new APIError(
        "Cannot remove main wallet from bundle",
        400
      );
      const result = handleWalletError(mainWalletError);
      expect(result).toBe("Cannot remove the main wallet from your bundle.");
    });

    it("handles user/wallet not found error", () => {
      const notFoundError = new APIError("User not found", 404);
      const result = handleWalletError(notFoundError);
      expect(result).toBe("User or wallet not found.");
    });

    it("handles duplicate wallet error", () => {
      const duplicateError = new APIError(
        "Wallet already exists in bundle",
        409
      );
      const result = handleWalletError(duplicateError);
      expect(result).toBe("This wallet is already in your bundle.");
    });

    it("handles duplicate email error", () => {
      const emailError = new APIError("Email address already in use", 409);
      const result = handleWalletError(emailError);
      expect(result).toBe("This email address is already in use.");
    });

    it("falls back to generic error handling for non-wallet errors", () => {
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
