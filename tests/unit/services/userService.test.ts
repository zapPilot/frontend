import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the HTTP utils module
vi.mock("../../../src/lib/http-utils", () => ({
  httpUtils: {
    accountApi: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
    analyticsEngine: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
    backendApi: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
    intentEngine: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
    debank: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
  },
  httpRequest: vi.fn(),
  httpGet: vi.fn(),
  httpPost: vi.fn(),
  httpPut: vi.fn(),
  httpPatch: vi.fn(),
  httpDelete: vi.fn(),
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
  NetworkError: class NetworkError extends Error {
    constructor(message: string = "Network connection failed") {
      super(message);
      this.name = "NetworkError";
    }
  },
  TimeoutError: class TimeoutError extends Error {
    constructor(message: string = "Request timed out") {
      super(message);
      this.name = "TimeoutError";
    }
  },
  handleHTTPError: vi.fn().mockReturnValue("Mock HTTP error"),
}));

// No longer needed - userService now uses handleHTTPError from http-utils

// Mock the account service instead of clients
vi.mock("../../../src/services/accountService", () => ({
  connectWallet: vi.fn(),
  getUserProfile: vi.fn(),
  getUserWallets: vi.fn(),
  addWalletToBundle: vi.fn(),
  removeWalletFromBundle: vi.fn(),
  updateUserEmail: vi.fn(),
  removeUserEmail: vi.fn(),
  AccountServiceError: class MockAccountServiceError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "AccountServiceError";
    }
  },
}));

// Import types and functions after mocking
import type {
  AddWalletResponse,
  ConnectWalletResponse,
  UpdateEmailResponse,
  UserCryptoWallet,
  UserProfileResponse,
} from "../../../src/types/user.types";

import {
  addWalletToBundle,
  connectWallet,
  getUserProfile,
  getUserWallets,
  handleWalletError,
  removeWalletFromBundle,
  transformWalletData,
  updateUserEmail,
  validateWalletAddress,
} from "../../../src/services/userService";

// Import the mocked modules
import { handleHTTPError } from "../../../src/lib/http-utils";
import {
  connectWallet as connectWalletService,
  getUserProfile as getUserProfileService,
  getUserWallets as getUserWalletsService,
  addWalletToBundle as addWalletToBundleService,
  removeWalletFromBundle as removeWalletFromBundleService,
  updateUserEmail as updateUserEmailService,
  removeUserEmail as removeUserEmailService,
  AccountServiceError,
} from "../../../src/services/accountService";

const mockHandleHTTPError = vi.mocked(handleHTTPError);
const mockConnectWalletService = vi.mocked(connectWalletService);
const mockGetUserProfileService = vi.mocked(getUserProfileService);
const mockGetUserWalletsService = vi.mocked(getUserWalletsService);
const mockAddWalletToBundleService = vi.mocked(addWalletToBundleService);
const mockRemoveWalletFromBundleService = vi.mocked(
  removeWalletFromBundleService
);
const mockUpdateUserEmailService = vi.mocked(updateUserEmailService);
const mockRemoveUserEmailService = vi.mocked(removeUserEmailService);

