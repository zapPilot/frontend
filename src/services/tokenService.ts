/**
 * Token Service
 * Service functions for fetching supported zap tokens from backend API
 */

import { httpUtils } from "@/lib/http-utils";
import { SwapToken } from "@/types/ui/swap";

import { createServiceCaller } from "../lib/createServiceCaller";
import { createIntentServiceError } from "../lib/errors";

// Get configured client
const intentEngineClient = httpUtils.intentEngine;

const callTokenService = createServiceCaller(createIntentServiceError);

/**
 * Get supported zap tokens for a specific chain
 * @param chainId - The chain ID (e.g., 1 for Ethereum, 42161 for Arbitrum)
 * @returns Promise<SwapToken[]> - Array of supported tokens for zap operations
 */
interface ZapTokensResponse {
  chainId: number;
  chainName: string;
  nativeToken: string;
  tokens: (Omit<SwapToken, "chainId"> & {
    type?: "native" | "wrapped" | "erc20";
    wrappedVersion?: string;
    nativeVersion?: string;
    hasDeposit?: boolean;
  })[];
}

export const getZapTokens = (chainId: number): Promise<SwapToken[]> =>
  callTokenService(async () => {
    const response = await intentEngineClient.get<ZapTokensResponse>(
      `/tokens/zap/${chainId}`
    );

    if (!response || !Array.isArray(response.tokens)) {
      return [];
    }

    return response.tokens.map(token => ({
      ...token,
      chainId: response.chainId ?? chainId,
    }));
  });
