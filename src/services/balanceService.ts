import { createServiceCaller } from "@/lib/utils-moved/createServiceCaller";
import { safeNumber } from "@/lib/validation/dataValidation";
import { validateWalletResponseData } from "@/schemas/api/balanceSchemas";

import { createIntentServiceError } from "../lib/errors";
import { httpUtils } from "../lib/http-utils";
import { normalizeAddress, normalizeAddresses } from "../utils/stringUtils";

const MAX_TOKEN_ADDRESSES = 50;
const MORALIS_API_KEY =
  process.env["NEXT_PUBLIC_MORALIS_API_KEY"] ?? process.env["MORALIS_API_KEY"];

const intentEngineClient = httpUtils.intentEngine;

const callBalanceService = createServiceCaller(createIntentServiceError);

export interface GetTokenBalancesParams {
  chainId: number;
  walletAddress: string;
  tokenAddresses?: string[];
  skipCache?: boolean;
}

export interface NormalizedTokenBalance {
  address: string;
  symbol?: string;
  name?: string;
  decimals: number | null;
  rawBalance?: string;
  formattedBalance?: number;
  usdValue?: number;
  balance: number;
  metadata?: Record<string, unknown>;
}

export interface WalletTokenBalances {
  chainId: number;
  address: string;
  fromCache: boolean;
  fetchedAt?: string;
  tokens: NormalizedTokenBalance[];
}

const SYMBOL_NATIVE_INDICATORS = ["eth", "arb", "op", "base"];
const NAME_NATIVE_INDICATORS = [
  "ethereum",
  "ether",
  "arbitrum",
  "optimism",
  "base",
];

const STRING_FALLBACK_KEYS = {
  symbol: ["symbol", "tokenSymbol", "token_symbol"],
  name: ["name", "tokenName", "token_name"],
};

const USD_VALUE_KEYS = ["usdValue", "usd_value", "fiatValue"] as const;

function pickStringField(
  record: Record<string, unknown>,
  keys: readonly string[]
): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim() !== "") {
      return value;
    }
  }
  return undefined;
}

function detectNativeAddress(record: Record<string, unknown>): string {
  const symbol = pickStringField(record, [
    "symbol",
    "tokenSymbol",
  ])?.toLowerCase();
  const name = pickStringField(record, ["name", "tokenName"])?.toLowerCase();

  const matchesSymbol = symbol
    ? SYMBOL_NATIVE_INDICATORS.includes(symbol)
    : false;
  const matchesName = name
    ? NAME_NATIVE_INDICATORS.some(indicator => name.includes(indicator))
    : false;

  return matchesSymbol || matchesName ? "native" : "";
}

function resolveTokenAddress(record: Record<string, unknown>): string {
  const candidate =
    (record["address"] as string | undefined) ??
    (record["tokenAddress"] as string | undefined) ??
    (record["token_address"] as string | undefined);

  if (candidate && candidate !== "") {
    return normalizeAddress(candidate);
  }

  return detectNativeAddress(record);
}

