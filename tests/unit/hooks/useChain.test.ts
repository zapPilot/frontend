/**
 * Unit Tests for useChain Hook
 *
 * Tests the chain management hook functionality including:
 * - Chain retrieval from wallet
 * - Chain switching with validation
 * - Chain utilities (getChainInfo, getSupportedChains)
 * - Chain support validation
 * - Error handling
 * - Callback stability
 */

import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { renderHook } from "@testing-library/react";
import { useChain } from "@/hooks/useChain";
import { useWallet } from "@/hooks/useWallet";
import { chainUtils } from "@/types/wallet";

// Mock useWallet hook
vi.mock("@/hooks/useWallet", () => ({
  useWallet: vi.fn(),
}));

// Mock chain utilities from wallet types
vi.mock("@/types/wallet", () => ({
  chainUtils: {
    getChainInfo: vi.fn(),
    getSupportedChains: vi.fn(),
    isSupported: vi.fn(),
    getChainName: vi.fn(),
    getChainSymbol: vi.fn(),
  },
  SUPPORTED_CHAINS: {
    ETHEREUM: 1,
    ARBITRUM: 42161,
    BASE: 8453,
    OPTIMISM: 10,
  },
  CHAIN_INFO: {
    1: {
      id: 1,
      name: "Ethereum",
      symbol: "ETH",
      rpcUrl: "https://eth-mainnet.g.alchemy.com/v2/",
      blockExplorer: "https://etherscan.io",
      isTestnet: false,
    },
    42161: {
      id: 42161,
      name: "Arbitrum One",
      symbol: "ETH",
      rpcUrl: "https://arb1.arbitrum.io/rpc",
      blockExplorer: "https://arbiscan.io",
      isTestnet: false,
    },
    8453: {
      id: 8453,
      name: "Base",
      symbol: "ETH",
      rpcUrl: "https://mainnet.base.org",
      blockExplorer: "https://basescan.org",
      isTestnet: false,
    },
    10: {
      id: 10,
      name: "Optimism",
      symbol: "ETH",
      rpcUrl: "https://mainnet.optimism.io",
      blockExplorer: "https://optimistic.etherscan.io",
      isTestnet: false,
    },
  },
}));