// API Error for testing
class _APIError extends Error {
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
    mockHandleHTTPError.mockReturnValue("Mock HTTP error");
  });

  describe("connectWallet", () => {
    const mockResponse: ConnectWalletResponse = {
      user_id: "user-123",
      is_new_user: false,
    };

    it("successfully connects wallet for existing user", async () => {
      mockConnectWalletService.mockResolvedValue(mockResponse);

      const result = await connectWallet(
        "0x1234567890123456789012345678901234567890"
      );

      expect(result).toEqual({
        data: mockResponse,
        success: true,
      });
      expect(mockConnectWalletService).toHaveBeenCalledWith(
        "0x1234567890123456789012345678901234567890"
      );
    });

    it("successfully connects wallet for new user", async () => {
      const newUserResponse: ConnectWalletResponse = {
        user_id: "user-456",
        is_new_user: true,
      };
      mockConnectWalletService.mockResolvedValue(newUserResponse);

      const result = await connectWallet(
        "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
      );

      expect(result).toEqual({
        data: newUserResponse,
        success: true,
      });
      expect(mockConnectWalletService).toHaveBeenCalledWith(
        "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
      );
    });

    it("handles API errors correctly", async () => {
      const apiError = new AccountServiceError("User not found", 404);
      mockConnectWalletService.mockRejectedValue(apiError);

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
      mockConnectWalletService.mockRejectedValue(networkError);
      mockHandleHTTPError.mockReturnValue("Network connection failed");

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
          label: "Primary Wallet",

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
      mockGetUserProfileService.mockResolvedValue(mockUserProfile);

      const result = await getUserProfile("user-123");

      expect(result).toEqual({
        data: mockUserProfile,
        success: true,
      });
      expect(mockGetUserProfileService).toHaveBeenCalledWith("user-123");
    });

    it("handles missing user error", async () => {
      const apiError = new AccountServiceError("User not found", 404);
      mockGetUserProfileService.mockRejectedValue(apiError);

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
        label: "Primary Wallet",

        created_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "wallet-2",
        user_id: "user-123",
        wallet: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
        label: "Trading Wallet",

        created_at: "2024-01-02T00:00:00Z",
      },
    ];

    it("successfully retrieves user wallets", async () => {
      mockGetUserWalletsService.mockResolvedValue(mockWallets);

      const result = await getUserWallets("user-123");

      expect(result).toEqual({
        data: mockWallets,
        success: true,
      });
      expect(mockGetUserWalletsService).toHaveBeenCalledWith("user-123");
    });

    it("handles empty wallet list", async () => {
      mockGetUserWalletsService.mockResolvedValue([]);

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
      mockAddWalletToBundleService.mockResolvedValue(mockAddResponse);

      const result = await addWalletToBundle(
        "user-123",
        "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
        "Trading Wallet"
      );

      expect(result).toEqual({
        data: mockAddResponse,
        success: true,
      });
      expect(mockAddWalletToBundleService).toHaveBeenCalledWith(
        "user-123",
        "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
        "Trading Wallet"
      );
    });

    it("successfully adds wallet without label", async () => {
      mockAddWalletToBundleService.mockResolvedValue(mockAddResponse);

      const result = await addWalletToBundle(
        "user-123",
        "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
      );

      expect(result).toEqual({
        data: mockAddResponse,
        success: true,
      });
      expect(mockAddWalletToBundleService).toHaveBeenCalledWith(
        "user-123",
        "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
        undefined
      );
    });

    it("handles duplicate wallet error", async () => {
      const duplicateError = new AccountServiceError(
        "Wallet already exists in bundle",
        409
      );
      mockAddWalletToBundleService.mockRejectedValue(duplicateError);

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
      mockRemoveWalletFromBundleService.mockResolvedValue(mockRemoveResponse);

      const result = await removeWalletFromBundle("user-123", "wallet-2");

      expect(result).toEqual({
        data: mockRemoveResponse,
        success: true,
      });
      expect(mockRemoveWalletFromBundleService).toHaveBeenCalledWith(
        "user-123",
        "wallet-2"
      );
    });

    it("handles attempt to remove main wallet", async () => {
      const mainWalletError = new AccountServiceError(
        "Cannot remove main wallet",
        400
      );
      mockRemoveWalletFromBundleService.mockRejectedValue(mainWalletError);

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
      mockUpdateUserEmailService.mockResolvedValue(mockEmailResponse);

      const result = await updateUserEmail("user-123", "newemail@example.com");

      expect(result).toEqual({
        data: mockEmailResponse,
        success: true,
      });
      expect(mockUpdateUserEmailService).toHaveBeenCalledWith(
        "user-123",
        "newemail@example.com"
      );
    });

    it("handles duplicate email error", async () => {
      const duplicateEmailError = new AccountServiceError(
        "Email already in use",
        409
      );
      mockUpdateUserEmailService.mockRejectedValue(duplicateEmailError);

      const result = await updateUserEmail("user-123", "existing@example.com");

      expect(result).toEqual({
        error: "Email already in use",
        success: false,
      });
    });
  });

  describe("removeUserEmail", () => {
    const mockEmailResponse: UpdateEmailResponse = {
      success: true,
      message: "Email removed successfully",
    };

    it("successfully removes email (unsubscribe)", async () => {
      mockRemoveUserEmailService.mockResolvedValue(mockEmailResponse);

      const { removeUserEmail } = await import(
        "../../../src/services/userService"
      );
      const result = await removeUserEmail("user-123");

      expect(result).toEqual({
        data: mockEmailResponse,
        success: true,
      });
      expect(mockRemoveUserEmailService).toHaveBeenCalledWith("user-123");
    });

    it("handles API errors on remove", async () => {
      const apiError = new AccountServiceError("User not found", 404);
      mockRemoveUserEmailService.mockRejectedValue(apiError);

      const { removeUserEmail } = await import(
        "../../../src/services/userService"
      );
      const result = await removeUserEmail("nonexistent-user");

      expect(result).toEqual({
        error: "User not found",
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
        label: "My Main Wallet",

        created_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "wallet-2",
        user_id: "user-123",
        wallet: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",

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
          isMain: false,
          isActive: false,

          createdAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "wallet-2",
          address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
          label: "Wallet",
          isMain: false,
          isActive: false,

          createdAt: "2024-01-02T00:00:00Z",
        },
      ]);
    });

    it("handles empty wallet list", () => {
      const result = transformWalletData([]);
      expect(result).toEqual([]);
    });
  });

  describe("handleWalletError", () => {
    it("handles AccountServiceError by returning message directly", () => {
      const accountError = new AccountServiceError(
        "Invalid wallet address",
        400
      );
      const result = handleWalletError(accountError);
      expect(result).toBe("Invalid wallet address");
    });

    it("falls back to generic error handling for non-AccountApiError", () => {
      const genericError = new Error("Network connection failed");
      mockHandleHTTPError.mockReturnValue("Network connection failed");

      const result = handleWalletError(genericError);
      expect(result).toBe("Network connection failed");
      expect(mockHandleHTTPError).toHaveBeenCalledWith(genericError);
    });

    it("handles unknown error types", () => {
      mockHandleHTTPError.mockReturnValue("Unknown error occurred");

      const result = handleWalletError("string error");
      expect(result).toBe("Unknown error occurred");
      expect(mockHandleHTTPError).toHaveBeenCalledWith("string error");
    });
  });
});
