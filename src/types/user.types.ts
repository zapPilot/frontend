// Types matching account-engine API responses

export interface User {
  id: string;
  email?: string;
  is_active: boolean;
  is_subscribed_to_reports: boolean;
  created_at: string;
}

export interface UserCryptoWallet {
  id: string;
  user_id: string;
  wallet: string;
  /**
   * @deprecated Retained for backward compatibility with legacy API responses.
   * Not used in application logic unless NEXT_PUBLIC_USE_LEGACY_WALLET=true.
   * Safe to remove after confirming backend migration is complete.
   */
  is_main?: boolean;
  label?: string;
  created_at: string;
}

export interface Plan {
  code: string;
  name: string;
  tier: number;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_code: string;
  starts_at: string;
  ends_at?: string;
  is_canceled: boolean;
  created_at: string;
  plan?: Plan;
}

// API Response Interfaces
export interface ConnectWalletResponse {
  user_id: string;
  is_new_user: boolean;
}

export interface AddWalletResponse {
  wallet_id: string;
  message: string;
}

export interface UpdateEmailResponse {
  success: boolean;
  message: string;
}

export interface UserProfileResponse {
  user: User;
  wallets: UserCryptoWallet[];
  subscription?: UserSubscription;
}

// Service Response Wrapper
export interface ServiceResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}
