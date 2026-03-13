import type { EtlJobStatus } from "@davidtnfsh/etl-contracts";

import { AccountServiceError } from "@/lib/errors";
import { httpUtils } from "@/lib/http";
import { createServiceCaller } from "@/lib/http/createServiceCaller";
import { createServiceError } from "@/lib/http/serviceErrorUtils";
import {
  type AddWalletResponse,
  type ConnectWalletResponse,
  connectWalletResponseSchema,
  etlJobStatusResponseSchema,
  type UpdateEmailResponse,
  type UserCryptoWallet,
  type UserProfileResponse,
  validateAddWalletResponse,
  validateMessageResponse,
  validateUpdateEmailResponse,
  validateUserProfileResponse,
  validateUserWallets,
} from "@/schemas/api/accountSchemas";
import { logger } from "@/utils/logger";

export { AccountServiceError };

/**
 * ETL job response from trigger endpoint.
 */
export interface EtlJobResponse {
  job_id: string | null;
  status: string;
  message: string;
  rate_limited?: boolean;
}

export type { EtlJobStatus } from "@davidtnfsh/etl-contracts";

const mapAccountServiceErrorMessage = (
  status: number | undefined,
  message: string | undefined
): string => {
  if (status === 400 && message?.includes("wallet")) {
    return "Invalid wallet address format. Must be a 42-character Ethereum address.";
  }

  if (status === 404) {
    return "User account not found. Please connect your wallet first.";
  }

  if (status === 409) {
    if (message?.includes("wallet already belongs to another user")) {
      return message;
    }

    if (message?.includes("wallet")) {
      return "This wallet is already associated with an account.";
    }

    if (message?.includes("email")) {
      return "This email address is already in use.";
    }

    return message ?? "Account service error";
  }

  if (status === 422) {
    return "Invalid request data. Please check your input and try again.";
  }

  return message ?? "Account service error";
};

const createAccountServiceError = (error: unknown): AccountServiceError =>
  createServiceError(
    error,
    AccountServiceError,
    "Account service error",
    mapAccountServiceErrorMessage
  );

const logDevelopmentResponse = (label: string, payload: unknown): void => {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  logger.debug(label, JSON.stringify(payload, null, 2));
};

const validateConnectWalletResponse = (
  response: unknown
): ConnectWalletResponse => {
  const validationResult = connectWalletResponseSchema.safeParse(response);
  if (!validationResult.success) {
    logger.error("❌ Validation failed:", validationResult.error.issues);
    throw new AccountServiceError(
      "Connect wallet response validation failed",
      500,
      "VALIDATION_ERROR",
      { issues: validationResult.error.issues }
    );
  }

  return validationResult.data as ConnectWalletResponse;
};

const accountApiClient = httpUtils.accountApi;
const callAccountApi = createServiceCaller(createAccountServiceError);

const requestAccountResource = async <T>(
  request: () => Promise<T>
): Promise<T> => {
  return callAccountApi(request) as Promise<T>;
};

const requestAndValidate = async <TResponse, TResult>(
  request: () => Promise<TResponse>,
  validate: (response: unknown) => TResult
): Promise<TResult> => {
  const response = await requestAccountResource(request);
  return validate(response);
};

const getAccountResource = async <T>(path: string): Promise<T> => {
  return requestAccountResource(() => accountApiClient.get<T>(path));
};

const postAccountResource = async <T>(
  path: string,
  body?: Record<string, unknown>
): Promise<T> => {
  if (body) {
    return requestAccountResource(() => accountApiClient.post<T>(path, body));
  }

  return requestAccountResource(() => accountApiClient.post<T>(path));
};

const putAccountResource = async <T>(
  path: string,
  body: Record<string, unknown>
): Promise<T> => {
  return requestAccountResource(() => accountApiClient.put<T>(path, body));
};

const deleteAccountResource = async <T>(path: string): Promise<T> => {
  return requestAccountResource(() => accountApiClient.delete<T>(path));
};

