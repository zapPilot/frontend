import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";

// Import mocked modules after mocking
import { httpUtils } from "../../../src/lib/http-utils";
import {
  checkIntentServiceHealth,
  type DustTokenParams,
  executeDustZap,
  executeRebalance,
  executeSwap,
  executeUnifiedZap,
  executeZapIn,
  executeZapOut,
  type ExecutionIntent,
  type ExecutionResult,
  getIntentStatus,
  getStrategies,
  getUserIntentHistory,
  type IntentStatus,
  type UnifiedZapRequest,
  type UnifiedZapResponse,
} from "../../../src/services/intentService";
import { executeServiceCall } from "../../../src/services/serviceHelpers";
import type { StrategiesApiResponse } from "../../../src/types/strategies";

// Mock http-utils module
vi.mock("../../../src/lib/http-utils", () => ({
  httpUtils: {
    intentEngine: {
      post: vi.fn(),
      get: vi.fn(),
    },
  },
}));

// Mock serviceHelpers module
vi.mock("../../../src/services/serviceHelpers", () => ({
  executeServiceCall: vi.fn(<T>(call: () => Promise<T>) => call()),
}));

// Mock base-error module
vi.mock("../../../src/lib/base-error", () => ({
  createIntentServiceError: vi.fn((error: unknown) => error),
}));

