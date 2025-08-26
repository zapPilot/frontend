/**
 * Account API Client
 * Handles user management and wallet operations (port 3004)
 */

import { BaseApiClient, APIError } from "./base-client";
import type {
  ConnectWalletResponse,
  UserProfileResponse,
  UserCryptoWallet,
  AddWalletResponse,
  UpdateEmailResponse,
} from "../../types/user.types";

export class AccountApiError extends APIError {
  constructor(message: string, status: number, code?: string, details?: any) {
    super(message, status, code, details);
    this.name = "AccountApiError";
  }
}

/**
 * Account API Client for user and wallet management
 */
export class AccountApiClient extends BaseApiClient {
  constructor(baseURL: string) {
    super({
      baseURL,
      timeout: 8000, // Account operations are typically fast
      retries: 2, // Lower retries for user operations
      retryDelay: 500,
      headers: {
        "X-Service": "account-api",
      },
    });
  }

  /**
   * Create account-specific errors with better context
   */
  protected override createServiceError(
    status: number,
    errorData: any
  ): AccountApiError {
    let message = errorData.message;

    // Enhance error messages based on status codes
    switch (status) {
      case 400:
        if (message?.includes("wallet")) {
          message =
            "Invalid wallet address format. Must be a 42-character Ethereum address.";
        }
        break;
      case 404:
        message = "User account not found. Please connect your wallet first.";
        break;
      case 409:
        if (message?.includes("wallet")) {
          message = "This wallet is already associated with an account.";
        } else if (message?.includes("email")) {
          message = "This email address is already in use.";
        }
        break;
      case 422:
        message =
          "Invalid request data. Please check your input and try again.";
        break;
    }

    return new AccountApiError(
      message,
      status,
      errorData.code,
      errorData.details
    );
  }

  // User Management Operations

  /**
   * Connect wallet and create/retrieve user
   */
  async connectWallet(walletAddress: string): Promise<ConnectWalletResponse> {
    return this.get<ConnectWalletResponse>("/users/connect-wallet", {
      wallet: walletAddress,
    });
  }

  /**
   * Get complete user profile
   */
  async getUserProfile(userId: string): Promise<UserProfileResponse> {
    return this.get<UserProfileResponse>(`/users/${userId}`);
  }

  /**
   * Update user email
   */
  async updateUserEmail(
    userId: string,
    email: string
  ): Promise<UpdateEmailResponse> {
    return this.put<UpdateEmailResponse>(`/users/${userId}/email`, { email });
  }

  // Wallet Management Operations

  /**
   * Get all user wallets
   */
  async getUserWallets(userId: string): Promise<UserCryptoWallet[]> {
    return this.get<UserCryptoWallet[]>(`/users/${userId}/wallets`);
  }

  /**
   * Add wallet to user bundle
   */
  async addWalletToBundle(
    userId: string,
    walletAddress: string,
    label?: string
  ): Promise<AddWalletResponse> {
    return this.post<AddWalletResponse>(`/users/${userId}/wallets`, {
      wallet: walletAddress,
      label,
    });
  }

  /**
   * Remove wallet from user bundle
   */
  async removeWalletFromBundle(
    userId: string,
    walletId: string
  ): Promise<{ message: string }> {
    return this.delete<{ message: string }>(
      `/users/${userId}/wallets/${walletId}`
    );
  }

  /**
   * Update wallet label
   */
  async updateWalletLabel(
    userId: string,
    walletId: string,
    label: string
  ): Promise<{ message: string }> {
    return this.put<{ message: string }>(
      `/users/${userId}/wallets/${walletId}`,
      {
        label,
      }
    );
  }

  // Utility Methods

  /**
   * Health check for account service
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.get<{ status: string; timestamp: string }>("/health");
  }

  /**
   * Validate wallet address format client-side before API call
   */
  static validateWalletAddress(address: string): boolean {
    const ethRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethRegex.test(address);
  }
}

// Singleton instance
export const accountApiClient = new AccountApiClient(
  process.env["NEXT_PUBLIC_ACCOUNT_API_URL"] || "http://127.0.0.1:3004"
);