function parseDecimals(record: Record<string, unknown>): number | null {
  const decimalsRaw =
    record["decimals"] ?? record["tokenDecimals"] ?? record["token_decimals"];

  if (typeof decimalsRaw === "number") {
    return decimalsRaw;
  }

  if (typeof decimalsRaw === "string") {
    const parsed = Number.parseInt(decimalsRaw, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
}

function parseRawBalance(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toString();
  }

  return undefined;
}

function computeBalanceValue(
  formattedBalance: number | undefined,
  rawBalance: string | undefined,
  decimals: number | null
): number {
  if (typeof formattedBalance === "number") {
    return formattedBalance;
  }

  if (rawBalance && decimals !== null && Number.isFinite(decimals)) {
    try {
      const rawBigInt = BigInt(rawBalance);
      if (decimals <= 0) {
        return Number(rawBigInt);
      }

      const divisor = BigInt(10) ** BigInt(decimals);
      const integerPart = rawBigInt / divisor;
      const fractionPart = rawBigInt % divisor;
      const fractionString = fractionPart.toString().padStart(decimals, "0");
      let trimIndex = fractionString.length;
      while (
        trimIndex > 0 &&
        fractionString.charCodeAt(trimIndex - 1) === "0".charCodeAt(0)
      ) {
        trimIndex -= 1;
      }
      const trimmedFraction = fractionString.slice(0, trimIndex);
      const numericString = trimmedFraction
        ? `${integerPart.toString()}.${trimmedFraction}`
        : integerPart.toString();
      const parsed = Number(numericString);
      return Number.isNaN(parsed) ? 0 : parsed;
    } catch {
      const fallbackNumeric = Number(rawBalance);
      return Number.isNaN(fallbackNumeric) ? 0 : fallbackNumeric;
    }
  }

  if (rawBalance) {
    const parsed = Number(rawBalance);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

function buildMetadata(
  record: Record<string, unknown>
): Record<string, unknown> | undefined {
  const metadata: Record<string, unknown> = {};
  if (record["fromCache"] !== undefined) {
    metadata["fromCache"] = record["fromCache"];
  }
  if (record["isCache"] !== undefined) {
    metadata["isCache"] = record["isCache"];
  }
  if (record["source"] !== undefined) {
    metadata["source"] = record["source"];
  }

  return Object.keys(metadata).length > 0 ? metadata : undefined;
}

function extractUsdValue(record: Record<string, unknown>): number | undefined {
  for (const key of USD_VALUE_KEYS) {
    const parsed = safeNumber(record[key]);
    if (parsed !== undefined) {
      return parsed;
    }
  }

  return undefined;
}

const normalizeTokenBalance = (token: unknown): NormalizedTokenBalance => {
  const record = (token ?? {}) as Record<string, unknown>;

  const address = resolveTokenAddress(record);
  const decimals = parseDecimals(record);
  const formattedBalance = safeNumber(record["balanceFormatted"]);
  const rawBalance = parseRawBalance(record["balance"]);
  const balance = computeBalanceValue(formattedBalance, rawBalance, decimals);

  const symbol = pickStringField(record, STRING_FALLBACK_KEYS.symbol);
  const name = pickStringField(record, STRING_FALLBACK_KEYS.name);
  const usdValue = extractUsdValue(record);

  const normalized: NormalizedTokenBalance = {
    address,
    decimals,
    balance,
  };

  if (symbol) {
    normalized.symbol = symbol;
  }
  if (name) {
    normalized.name = name;
  }
  if (rawBalance !== undefined) {
    normalized.rawBalance = rawBalance;
  }
  if (formattedBalance !== undefined) {
    normalized.formattedBalance = formattedBalance;
  }
  if (usdValue !== undefined && !Number.isNaN(usdValue)) {
    normalized.usdValue = usdValue;
  }

  const metadata = buildMetadata(record);
  if (metadata) {
    normalized.metadata = metadata;
  }

  return normalized;
};

const normalizeWalletResponse = (
  response: unknown,
  fallback: { chainId: number; walletAddress: string }
): WalletTokenBalances => {
  // Validate the response with Zod before processing
  // This catches malformed API responses early with detailed error messages
  const validatedResponse = validateWalletResponseData(response);

  // Parse tokens from the current data structure (object format only)
  let tokensSource: unknown[] = [];

  // Backend sends data as an object with balances and nativeBalance
  const data = validatedResponse.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    // Check for balances array (token metadata)
    if ("balances" in data && Array.isArray(data.balances)) {
      tokensSource = data.balances;
    }
    // Also check for nativeBalance (single object, not array)
    if ("nativeBalance" in data && typeof data.nativeBalance === "object") {
      tokensSource.push(data.nativeBalance);
    }
  }

  const tokens = tokensSource.map(normalizeTokenBalance);
  const fromCacheFlag =
    Boolean(validatedResponse.fromCache) ||
    Boolean(validatedResponse.cacheHit) ||
    Boolean(validatedResponse.isCached);

  const fetchedAt =
    validatedResponse.fetchedAt ??
    validatedResponse.updatedAt ??
    validatedResponse.timestamp;

  // Parse chainId from response or use fallback
  const chainIdFromResponse = validatedResponse.chainId;
  const chainId =
    typeof chainIdFromResponse === "number"
      ? chainIdFromResponse
      : typeof chainIdFromResponse === "string"
        ? Number(chainIdFromResponse)
        : fallback.chainId;

  const addressCandidate =
    validatedResponse.address ??
    validatedResponse.walletAddress ??
    fallback.walletAddress;

  const normalized: WalletTokenBalances = {
    chainId,
    address: normalizeAddress(addressCandidate),
    fromCache: fromCacheFlag,
    tokens,
  };

  if (fetchedAt) {
    normalized.fetchedAt = fetchedAt;
  }

  return normalized;
};

export const getTokenBalances = (
  params: GetTokenBalancesParams
): Promise<WalletTokenBalances> =>
  callBalanceService(async () => {
    const { chainId, walletAddress, tokenAddresses = [], skipCache } = params;

    if (!chainId || chainId <= 0) {
      throw new Error("A valid chainId is required to fetch balances");
    }

    if (!walletAddress) {
      throw new Error("A wallet address is required to fetch balances");
    }

    const normalizedWallet = normalizeAddress(walletAddress);

    const normalizedTokens = normalizeAddresses(
      tokenAddresses.filter(address => Boolean(address))
    );

    if (normalizedTokens.length > MAX_TOKEN_ADDRESSES) {
      throw new Error(
        `Balance requests support up to ${MAX_TOKEN_ADDRESSES} token addresses`
      );
    }

    const searchParams = new URLSearchParams();

    if (normalizedTokens.length > 0) {
      searchParams.set("tokens", normalizedTokens.join(","));
    }

    if (skipCache) {
      searchParams.set("skipCache", "true");
    }

    const queryString = searchParams.toString();

    const path = `/api/v1/balances/${chainId}/${normalizedWallet}${
      queryString ? `?${queryString}` : ""
    }`;

    const headers: Record<string, string> = {};
    if (MORALIS_API_KEY) {
      headers["Authorization"] = `Bearer ${MORALIS_API_KEY}`;
    }

    const response = await intentEngineClient.get(path, {
      headers,
    });

    return normalizeWalletResponse(response, {
      chainId,
      walletAddress: normalizedWallet,
    });
  });
