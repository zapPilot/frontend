import { createIntentServiceError } from "../lib/base-error";
import { httpUtils } from "../lib/http-utils";
import { executeServiceCall } from "./serviceHelpers";

const MAX_TOKEN_ADDRESSES = 50;
const MORALIS_API_KEY =
  process.env["NEXT_PUBLIC_MORALIS_API_KEY"] ?? process.env["MORALIS_API_KEY"];

const intentEngineClient = httpUtils.intentEngine;

const callBalanceService = <T>(call: () => Promise<T>) =>
  executeServiceCall(call, { mapError: createIntentServiceError });

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

const normalizeTokenBalance = (token: unknown): NormalizedTokenBalance => {
  const record = (token ?? {}) as Record<string, unknown>;

  const addressCandidate =
    (record["address"] as string | undefined) ??
    (record["tokenAddress"] as string | undefined) ??
    (record["token_address"] as string | undefined) ??
    "";
  const address = addressCandidate.toLowerCase();

  const decimalsRaw =
    record["decimals"] ?? record["tokenDecimals"] ?? record["token_decimals"];
  const decimals = typeof decimalsRaw === "number"
    ? decimalsRaw
    : typeof decimalsRaw === "string"
      ? Number.parseInt(decimalsRaw, 10)
      : null;

  const formattedCandidate =
    record["formattedBalance"] ??
    record["formatted_balance"] ??
    record["normalizedBalance"] ??
    record["normalized_balance"] ??
    record["balanceFormatted"] ??
    record["balance_formatted"];

  let formattedBalance: number | undefined;
  if (typeof formattedCandidate === "number") {
    formattedBalance = formattedCandidate;
  } else if (typeof formattedCandidate === "string") {
    const parsed = Number(formattedCandidate);
    if (!Number.isNaN(parsed)) {
      formattedBalance = parsed;
    }
  }

  const rawBalanceCandidate =
    record["rawBalance"] ??
    record["raw_balance"] ??
    record["balance"] ??
    record["tokenBalance"] ??
    record["token_balance"] ??
    record["balance_raw"];

  const rawBalance =
    typeof rawBalanceCandidate === "string"
      ? rawBalanceCandidate
      : typeof rawBalanceCandidate === "number"
        ? rawBalanceCandidate.toString()
        : undefined;

  const computeBalance = (): number => {
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
        const fractionString = fractionPart
          .toString()
          .padStart(decimals, "0")
          .replace(/0+$/, "");
        const assembled = fractionString
          ? `${integerPart.toString()}.${fractionString}`
          : integerPart.toString();
        const parsed = Number(assembled);
        return Number.isNaN(parsed) ? 0 : parsed;
      } catch {
        const parsed = Number(rawBalance);
        return Number.isNaN(parsed) ? 0 : parsed;
      }
    }

    if (rawBalance) {
      const parsed = Number(rawBalance);
      return Number.isNaN(parsed) ? 0 : parsed;
    }

    return 0;
  };

  const balance = computeBalance();

  const symbol =
    (record["symbol"] as string | undefined) ??
    (record["tokenSymbol"] as string | undefined) ??
    (record["token_symbol"] as string | undefined);
  const name =
    (record["name"] as string | undefined) ??
    (record["tokenName"] as string | undefined) ??
    (record["token_name"] as string | undefined);

  const usdValueCandidate =
    record["usdValue"] ?? record["usd_value"] ?? record["fiatValue"];
  const usdValue =
    typeof usdValueCandidate === "number"
      ? usdValueCandidate
      : typeof usdValueCandidate === "string"
        ? Number(usdValueCandidate)
        : undefined;

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

  if (Object.keys(metadata).length > 0) {
    normalized.metadata = metadata;
  }

  return normalized;
};

const normalizeWalletResponse = (
  response: unknown,
  fallback: { chainId: number; walletAddress: string }
): WalletTokenBalances => {
  const record = (response ?? {}) as Record<string, unknown>;
  console.log("record", record);
  
  // Parse tokens from the correct data structure
  let tokensSource: unknown[] = [];
  
  // Check if we have the data object with balances
  const data = record["data"] as Record<string, unknown> | undefined;
  if (data) {
    // Check for balances array (token metadata)
    if (Array.isArray(data["balances"])) {
      tokensSource = data["balances"] as unknown[];
    }
    // Also check for nativeBalances (single object, not array)
    if (data["nativeBalances"] && typeof data["nativeBalances"] === "object") {
      tokensSource.push(data["nativeBalances"]);
    }
  }
  
  // Fallback to old structure for backward compatibility
  if (tokensSource.length === 0) {
    tokensSource = Array.isArray(record["tokens"])
      ? (record["tokens"] as unknown[])
      : Array.isArray(record["data"])
        ? (record["data"] as unknown[])
        : [];
  }

  const tokens = tokensSource.map(normalizeTokenBalance);
  console.log("tokens in normalizeWalletResponse", tokens);
  const fromCacheFlag =
    Boolean(record["fromCache"]) ||
    Boolean(record["cacheHit"]) ||
    Boolean(record["isCached"]);

  const fetchedAtCandidate =
    record["fetchedAt"] ?? record["updatedAt"] ?? record["timestamp"];
  const fetchedAt =
    typeof fetchedAtCandidate === "string" ? fetchedAtCandidate : undefined;

  const chainIdCandidate = record["chainId"];
  const chainId =
    typeof chainIdCandidate === "number"
      ? chainIdCandidate
      : typeof chainIdCandidate === "string"
        ? Number(chainIdCandidate)
        : fallback.chainId;

  const addressCandidate =
    (record["address"] as string | undefined) ??
    (record["walletAddress"] as string | undefined) ??
    fallback.walletAddress;

  const normalized: WalletTokenBalances = {
    chainId,
    address: addressCandidate.toLowerCase(),
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

    const normalizedWallet = walletAddress.toLowerCase();

    const normalizedTokens = Array.from(
      new Set(
        tokenAddresses
          .filter(address => Boolean(address))
          .map(address => address.toLowerCase())
      )
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