describe("intentService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("executeSwap", () => {
    it("should execute swap intent successfully", async () => {
      const mockIntent: Omit<ExecutionIntent, "type"> = {
        fromToken: "0xToken1Address",
        toToken: "0xToken2Address",
        amount: "1000000000000000000",
        slippage: 0.5,
        walletAddress: "0x1234567890123456789012345678901234567890",
        chainId: 1,
        priority: "normal",
      };

      const mockResult: ExecutionResult = {
        intentId: "intent-swap-001",
        status: "pending",
        transactions: [
          {
            hash: "0xabcdef1234567890",
            status: "pending",
          },
        ],
      };

      (httpUtils.intentEngine.post as Mock).mockResolvedValue(mockResult);

      const result = await executeSwap(mockIntent);

      expect(httpUtils.intentEngine.post).toHaveBeenCalledWith(
        "/intents/swap",
        {
          ...mockIntent,
          type: "swap",
        }
      );
      expect(executeServiceCall).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResult);
    });

    it("should add type field to request payload", async () => {
      const mockIntent: Omit<ExecutionIntent, "type"> = {
        amount: "100",
        slippage: 1,
        walletAddress: "0xWallet",
        chainId: 1,
      };

      const mockResult: ExecutionResult = {
        intentId: "intent-001",
        status: "pending",
        transactions: [],
      };

      (httpUtils.intentEngine.post as Mock).mockResolvedValue(mockResult);

      await executeSwap(mockIntent);

      const callArgs = (httpUtils.intentEngine.post as Mock).mock.calls[0];
      expect(callArgs[1]).toHaveProperty("type", "swap");
    });

    it("should handle errors through executeServiceCall wrapper", async () => {
      const mockError = new Error("Network error");
      (httpUtils.intentEngine.post as Mock).mockRejectedValue(mockError);

      (executeServiceCall as Mock).mockImplementation(async call => {
        try {
          return await call();
        } catch (_error) {
          throw new Error("Service error wrapper");
        }
      });

      await expect(
        executeSwap({
          amount: "100",
          slippage: 1,
          walletAddress: "0xWallet",
          chainId: 1,
        })
      ).rejects.toThrow("Service error wrapper");
    });
  });

  describe("executeZapIn", () => {
    it("should execute zapIn intent successfully", async () => {
      const mockIntent: Omit<ExecutionIntent, "type"> = {
        fromToken: "0xUSDCAddress",
        toToken: "0xLPTokenAddress",
        amount: "5000000000",
        slippage: 1.0,
        walletAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
        chainId: 137,
        priority: "fast",
      };

      const mockResult: ExecutionResult = {
        intentId: "intent-zapin-002",
        status: "processing",
        transactions: [
          {
            hash: "0xtxhash001",
            status: "confirmed",
            gasUsed: "150000",
            effectiveGasPrice: "30000000000",
          },
        ],
        executionTime: 1500,
      };

      (httpUtils.intentEngine.post as Mock).mockResolvedValue(mockResult);

      const result = await executeZapIn(mockIntent);

      expect(httpUtils.intentEngine.post).toHaveBeenCalledWith(
        "/intents/zapIn",
        {
          ...mockIntent,
          type: "zapIn",
        }
      );
      expect(result).toEqual(mockResult);
    });

    it("should use correct endpoint path", async () => {
      const mockIntent: Omit<ExecutionIntent, "type"> = {
        amount: "100",
        slippage: 1,
        walletAddress: "0xWallet",
        chainId: 1,
      };

      (httpUtils.intentEngine.post as Mock).mockResolvedValue({
        intentId: "test",
        status: "pending",
        transactions: [],
      });

      await executeZapIn(mockIntent);

      expect(httpUtils.intentEngine.post).toHaveBeenCalledWith(
        "/intents/zapIn",
        expect.any(Object)
      );
    });
  });

  describe("executeZapOut", () => {
    it("should execute zapOut intent successfully", async () => {
      const mockIntent: Omit<ExecutionIntent, "type"> = {
        fromToken: "0xLPTokenAddress",
        toToken: "0xUSDCAddress",
        amount: "1000000000000000000",
        slippage: 0.8,
        walletAddress: "0x9876543210987654321098765432109876543210",
        chainId: 1,
      };

      const mockResult: ExecutionResult = {
        intentId: "intent-zapout-003",
        status: "completed",
        transactions: [
          {
            hash: "0xtxhash002",
            status: "confirmed",
            gasUsed: "200000",
          },
        ],
        executionTime: 2000,
      };

      (httpUtils.intentEngine.post as Mock).mockResolvedValue(mockResult);

      const result = await executeZapOut(mockIntent);

      expect(httpUtils.intentEngine.post).toHaveBeenCalledWith(
        "/intents/zapOut",
        {
          ...mockIntent,
          type: "zapOut",
        }
      );
      expect(result).toEqual(mockResult);
    });

    it("should handle optional priority parameter", async () => {
      const mockIntent: Omit<ExecutionIntent, "type"> = {
        amount: "100",
        slippage: 1,
        walletAddress: "0xWallet",
        chainId: 1,
        priority: "slow",
      };

      (httpUtils.intentEngine.post as Mock).mockResolvedValue({
        intentId: "test",
        status: "pending",
        transactions: [],
      });

      await executeZapOut(mockIntent);

      const callArgs = (httpUtils.intentEngine.post as Mock).mock.calls[0][1];
      expect(callArgs.priority).toBe("slow");
    });
  });

  describe("executeRebalance", () => {
    it("should execute rebalance intent successfully", async () => {
      const mockIntent: Omit<
        ExecutionIntent,
        "type" | "fromToken" | "toToken"
      > = {
        amount: "10000000000000000000",
        slippage: 1.5,
        walletAddress: "0x1111111111111111111111111111111111111111",
        chainId: 42161,
        priority: "normal",
      };

      const mockResult: ExecutionResult = {
        intentId: "intent-rebalance-004",
        status: "processing",
        transactions: [
          {
            hash: "0xtxhash003",
            status: "pending",
          },
          {
            hash: "0xtxhash004",
            status: "pending",
          },
        ],
      };

      (httpUtils.intentEngine.post as Mock).mockResolvedValue(mockResult);

      const result = await executeRebalance(mockIntent);

      expect(httpUtils.intentEngine.post).toHaveBeenCalledWith(
        "/intents/rebalance",
        {
          ...mockIntent,
          type: "rebalance",
        }
      );
      expect(result).toEqual(mockResult);
    });

    it("should not include fromToken or toToken in request", async () => {
      const mockIntent: Omit<
        ExecutionIntent,
        "type" | "fromToken" | "toToken"
      > = {
        amount: "100",
        slippage: 1,
        walletAddress: "0xWallet",
        chainId: 1,
      };

      (httpUtils.intentEngine.post as Mock).mockResolvedValue({
        intentId: "test",
        status: "pending",
        transactions: [],
      });

      await executeRebalance(mockIntent);

      const callArgs = (httpUtils.intentEngine.post as Mock).mock.calls[0][1];
      expect(callArgs).not.toHaveProperty("fromToken");
      expect(callArgs).not.toHaveProperty("toToken");
      expect(callArgs).toHaveProperty("type", "rebalance");
    });

    it("should handle multiple transactions in result", async () => {
      const mockIntent: Omit<
        ExecutionIntent,
        "type" | "fromToken" | "toToken"
      > = {
        amount: "100",
        slippage: 1,
        walletAddress: "0xWallet",
        chainId: 1,
      };

      const mockResult: ExecutionResult = {
        intentId: "rebalance-multi",
        status: "completed",
        transactions: [
          { hash: "0xHash1", status: "confirmed", gasUsed: "100000" },
          { hash: "0xHash2", status: "confirmed", gasUsed: "120000" },
          { hash: "0xHash3", status: "confirmed", gasUsed: "90000" },
        ],
        executionTime: 5000,
      };

      (httpUtils.intentEngine.post as Mock).mockResolvedValue(mockResult);

      const result = await executeRebalance(mockIntent);

      expect(result.transactions).toHaveLength(3);
      expect(result.executionTime).toBe(5000);
    });
  });

  describe("executeDustZap", () => {
    it("should execute dust zap successfully", async () => {
      const mockDustTokens: DustTokenParams[] = [
        {
          address: "0xTokenA",
          symbol: "TKNA",
          amount: 100,
          price: 1.5,
          decimals: 18,
          raw_amount_hex_str: "0x56bc75e2d63100000",
        },
        {
          address: "0xTokenB",
          symbol: "TKNB",
          amount: 50,
          price: 2.0,
          decimals: 6,
          raw_amount_hex_str: "0x2faf080",
        },
      ];

      const mockParams = {
        slippage: 0.5,
        dustTokens: mockDustTokens,
        toTokenAddress: "0xETHAddress",
        toTokenDecimals: 18,
      };

      const mockResult = { intentId: "intent-dust-005" };

      (httpUtils.intentEngine.post as Mock).mockResolvedValue(mockResult);

      const result = await executeDustZap(
        "0x1234567890123456789012345678901234567890",
        1,
        mockParams
      );

      expect(httpUtils.intentEngine.post).toHaveBeenCalledWith(
        "/api/v1/intents/dustZap",
        {
          userAddress: "0x1234567890123456789012345678901234567890",
          chainId: 1,
          params: mockParams,
        }
      );
      expect(result).toEqual(mockResult);
    });

    it("should handle empty dust tokens array", async () => {
      const mockParams = {
        slippage: 0.5,
        dustTokens: [],
        toTokenAddress: "0xETHAddress",
        toTokenDecimals: 18,
      };

      const mockResult = { intentId: "intent-dust-empty" };

      (httpUtils.intentEngine.post as Mock).mockResolvedValue(mockResult);

      const result = await executeDustZap("0xWallet", 1, mockParams);

      expect(result).toEqual(mockResult);
      expect(httpUtils.intentEngine.post).toHaveBeenCalledWith(
        "/api/v1/intents/dustZap",
        expect.objectContaining({
          params: expect.objectContaining({
            dustTokens: [],
          }),
        })
      );
    });

    it("should use correct API endpoint", async () => {
      const mockParams = {
        slippage: 1,
        dustTokens: [],
        toTokenAddress: "0xETH",
        toTokenDecimals: 18,
      };

      (httpUtils.intentEngine.post as Mock).mockResolvedValue({
        intentId: "test",
      });

      await executeDustZap("0xWallet", 137, mockParams);

      expect(httpUtils.intentEngine.post).toHaveBeenCalledWith(
        "/api/v1/intents/dustZap",
        expect.any(Object)
      );
    });
  });

  describe("executeUnifiedZap", () => {
    it("should execute unified zap successfully", async () => {
      const mockRequest: UnifiedZapRequest = {
        userAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
        chainId: 8453,
        params: {
          strategyAllocations: [
            { strategyId: "strategy-1", percentage: 50 },
            { strategyId: "strategy-2", percentage: 30 },
            { strategyId: "strategy-3", percentage: 20 },
          ],
          inputToken: "0xUSDCAddress",
          inputAmount: "10000000000",
          slippage: 1.0,
        },
      };

      const mockResponse: UnifiedZapResponse = {
        success: true,
        intentType: "unifiedZap",
        mode: "streaming",
        intentId: "intent-unified-006",
        streamUrl: "wss://stream.example.com/intent-unified-006",
        metadata: {
          totalStrategies: 3,
          totalProtocols: 7,
          estimatedDuration: "45s",
          streamingEnabled: true,
        },
      };

      (httpUtils.intentEngine.post as Mock).mockResolvedValue(mockResponse);

      const result = await executeUnifiedZap(mockRequest);

      expect(httpUtils.intentEngine.post).toHaveBeenCalledWith(
        "/api/v1/intents/unifiedZap",
        mockRequest
      );
      expect(result).toEqual(mockResponse);
      expect(result.metadata.totalStrategies).toBe(3);
      expect(result.streamUrl).toBeDefined();
    });

    it("should pass request through without modification", async () => {
      const mockRequest: UnifiedZapRequest = {
        userAddress: "0xUser",
        chainId: 1,
        params: {
          strategyAllocations: [{ strategyId: "strat-1", percentage: 100 }],
          inputToken: "0xToken",
          inputAmount: "1000",
          slippage: 0.5,
        },
      };

      (httpUtils.intentEngine.post as Mock).mockResolvedValue({
        success: true,
        intentType: "unifiedZap",
        mode: "streaming",
        intentId: "test",
        streamUrl: "wss://test",
        metadata: {
          totalStrategies: 1,
          totalProtocols: 1,
          estimatedDuration: "10s",
          streamingEnabled: true,
        },
      });

      await executeUnifiedZap(mockRequest);

      const callArgs = (httpUtils.intentEngine.post as Mock).mock.calls[0];
      expect(callArgs[1]).toEqual(mockRequest);
    });

    it("should handle streaming metadata correctly", async () => {
      const mockRequest: UnifiedZapRequest = {
        userAddress: "0xUser",
        chainId: 1,
        params: {
          strategyAllocations: [],
          inputToken: "0xToken",
          inputAmount: "100",
          slippage: 1,
        },
      };

      const mockResponse: UnifiedZapResponse = {
        success: true,
        intentType: "unifiedZap",
        mode: "streaming",
        intentId: "streaming-test",
        streamUrl: "wss://stream.test",
        metadata: {
          totalStrategies: 5,
          totalProtocols: 12,
          estimatedDuration: "2m",
          streamingEnabled: true,
        },
      };

      (httpUtils.intentEngine.post as Mock).mockResolvedValue(mockResponse);

      const result = await executeUnifiedZap(mockRequest);

      expect(result.metadata.totalProtocols).toBe(12);
      expect(result.metadata.streamingEnabled).toBe(true);
      expect(result.mode).toBe("streaming");
    });
  });

  describe("getIntentStatus", () => {
    it("should get intent status successfully", async () => {
      const mockStatus: IntentStatus = {
        intentId: "intent-status-007",
        status: "processing",
        progress: 65,
        currentStep: "Executing swap on Uniswap",
        estimatedTimeRemaining: 30,
        transactions: [
          {
            hash: "0xtxhash005",
            status: "confirmed",
            blockNumber: 12345678,
          },
          {
            hash: "0xtxhash006",
            status: "pending",
          },
        ],
      };

      (httpUtils.intentEngine.get as Mock).mockResolvedValue(mockStatus);

      const result = await getIntentStatus("intent-status-007");

      expect(httpUtils.intentEngine.get).toHaveBeenCalledWith(
        "/intents/intent-status-007/status"
      );
      expect(result).toEqual(mockStatus);
      expect(result.progress).toBe(65);
    });

    it("should use correct endpoint with intentId parameter", async () => {
      const intentId = "test-intent-id-123";

      (httpUtils.intentEngine.get as Mock).mockResolvedValue({
        intentId,
        status: "completed",
        progress: 100,
        transactions: [],
      });

      await getIntentStatus(intentId);

      expect(httpUtils.intentEngine.get).toHaveBeenCalledWith(
        `/intents/${intentId}/status`
      );
    });

    it("should handle completed status with full progress", async () => {
      const mockStatus: IntentStatus = {
        intentId: "completed-intent",
        status: "completed",
        progress: 100,
        currentStep: "Completed",
        transactions: [
          {
            hash: "0xCompleted",
            status: "confirmed",
            blockNumber: 99999,
          },
        ],
      };

      (httpUtils.intentEngine.get as Mock).mockResolvedValue(mockStatus);

      const result = await getIntentStatus("completed-intent");

      expect(result.status).toBe("completed");
      expect(result.progress).toBe(100);
    });

    it("should handle failed status", async () => {
      const mockStatus: IntentStatus = {
        intentId: "failed-intent",
        status: "failed",
        progress: 50,
        currentStep: "Transaction reverted",
        transactions: [
          {
            hash: "0xFailed",
            status: "failed",
          },
        ],
      };

      (httpUtils.intentEngine.get as Mock).mockResolvedValue(mockStatus);

      const result = await getIntentStatus("failed-intent");

      expect(result.status).toBe("failed");
      expect(result.transactions[0].status).toBe("failed");
    });
  });

  describe("getUserIntentHistory", () => {
    it("should get user intent history successfully with default params", async () => {
      const mockHistory = {
        intents: [
          {
            intentId: "history-001",
            status: "completed" as const,
            transactions: [
              {
                hash: "0xHash1",
                status: "confirmed" as const,
              },
            ],
          },
          {
            intentId: "history-002",
            status: "failed" as const,
            transactions: [
              {
                hash: "0xHash2",
                status: "failed" as const,
              },
            ],
          },
        ],
        total: 2,
        hasMore: false,
      };

      (httpUtils.intentEngine.get as Mock).mockResolvedValue(mockHistory);

      const result = await getUserIntentHistory(
        "0x1234567890123456789012345678901234567890"
      );

      expect(httpUtils.intentEngine.get).toHaveBeenCalledWith(
        "/intents/history?wallet=0x1234567890123456789012345678901234567890&offset=0"
      );
      expect(result).toEqual(mockHistory);
      expect(result.intents).toHaveLength(2);
    });

    it("should handle custom limit and offset parameters", async () => {
      const mockHistory = {
        intents: [],
        total: 100,
        hasMore: true,
      };

      (httpUtils.intentEngine.get as Mock).mockResolvedValue(mockHistory);

      await getUserIntentHistory("0xWalletAddress", 40);

      expect(httpUtils.intentEngine.get).toHaveBeenCalledWith(
        "/intents/history?wallet=0xWalletAddress&offset=40"
      );
    });

    it("should build query string correctly", async () => {
      (httpUtils.intentEngine.get as Mock).mockResolvedValue({
        intents: [],
        total: 0,
        hasMore: false,
      });

      await getUserIntentHistory("0xABC", 5);

      const callUrl = (httpUtils.intentEngine.get as Mock).mock.calls[0][0];
      expect(callUrl).toContain("wallet=0xABC");
      expect(callUrl).toContain("offset=5");
    });

    it("should handle empty history", async () => {
      const mockEmptyHistory = {
        intents: [],
        total: 0,
        hasMore: false,
      };

      (httpUtils.intentEngine.get as Mock).mockResolvedValue(mockEmptyHistory);

      const result = await getUserIntentHistory("0xEmptyWallet");

      expect(result.intents).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.hasMore).toBe(false);
    });

    it("should handle pagination with hasMore flag", async () => {
      const mockHistory = {
        intents: Array.from({ length: 50 }, (_, i) => ({
          intentId: `intent-${i}`,
          status: "completed" as const,
          transactions: [],
        })),
        total: 150,
        hasMore: true,
      };

      (httpUtils.intentEngine.get as Mock).mockResolvedValue(mockHistory);

      const result = await getUserIntentHistory("0xWallet", 50, 0);

      expect(result.hasMore).toBe(true);
      expect(result.total).toBe(150);
    });
  });

  describe("getStrategies", () => {
    it("should get strategies successfully", async () => {
      const mockStrategiesResponse: StrategiesApiResponse = {
        success: true,
        strategies: [
          {
            id: "btc-strategy",
            displayName: "Bitcoin Yield",
            description: "Optimize BTC holdings for maximum yield",
            targetAssets: ["BTC", "WBTC"],
            chains: ["ethereum", "base"],
            protocolCount: 5,
            enabledProtocolCount: 3,
            protocols: [
              {
                name: "Aave V3",
                protocol: "aave-v3",
                chain: "ethereum",
                weight: 60,
                targetTokens: ["wbtc"],
              },
              {
                name: "Compound",
                protocol: "compound",
                chain: "ethereum",
                weight: 40,
                targetTokens: ["wbtc"],
              },
            ],
          },
          {
            id: "stablecoin-strategy",
            displayName: "Stablecoin Yield",
            description: "Maximize stablecoin returns",
            targetAssets: ["USDC", "USDT", "DAI"],
            chains: ["base", "polygon"],
            protocolCount: 8,
            enabledProtocolCount: 6,
          },
        ],
        total: 2,
        supportedChains: ["ethereum", "base", "polygon"],
        lastUpdated: "2025-01-17T12:00:00Z",
      };

      (httpUtils.intentEngine.get as Mock).mockResolvedValue(
        mockStrategiesResponse
      );

      const result = await getStrategies();

      expect(httpUtils.intentEngine.get).toHaveBeenCalledWith(
        "/api/v1/strategies"
      );
      expect(result).toEqual(mockStrategiesResponse);
      expect(result.strategies).toHaveLength(2);
      expect(result.success).toBe(true);
    });

    it("should use correct API endpoint", async () => {
      (httpUtils.intentEngine.get as Mock).mockResolvedValue({
        success: true,
        strategies: [],
        total: 0,
        supportedChains: [],
        lastUpdated: "2025-01-17T12:00:00Z",
      });

      await getStrategies();

      expect(httpUtils.intentEngine.get).toHaveBeenCalledWith(
        "/api/v1/strategies"
      );
    });

    it("should handle strategies with protocol breakdown", async () => {
      const mockResponse: StrategiesApiResponse = {
        success: true,
        strategies: [
          {
            id: "eth-strategy",
            displayName: "Ethereum Staking",
            description: "Stake ETH across protocols",
            targetAssets: ["ETH"],
            chains: ["ethereum"],
            protocolCount: 3,
            enabledProtocolCount: 3,
            protocols: [
              {
                name: "Lido",
                protocol: "lido",
                chain: "ethereum",
                weight: 50,
                targetTokens: ["eth"],
              },
              {
                name: "Rocket Pool",
                protocol: "rocket-pool",
                chain: "ethereum",
                weight: 30,
                targetTokens: ["eth"],
              },
              {
                name: "Frax Ether",
                protocol: "frax-ether",
                chain: "ethereum",
                weight: 20,
                targetTokens: ["eth"],
              },
            ],
          },
        ],
        total: 1,
        supportedChains: ["ethereum"],
        lastUpdated: "2025-01-17T12:00:00Z",
      };

      (httpUtils.intentEngine.get as Mock).mockResolvedValue(mockResponse);

      const result = await getStrategies();

      expect(result.strategies[0].protocols).toHaveLength(3);
      expect(result.strategies[0].protocols![0].weight).toBe(50);
    });

    it("should handle strategies without protocol breakdown", async () => {
      const mockResponse: StrategiesApiResponse = {
        success: true,
        strategies: [
          {
            id: "simple-strategy",
            displayName: "Simple Strategy",
            description: "Basic strategy",
            targetAssets: ["USDC"],
            chains: ["base"],
            protocolCount: 2,
            enabledProtocolCount: 1,
          },
        ],
        total: 1,
        supportedChains: ["base"],
        lastUpdated: "2025-01-17T12:00:00Z",
      };

      (httpUtils.intentEngine.get as Mock).mockResolvedValue(mockResponse);

      const result = await getStrategies();

      expect(result.strategies[0].protocols).toBeUndefined();
    });
  });

  describe("checkIntentServiceHealth", () => {
    it("should check service health successfully", async () => {
      const mockHealthResponse = {
        status: "healthy",
        timestamp: "2025-01-17T12:00:00.000Z",
        processingQueue: 3,
      };

      (httpUtils.intentEngine.get as Mock).mockResolvedValue(
        mockHealthResponse
      );

      const result = await checkIntentServiceHealth();

      expect(httpUtils.intentEngine.get).toHaveBeenCalledWith("/health");
      expect(result).toEqual(mockHealthResponse);
      expect(result.status).toBe("healthy");
      expect(result.processingQueue).toBe(3);
    });

    it("should use correct endpoint", async () => {
      (httpUtils.intentEngine.get as Mock).mockResolvedValue({
        status: "healthy",
        timestamp: "2025-01-17T12:00:00.000Z",
        processingQueue: 0,
      });

      await checkIntentServiceHealth();

      expect(httpUtils.intentEngine.get).toHaveBeenCalledWith("/health");
    });

    it("should handle degraded service status", async () => {
      const mockDegradedResponse = {
        status: "degraded",
        timestamp: "2025-01-17T12:00:00.000Z",
        processingQueue: 150,
      };

      (httpUtils.intentEngine.get as Mock).mockResolvedValue(
        mockDegradedResponse
      );

      const result = await checkIntentServiceHealth();

      expect(result.status).toBe("degraded");
      expect(result.processingQueue).toBe(150);
    });

    it("should include timestamp in response", async () => {
      const fixedTimestamp = "2025-01-17T14:30:00.000Z";

      (httpUtils.intentEngine.get as Mock).mockResolvedValue({
        status: "healthy",
        timestamp: fixedTimestamp,
        processingQueue: 0,
      });

      const result = await checkIntentServiceHealth();

      expect(result.timestamp).toBe(fixedTimestamp);
    });
  });

  describe("Error Handling Integration", () => {
    it("should wrap all calls with executeServiceCall", async () => {
      const mockFunctions = [
        () =>
          executeSwap({
            amount: "1",
            slippage: 1,
            walletAddress: "0x",
            chainId: 1,
          }),
        () =>
          executeZapIn({
            amount: "1",
            slippage: 1,
            walletAddress: "0x",
            chainId: 1,
          }),
        () =>
          executeZapOut({
            amount: "1",
            slippage: 1,
            walletAddress: "0x",
            chainId: 1,
          }),
        () =>
          executeRebalance({
            amount: "1",
            slippage: 1,
            walletAddress: "0x",
            chainId: 1,
          }),
        () =>
          executeDustZap("0x", 1, {
            slippage: 1,
            dustTokens: [],
            toTokenAddress: "0x",
            toTokenDecimals: 18,
          }),
        () =>
          executeUnifiedZap({
            userAddress: "0x",
            chainId: 1,
            params: {
              strategyAllocations: [],
              inputToken: "0x",
              inputAmount: "1",
              slippage: 1,
            },
          }),
        () => getIntentStatus("intent-id"),
        () => getUserIntentHistory("0xWallet"),
        () => getStrategies(),
        () => checkIntentServiceHealth(),
      ];

      // Mock all responses
      (httpUtils.intentEngine.post as Mock).mockResolvedValue({
        intentId: "test",
        status: "pending",
        transactions: [],
      });
      (httpUtils.intentEngine.get as Mock).mockResolvedValue({
        status: "healthy",
        timestamp: "now",
        processingQueue: 0,
      });

      for (const fn of mockFunctions) {
        await fn();
      }

      expect(executeServiceCall).toHaveBeenCalledTimes(10);
    });

    it("should pass through errors from HTTP layer", async () => {
      const networkError = new Error("Connection timeout");
      (httpUtils.intentEngine.post as Mock).mockRejectedValue(networkError);

      (executeServiceCall as Mock).mockImplementation(async call => {
        return await call();
      });

      await expect(
        executeSwap({
          amount: "1",
          slippage: 1,
          walletAddress: "0x",
          chainId: 1,
        })
      ).rejects.toThrow("Connection timeout");
    });
  });

  describe("Type Safety and Data Integrity", () => {
    it("should preserve ExecutionResult structure", async () => {
      const mockResult: ExecutionResult = {
        intentId: "test-intent",
        status: "completed",
        transactions: [
          {
            hash: "0xHash",
            status: "confirmed",
            gasUsed: "100000",
            effectiveGasPrice: "20000000000",
          },
        ],
        executionTime: 3000,
        error: undefined,
      };

      (httpUtils.intentEngine.post as Mock).mockResolvedValue(mockResult);

      const result = await executeSwap({
        amount: "100",
        slippage: 1,
        walletAddress: "0xWallet",
        chainId: 1,
      });

      expect(result).toHaveProperty("intentId");
      expect(result).toHaveProperty("status");
      expect(result).toHaveProperty("transactions");
      expect(result.transactions[0]).toHaveProperty("hash");
      expect(result.transactions[0]).toHaveProperty("status");
    });

    it("should handle all status types", async () => {
      const statuses: ("pending" | "processing" | "completed" | "failed")[] = [
        "pending",
        "processing",
        "completed",
        "failed",
      ];

      for (const status of statuses) {
        (httpUtils.intentEngine.get as Mock).mockResolvedValue({
          intentId: "test",
          status,
          progress: 0,
          transactions: [],
        });

        const result = await getIntentStatus("test");
        expect(result.status).toBe(status);
      }
    });

    it("should handle all priority types", async () => {
      const priorities: ("fast" | "normal" | "slow")[] = [
        "fast",
        "normal",
        "slow",
      ];

      (httpUtils.intentEngine.post as Mock).mockResolvedValue({
        intentId: "test",
        status: "pending",
        transactions: [],
      });

      for (const priority of priorities) {
        await executeSwap({
          amount: "100",
          slippage: 1,
          walletAddress: "0xWallet",
          chainId: 1,
          priority,
        });

        const callArgs = (httpUtils.intentEngine.post as Mock).mock.calls[
          (httpUtils.intentEngine.post as Mock).mock.calls.length - 1
        ][1];
        expect(callArgs.priority).toBe(priority);
      }
    });
  });

  describe("Edge Cases and Boundary Conditions", () => {
    it("should handle very large amounts", async () => {
      const largeAmount = "999999999999999999999999999999";

      (httpUtils.intentEngine.post as Mock).mockResolvedValue({
        intentId: "large-amount",
        status: "pending",
        transactions: [],
      });

      await executeSwap({
        amount: largeAmount,
        slippage: 1,
        walletAddress: "0xWallet",
        chainId: 1,
      });

      const callArgs = (httpUtils.intentEngine.post as Mock).mock.calls[0][1];
      expect(callArgs.amount).toBe(largeAmount);
    });

    it("should handle minimum slippage", async () => {
      (httpUtils.intentEngine.post as Mock).mockResolvedValue({
        intentId: "min-slippage",
        status: "pending",
        transactions: [],
      });

      await executeSwap({
        amount: "100",
        slippage: 0.01,
        walletAddress: "0xWallet",
        chainId: 1,
      });

      const callArgs = (httpUtils.intentEngine.post as Mock).mock.calls[0][1];
      expect(callArgs.slippage).toBe(0.01);
    });

    it("should handle maximum slippage", async () => {
      (httpUtils.intentEngine.post as Mock).mockResolvedValue({
        intentId: "max-slippage",
        status: "pending",
        transactions: [],
      });

      await executeSwap({
        amount: "100",
        slippage: 50,
        walletAddress: "0xWallet",
        chainId: 1,
      });

      const callArgs = (httpUtils.intentEngine.post as Mock).mock.calls[0][1];
      expect(callArgs.slippage).toBe(50);
    });

    it("should handle empty strategy allocations", async () => {
      const mockRequest: UnifiedZapRequest = {
        userAddress: "0xUser",
        chainId: 1,
        params: {
          strategyAllocations: [],
          inputToken: "0xToken",
          inputAmount: "100",
          slippage: 1,
        },
      };

      (httpUtils.intentEngine.post as Mock).mockResolvedValue({
        success: true,
        intentType: "unifiedZap",
        mode: "streaming",
        intentId: "empty-allocations",
        streamUrl: "wss://test",
        metadata: {
          totalStrategies: 0,
          totalProtocols: 0,
          estimatedDuration: "0s",
          streamingEnabled: false,
        },
      });

      const result = await executeUnifiedZap(mockRequest);

      expect(result.metadata.totalStrategies).toBe(0);
    });

    it("should handle zero offset in pagination", async () => {
      (httpUtils.intentEngine.get as Mock).mockResolvedValue({
        intents: [],
        total: 0,
        hasMore: false,
      });

      await getUserIntentHistory("0xWallet", 0);

      const callUrl = (httpUtils.intentEngine.get as Mock).mock.calls[0][0];
      expect(callUrl).toContain("offset=0");
    });

    it("should handle large offset in pagination", async () => {
      (httpUtils.intentEngine.get as Mock).mockResolvedValue({
        intents: [],
        total: 0,
        hasMore: false,
      });

      await getUserIntentHistory("0xWallet", 1000);

      const callUrl = (httpUtils.intentEngine.get as Mock).mock.calls[0][0];
      expect(callUrl).toContain("offset=1000");
    });
  });
});