/**
 * Connect wallet and create/retrieve user.
 */
export async function connectWallet(
  walletAddress: string
): Promise<ConnectWalletResponse> {
  const response = await postAccountResource<ConnectWalletResponse>(
    "/users/connect-wallet",
    {
      wallet: walletAddress,
    }
  );

  logDevelopmentResponse("🔍 Raw connect-wallet response:", response);
  const validatedResponse = validateConnectWalletResponse(response);
  logDevelopmentResponse("✅ Validated response:", validatedResponse);

  return validatedResponse;
}

/**
 * Get complete user profile.
 */
export async function getUserProfile(
  userId: string
): Promise<UserProfileResponse> {
  return requestAndValidate(
    () => getAccountResource<UserProfileResponse>(`/users/${userId}`),
    validateUserProfileResponse
  );
}

/**
 * Update user email.
 */
export async function updateUserEmail(
  userId: string,
  email: string
): Promise<UpdateEmailResponse> {
  return requestAndValidate(
    () =>
      putAccountResource<UpdateEmailResponse>(`/users/${userId}/email`, {
        email,
      }),
    validateUpdateEmailResponse
  );
}

const deleteUserResource = async (
  path: string
): Promise<UpdateEmailResponse> => {
  return requestAndValidate(
    () => deleteAccountResource<UpdateEmailResponse>(path),
    validateUpdateEmailResponse
  );
};

/**
 * Remove user email (unsubscribe from email-based reports).
 */
export async function removeUserEmail(
  userId: string
): Promise<UpdateEmailResponse> {
  return deleteUserResource(`/users/${userId}/email`);
}

/**
 * Delete user account.
 * Cannot delete users with active subscriptions.
 */
export async function deleteUser(userId: string): Promise<UpdateEmailResponse> {
  return deleteUserResource(`/users/${userId}`);
}

/**
 * Get all user wallets.
 */
export async function getUserWallets(
  userId: string
): Promise<UserCryptoWallet[]> {
  return requestAndValidate(
    () => getAccountResource<UserCryptoWallet[]>(`/users/${userId}/wallets`),
    validateUserWallets
  );
}

/**
 * Add wallet to user bundle.
 */
export async function addWalletToBundle(
  userId: string,
  walletAddress: string,
  label?: string
): Promise<AddWalletResponse> {
  return requestAndValidate(
    () =>
      postAccountResource<AddWalletResponse>(`/users/${userId}/wallets`, {
        wallet: walletAddress,
        label,
      }),
    validateAddWalletResponse
  );
}

/**
 * Remove wallet from user bundle.
 */
export async function removeWalletFromBundle(
  userId: string,
  walletId: string
): Promise<{ message: string }> {
  return requestAndValidate(
    () =>
      deleteAccountResource<{ message: string }>(
        `/users/${userId}/wallets/${walletId}`
      ),
    validateMessageResponse
  );
}

/**
 * Update wallet label.
 */
export async function updateWalletLabel(
  userId: string,
  walletAddress: string,
  label: string
): Promise<{ message: string }> {
  return requestAndValidate(
    () =>
      putAccountResource<{ message: string }>(
        `/users/${userId}/wallets/${walletAddress}/label`,
        { label }
      ),
    validateMessageResponse
  );
}

/**
 * Trigger ETL data fetch for a wallet.
 */
export async function triggerWalletDataFetch(
  userId: string,
  walletAddress: string
): Promise<EtlJobResponse> {
  return postAccountResource<EtlJobResponse>(
    `/users/${userId}/wallets/${walletAddress}/fetch-data`
  );
}

/**
 * Get ETL job status by ID.
 */
export async function getEtlJobStatus(jobId: string): Promise<EtlJobStatus> {
  return requestAndValidate(
    () => getAccountResource<EtlJobStatus>(`/etl/jobs/${jobId}`),
    response => etlJobStatusResponseSchema.parse(response)
  );
}
