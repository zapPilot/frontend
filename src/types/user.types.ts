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

// API Request DTOs
export interface ConnectWalletDto {
  wallet: string;
}

export interface AddWalletDto {
  wallet: string;
  label?: string;
}

export interface UpdateEmailDto {
  email: string;
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

// API Error Response
export interface ApiError {
  error: string;
  message?: string;
  statusCode: number;
}

// Service Response Wrapper
export interface ServiceResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}