describe("useChain Hook", () => {
  const mockUseWallet = useWallet as Mock;
  const mockGetChainInfo = chainUtils.getChainInfo as Mock;
  const mockGetSupportedChains = chainUtils.getSupportedChains as Mock;

  const mockChain = {
    id: 42161,
    name: "Arbitrum One",
    symbol: "ETH",
  };

  const mockSwitchChain = vi.fn().mockResolvedValue(undefined);
  const mockIsChainSupported = vi.fn();

  const mockWalletHooks = {
    chain: mockChain,
    switchChain: mockSwitchChain,
    isChainSupported: mockIsChainSupported,
    account: {
      address: "0x1234567890123456789012345678901234567890",
      isConnected: true,
      balance: "1.5",
    },
    connect: vi.fn(),
    disconnect: vi.fn(),
    isConnecting: false,
    isDisconnecting: false,
    isConnected: true,
    error: null,
    clearError: vi.fn(),
    signMessage: vi.fn(),
    getSupportedChains: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseWallet.mockReturnValue(mockWalletHooks);
    mockIsChainSupported.mockImplementation((chainId: number) => {
      const supportedIds = [42161, 8453, 10];
      return supportedIds.includes(chainId);
    });
    mockGetChainInfo.mockImplementation((chainId: number) => {
      const chainInfoMap: Record<number, any> = {
        1: {
          id: 1,
          name: "Ethereum",
          symbol: "ETH",
          rpcUrl: "https://eth-mainnet.g.alchemy.com/v2/",
          blockExplorer: "https://etherscan.io",
          isTestnet: false,
        },
        42161: {
          id: 42161,
          name: "Arbitrum One",
          symbol: "ETH",
          rpcUrl: "https://arb1.arbitrum.io/rpc",
          blockExplorer: "https://arbiscan.io",
          isTestnet: false,
        },
        8453: {
          id: 8453,
          name: "Base",
          symbol: "ETH",
          rpcUrl: "https://mainnet.base.org",
          blockExplorer: "https://basescan.org",
          isTestnet: false,
        },
        10: {
          id: 10,
          name: "Optimism",
          symbol: "ETH",
          rpcUrl: "https://mainnet.optimism.io",
          blockExplorer: "https://optimistic.etherscan.io",
          isTestnet: false,
        },
      };
      return chainInfoMap[chainId] || undefined;
    });
    mockGetSupportedChains.mockReturnValue([
      {
        id: 42161,
        name: "Arbitrum One",
        symbol: "ETH",
        rpcUrl: "https://arb1.arbitrum.io/rpc",
        blockExplorer: "https://arbiscan.io",
        isTestnet: false,
      },
      {
        id: 8453,
        name: "Base",
        symbol: "ETH",
        rpcUrl: "https://mainnet.base.org",
        blockExplorer: "https://basescan.org",
        isTestnet: false,
      },
      {
        id: 10,
        name: "Optimism",
        symbol: "ETH",
        rpcUrl: "https://mainnet.optimism.io",
        blockExplorer: "https://optimistic.etherscan.io",
        isTestnet: false,
      },
    ]);
  });

  describe("Chain Retrieval", () => {
    it("should return chain from useWallet", () => {
      const { result } = renderHook(() => useChain());

      expect(result.current.chain).toEqual(mockChain);
    });

    it("should return null when no chain is connected", () => {
      mockUseWallet.mockReturnValue({
        ...mockWalletHooks,
        chain: null,
      });

      const { result } = renderHook(() => useChain());

      expect(result.current.chain).toBeNull();
    });

    it("should update when chain changes", () => {
      const { result, rerender } = renderHook(() => useChain());

      expect(result.current.chain?.id).toBe(42161);

      // Switch to Base
      mockUseWallet.mockReturnValue({
        ...mockWalletHooks,
        chain: { id: 8453, name: "Base", symbol: "ETH" },
      });
      rerender();

      expect(result.current.chain?.id).toBe(8453);
    });
  });

  describe("Chain Switching", () => {
    it("should validate chain support before switching", async () => {
      mockIsChainSupported.mockReturnValue(true);

      const { result } = renderHook(() => useChain());

      await result.current.switchChain(8453);

      expect(mockIsChainSupported).toHaveBeenCalledWith(8453);
      expect(mockSwitchChain).toHaveBeenCalledWith(8453);
    });

    it("should throw error for unsupported chains", async () => {
      mockIsChainSupported.mockReturnValue(false);

      const { result } = renderHook(() => useChain());

      await expect(result.current.switchChain(1)).rejects.toThrow(
        "Chain 1 is not supported"
      );
      expect(mockSwitchChain).not.toHaveBeenCalled();
    });

    it("should call walletSwitchChain for supported chains", async () => {
      mockIsChainSupported.mockReturnValue(true);

      const { result } = renderHook(() => useChain());

      await result.current.switchChain(42161);

      expect(mockSwitchChain).toHaveBeenCalledWith(42161);
      expect(mockSwitchChain).toHaveBeenCalledTimes(1);
    });

    it("should handle switchChain errors from wallet", async () => {
      mockIsChainSupported.mockReturnValue(true);
      const error = new Error("User rejected chain switch");
      mockSwitchChain.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useChain());

      await expect(result.current.switchChain(8453)).rejects.toThrow(
        "User rejected chain switch"
      );
    });

    it("should validate multiple chain switches", async () => {
      mockIsChainSupported.mockImplementation((chainId: number) => {
        return [42161, 8453, 10].includes(chainId);
      });

      const { result } = renderHook(() => useChain());

      // Switch to Base
      await result.current.switchChain(8453);
      expect(mockSwitchChain).toHaveBeenCalledWith(8453);

      // Switch to Optimism
      await result.current.switchChain(10);
      expect(mockSwitchChain).toHaveBeenCalledWith(10);

      // Try unsupported chain
      mockIsChainSupported.mockReturnValue(false);
      await expect(result.current.switchChain(1)).rejects.toThrow(
        "Chain 1 is not supported"
      );
    });
  });

  describe("Chain Utilities", () => {
    it("should call chainUtils.getChainInfo", () => {
      const { result } = renderHook(() => useChain());

      const chainInfo = result.current.getChainInfo(42161);

      expect(mockGetChainInfo).toHaveBeenCalledWith(42161);
      expect(chainInfo).toEqual({
        id: 42161,
        name: "Arbitrum One",
        symbol: "ETH",
        rpcUrl: "https://arb1.arbitrum.io/rpc",
        blockExplorer: "https://arbiscan.io",
        isTestnet: false,
      });
    });

    it("should return undefined for unknown chain info", () => {
      mockGetChainInfo.mockReturnValue(undefined);

      const { result } = renderHook(() => useChain());

      const chainInfo = result.current.getChainInfo(999999);

      expect(mockGetChainInfo).toHaveBeenCalledWith(999999);
      expect(chainInfo).toBeUndefined();
    });

    it("should call chainUtils.getSupportedChains", () => {
      const { result } = renderHook(() => useChain());

      const supportedChains = result.current.getSupportedChains();

      expect(mockGetSupportedChains).toHaveBeenCalledTimes(1);
      expect(supportedChains).toHaveLength(3);
      expect(supportedChains[0]).toHaveProperty("id");
      expect(supportedChains[0]).toHaveProperty("name");
      expect(supportedChains[0]).toHaveProperty("symbol");
    });

    it("should return all supported chains with complete info", () => {
      const { result } = renderHook(() => useChain());

      const chains = result.current.getSupportedChains();

      expect(chains).toEqual([
        {
          id: 42161,
          name: "Arbitrum One",
          symbol: "ETH",
          rpcUrl: "https://arb1.arbitrum.io/rpc",
          blockExplorer: "https://arbiscan.io",
          isTestnet: false,
        },
        {
          id: 8453,
          name: "Base",
          symbol: "ETH",
          rpcUrl: "https://mainnet.base.org",
          blockExplorer: "https://basescan.org",
          isTestnet: false,
        },
        {
          id: 10,
          name: "Optimism",
          symbol: "ETH",
          rpcUrl: "https://mainnet.optimism.io",
          blockExplorer: "https://optimistic.etherscan.io",
          isTestnet: false,
        },
      ]);
    });
  });

  describe("Chain Support Validation", () => {
    it("should delegate isChainSupported to useWallet", () => {
      mockIsChainSupported.mockReturnValue(true);

      const { result } = renderHook(() => useChain());

      const isSupported = result.current.isChainSupported(42161);

      expect(isSupported).toBe(true);
      expect(mockIsChainSupported).toHaveBeenCalledWith(42161);
    });

    it("should return false for unsupported chains", () => {
      mockIsChainSupported.mockReturnValue(false);

      const { result } = renderHook(() => useChain());

      const isSupported = result.current.isChainSupported(1);

      expect(isSupported).toBe(false);
    });

    it("should check multiple chain IDs", () => {
      const { result } = renderHook(() => useChain());

      mockIsChainSupported.mockReturnValue(true);
      expect(result.current.isChainSupported(42161)).toBe(true);

      mockIsChainSupported.mockReturnValue(true);
      expect(result.current.isChainSupported(8453)).toBe(true);

      mockIsChainSupported.mockReturnValue(false);
      expect(result.current.isChainSupported(1)).toBe(false);
    });
  });

  describe("Hook Memoization", () => {
    it("should maintain stable callback references across re-renders", () => {
      const { result, rerender } = renderHook(() => useChain());

      const firstSwitchChain = result.current.switchChain;
      const firstGetChainInfo = result.current.getChainInfo;
      const firstGetSupportedChains = result.current.getSupportedChains;
      const firstIsChainSupported = result.current.isChainSupported;

      rerender();

      expect(result.current.switchChain).toBe(firstSwitchChain);
      expect(result.current.getChainInfo).toBe(firstGetChainInfo);
      expect(result.current.getSupportedChains).toBe(firstGetSupportedChains);
      expect(result.current.isChainSupported).toBe(firstIsChainSupported);
    });

    it("should update switchChain when walletSwitchChain changes", () => {
      const { result, rerender } = renderHook(() => useChain());

      const firstSwitchChain = result.current.switchChain;

      // Update wallet's switchChain function
      const newSwitchChain = vi.fn().mockResolvedValue(undefined);
      mockUseWallet.mockReturnValue({
        ...mockWalletHooks,
        switchChain: newSwitchChain,
      });
      rerender();

      expect(result.current.switchChain).not.toBe(firstSwitchChain);
    });

    it("should update switchChain when isChainSupported changes", () => {
      const { result, rerender } = renderHook(() => useChain());

      const firstSwitchChain = result.current.switchChain;

      // Update isChainSupported function
      const newIsChainSupported = vi.fn().mockReturnValue(false);
      mockUseWallet.mockReturnValue({
        ...mockWalletHooks,
        isChainSupported: newIsChainSupported,
      });
      rerender();

      expect(result.current.switchChain).not.toBe(firstSwitchChain);
    });

    it("should keep getChainInfo stable (no dependencies)", () => {
      const { result, rerender } = renderHook(() => useChain());

      const firstGetChainInfo = result.current.getChainInfo;

      // Change chain
      mockUseWallet.mockReturnValue({
        ...mockWalletHooks,
        chain: { id: 8453, name: "Base", symbol: "ETH" },
      });
      rerender();

      expect(result.current.getChainInfo).toBe(firstGetChainInfo);
    });

    it("should keep getSupportedChains stable (no dependencies)", () => {
      const { result, rerender } = renderHook(() => useChain());

      const firstGetSupportedChains = result.current.getSupportedChains;

      // Change chain
      mockUseWallet.mockReturnValue({
        ...mockWalletHooks,
        chain: { id: 8453, name: "Base", symbol: "ETH" },
      });
      rerender();

      expect(result.current.getSupportedChains).toBe(firstGetSupportedChains);
    });
  });

  describe("Edge Cases", () => {
    it("should handle null chain gracefully", () => {
      mockUseWallet.mockReturnValue({
        ...mockWalletHooks,
        chain: null,
      });

      const { result } = renderHook(() => useChain());

      expect(result.current.chain).toBeNull();
      expect(() => result.current.getChainInfo(42161)).not.toThrow();
      expect(() => result.current.getSupportedChains()).not.toThrow();
    });

    it("should handle chain ID 0", async () => {
      mockIsChainSupported.mockReturnValue(false);

      const { result } = renderHook(() => useChain());

      await expect(result.current.switchChain(0)).rejects.toThrow(
        "Chain 0 is not supported"
      );
    });

    it("should handle negative chain IDs", async () => {
      mockIsChainSupported.mockReturnValue(false);

      const { result } = renderHook(() => useChain());

      await expect(result.current.switchChain(-1)).rejects.toThrow(
        "Chain -1 is not supported"
      );
    });

    it("should handle very large chain IDs", () => {
      const largeChainId = 999999999;
      mockIsChainSupported.mockReturnValue(false);

      const { result } = renderHook(() => useChain());

      expect(result.current.isChainSupported(largeChainId)).toBe(false);
    });

    it("should handle chain with missing properties", () => {
      mockUseWallet.mockReturnValue({
        ...mockWalletHooks,
        chain: {
          id: 42161,
          name: "",
          symbol: "",
        },
      });

      const { result } = renderHook(() => useChain());

      expect(result.current.chain).toEqual({
        id: 42161,
        name: "",
        symbol: "",
      });
    });
  });

  describe("Error Scenarios", () => {
    it("should propagate wallet switchChain errors", async () => {
      mockIsChainSupported.mockReturnValue(true);
      const networkError = new Error("Network request failed");
      mockSwitchChain.mockRejectedValueOnce(networkError);

      const { result } = renderHook(() => useChain());

      await expect(result.current.switchChain(8453)).rejects.toThrow(
        "Network request failed"
      );
    });

    it("should handle chainUtils.getChainInfo errors", () => {
      mockGetChainInfo.mockImplementation(() => {
        throw new Error("Chain info not available");
      });

      const { result } = renderHook(() => useChain());

      expect(() => result.current.getChainInfo(42161)).toThrow(
        "Chain info not available"
      );
    });

    it("should handle chainUtils.getSupportedChains errors", () => {
      mockGetSupportedChains.mockImplementation(() => {
        throw new Error("Chains not available");
      });

      const { result } = renderHook(() => useChain());

      expect(() => result.current.getSupportedChains()).toThrow(
        "Chains not available"
      );
    });

    it("should create specific error message for each unsupported chain", async () => {
      mockIsChainSupported.mockReturnValue(false);

      const { result } = renderHook(() => useChain());

      await expect(result.current.switchChain(1)).rejects.toThrow(
        "Chain 1 is not supported"
      );
      await expect(result.current.switchChain(137)).rejects.toThrow(
        "Chain 137 is not supported"
      );
      await expect(result.current.switchChain(999)).rejects.toThrow(
        "Chain 999 is not supported"
      );
    });
  });

  describe("Integration Scenarios", () => {
    it("should work in complete chain switching workflow", async () => {
      mockIsChainSupported.mockReturnValue(true);

      const { result } = renderHook(() => useChain());

      // Check current chain
      expect(result.current.chain?.id).toBe(42161);

      // Get chain info
      const chainInfo = result.current.getChainInfo(8453);
      expect(chainInfo?.name).toBe("Base");

      // Switch chain
      await result.current.switchChain(8453);
      expect(mockSwitchChain).toHaveBeenCalledWith(8453);

      // Verify new chain
      mockUseWallet.mockReturnValue({
        ...mockWalletHooks,
        chain: { id: 8453, name: "Base", symbol: "ETH" },
      });
    });

    it("should support chain validation before switch", async () => {
      const { result } = renderHook(() => useChain());

      // Check if chain is supported
      mockIsChainSupported.mockReturnValue(true);
      const isSupported = result.current.isChainSupported(8453);
      expect(isSupported).toBe(true);

      // If supported, switch
      if (isSupported) {
        await result.current.switchChain(8453);
        expect(mockSwitchChain).toHaveBeenCalledWith(8453);
      }
    });

    it("should list all supported chains and get info for each", () => {
      const { result } = renderHook(() => useChain());

      const chains = result.current.getSupportedChains();

      chains.forEach(chain => {
        const info = result.current.getChainInfo(chain.id);
        expect(info).toBeDefined();
        expect(info?.id).toBe(chain.id);
      });
    });
  });
});
