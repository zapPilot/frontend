/**
 * Unit Tests for useWallet Hook
 *
 * Tests the wallet hook functionality including:
 * - Account management
 * - Chain management and switching
 * - Connection/disconnection
 * - Error handling
 * - Message signing
 * - Chain utilities
 */

import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, Mock, vi } from "vitest";

import { isChainSupported } from "@/config/chains";
import { useWallet } from "@/hooks/useWallet";
import { useWalletProvider } from "@/providers/WalletProvider";

// Mock the WalletProvider hook
vi.mock("@/providers/WalletProvider", () => ({
  useWalletProvider: vi.fn(),
}));

// Mock the chains config
vi.mock("@/config/chains", () => ({
  SUPPORTED_CHAINS: [
    {
      id: 42161,
      name: "Arbitrum One",
      symbol: "ARB",
      isSupported: true,
      rpcUrls: {
        default: { http: ["https://arb1.arbitrum.io/rpc"] },
      },
      blockExplorers: {
        default: { name: "Arbiscan", url: "https://arbiscan.io" },
      },
      iconUrl: "/chains/arbitrum.webp",
      nativeCurrency: {
        name: "Ether",
        symbol: "ETH",
        decimals: 18,
      },
    },
    {
      id: 8453,
      name: "Base",
      symbol: "BASE",
      isSupported: true,
      rpcUrls: {
        default: { http: ["https://mainnet.base.org"] },
      },
      blockExplorers: {
        default: { name: "Basescan", url: "https://basescan.org" },
      },
      iconUrl: "/chains/base.webp",
      nativeCurrency: {
        name: "Ether",
        symbol: "ETH",
        decimals: 18,
      },
    },
    {
      id: 10,
      name: "Optimism",
      symbol: "OP",
      isSupported: true,
      rpcUrls: {
        default: { http: ["https://mainnet.optimism.io"] },
      },
      blockExplorers: {
        default: { name: "Etherscan", url: "https://optimistic.etherscan.io" },
      },
      iconUrl: "/chains/optimism.webp",
      nativeCurrency: {
        name: "Ether",
        symbol: "ETH",
        decimals: 18,
      },
    },
  ],
  CHAIN_IDS: {
    ARBITRUM_ONE: 42161,
    BASE: 8453,
    OPTIMISM: 10,
  },
  isChainSupported: vi.fn((chainId: number) => {
    const supportedIds = [42161, 8453, 10];
    return supportedIds.includes(chainId);
  }),
}));

describe("useWallet Hook", () => {
  const mockUseWalletProvider = useWalletProvider as Mock;
  const mockIsChainSupported = isChainSupported as Mock;

  const mockWalletContext = {
    account: {
      address: "0x1234567890123456789012345678901234567890",
      isConnected: true,
      balance: "1.5",
    },
    chain: {
      id: 42161,
      name: "Arbitrum One",
      symbol: "ETH",
    },
    switchChain: vi.fn().mockResolvedValue(),
    connect: vi.fn().mockResolvedValue(),
    disconnect: vi.fn().mockResolvedValue(),
    isConnecting: false,
    isDisconnecting: false,
    isConnected: true,
    error: null,
    clearError: vi.fn(),
    signMessage: vi.fn().mockResolvedValue("0xsignature"),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseWalletProvider.mockReturnValue(mockWalletContext);
    mockIsChainSupported.mockImplementation((chainId: number) => {
      const supportedIds = [42161, 8453, 10];
      return supportedIds.includes(chainId);
    });
  });

  describe("Account Management", () => {
    it("should return account from wallet provider", () => {
      const { result } = renderHook(() => useWallet());

      expect(result.current.account).toEqual({
        address: "0x1234567890123456789012345678901234567890",
        isConnected: true,
        balance: "1.5",
      });
    });

    it("should return null account when disconnected", () => {
      mockUseWalletProvider.mockReturnValue({
        ...mockWalletContext,
        account: null,
        isConnected: false,
      });

      const { result } = renderHook(() => useWallet());

      expect(result.current.account).toBeNull();
      expect(result.current.isConnected).toBe(false);
    });

    it("should return account with balance", () => {
      const { result } = renderHook(() => useWallet());

      expect(result.current.account?.balance).toBe("1.5");
    });

    it("should return account without balance when not available", () => {
      mockUseWalletProvider.mockReturnValue({
        ...mockWalletContext,
        account: {
          address: "0x1234567890123456789012345678901234567890",
          isConnected: true,
        },
      });

      const { result } = renderHook(() => useWallet());

      expect(result.current.account?.balance).toBeUndefined();
    });
  });

  describe("Chain Management", () => {
    it("should return chain from wallet provider", () => {
      const { result } = renderHook(() => useWallet());

      expect(result.current.chain).toEqual({
        id: 42161,
        name: "Arbitrum One",
        symbol: "ETH",
      });
    });

    it("should return null chain when not connected", () => {
      mockUseWalletProvider.mockReturnValue({
        ...mockWalletContext,
        chain: null,
      });

      const { result } = renderHook(() => useWallet());

      expect(result.current.chain).toBeNull();
    });

    it("should call switchChain from wallet provider", async () => {
      const { result } = renderHook(() => useWallet());

      await result.current.switchChain(8453);

      expect(mockWalletContext.switchChain).toHaveBeenCalledWith(8453);
      expect(mockWalletContext.switchChain).toHaveBeenCalledTimes(1);
    });

    it("should handle switchChain errors", async () => {
      const error = new Error("Failed to switch chain");
      mockWalletContext.switchChain.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useWallet());

      await expect(result.current.switchChain(8453)).rejects.toThrow(
        "Failed to switch chain"
      );
    });
  });

  describe("Connection Management", () => {
    it("should call connect from wallet provider", async () => {
      const { result } = renderHook(() => useWallet());

      await result.current.connect();

      expect(mockWalletContext.connect).toHaveBeenCalledTimes(1);
    });

    it("should call disconnect from wallet provider", async () => {
      const { result } = renderHook(() => useWallet());

      await result.current.disconnect();

      expect(mockWalletContext.disconnect).toHaveBeenCalledTimes(1);
    });

    it("should return isConnecting state", () => {
      mockUseWalletProvider.mockReturnValue({
        ...mockWalletContext,
        isConnecting: true,
      });

      const { result } = renderHook(() => useWallet());

      expect(result.current.isConnecting).toBe(true);
    });

    it("should return isDisconnecting state", () => {
      mockUseWalletProvider.mockReturnValue({
        ...mockWalletContext,
        isDisconnecting: true,
      });

      const { result } = renderHook(() => useWallet());

      expect(result.current.isDisconnecting).toBe(true);
    });

    it("should return isConnected state", () => {
      const { result } = renderHook(() => useWallet());

      expect(result.current.isConnected).toBe(true);
    });

    it("should handle connect errors", async () => {
      const error = new Error("Failed to connect");
      mockWalletContext.connect.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useWallet());

      await expect(result.current.connect()).rejects.toThrow(
        "Failed to connect"
      );
    });

    it("should handle disconnect errors", async () => {
      const error = new Error("Failed to disconnect");
      mockWalletContext.disconnect.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useWallet());

      await expect(result.current.disconnect()).rejects.toThrow(
        "Failed to disconnect"
      );
    });
  });

  describe("Error Handling", () => {
    it("should return error from wallet provider", () => {
      const mockError = {
        message: "Connection failed",
        code: "CONNECTION_ERROR",
      };
      mockUseWalletProvider.mockReturnValue({
        ...mockWalletContext,
        error: mockError,
      });

      const { result } = renderHook(() => useWallet());

      expect(result.current.error).toEqual(mockError);
    });

    it("should call clearError from wallet provider", () => {
      const { result } = renderHook(() => useWallet());

      result.current.clearError();

      expect(mockWalletContext.clearError).toHaveBeenCalledTimes(1);
    });

    it("should return null error when no error", () => {
      const { result } = renderHook(() => useWallet());

      expect(result.current.error).toBeNull();
    });
  });

  describe("Message Signing", () => {
    it("should sign message successfully", async () => {
      const { result } = renderHook(() => useWallet());

      const signature = await result.current.signMessage("Hello World");

      expect(signature).toBe("0xsignature");
      expect(mockWalletContext.signMessage).toHaveBeenCalledWith("Hello World");
      expect(mockWalletContext.signMessage).toHaveBeenCalledTimes(1);
    });

    it("should handle signMessage errors", async () => {
      const error = new Error("Failed to sign message");
      mockWalletContext.signMessage.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useWallet());

      await expect(result.current.signMessage("Test")).rejects.toThrow(
        "Failed to sign message"
      );
    });
  });

  describe("Chain Utilities", () => {
    it("should check if chain is supported (supported chain)", () => {
      const { result } = renderHook(() => useWallet());

      expect(result.current.isChainSupported(42161)).toBe(true);
      expect(result.current.isChainSupported(8453)).toBe(true);
      expect(result.current.isChainSupported(10)).toBe(true);
    });

    it("should check if chain is supported (unsupported chain)", () => {
      mockIsChainSupported.mockReturnValue(false);

      const { result } = renderHook(() => useWallet());

      expect(result.current.isChainSupported(1)).toBe(false);
      expect(result.current.isChainSupported(137)).toBe(false);
    });

    it("should return supported chains list", () => {
      const { result } = renderHook(() => useWallet());

      const supportedChains = result.current.getSupportedChains();

      expect(supportedChains).toHaveLength(3);
      expect(supportedChains).toEqual([
        { id: 42161, name: "Arbitrum One", symbol: "ARB" },
        { id: 8453, name: "Base", symbol: "BASE" },
        { id: 10, name: "Optimism", symbol: "OP" },
      ]);
    });

    it("should return formatted supported chains", () => {
      const { result } = renderHook(() => useWallet());

      const chains = result.current.getSupportedChains();

      for (const chain of chains) {
        expect(chain).toHaveProperty("id");
        expect(chain).toHaveProperty("name");
        expect(chain).toHaveProperty("symbol");
        expect(typeof chain.id).toBe("number");
        expect(typeof chain.name).toBe("string");
        expect(typeof chain.symbol).toBe("string");
      }
    });
  });

  describe("Edge Cases", () => {
    it("should handle null wallet context gracefully", () => {
      mockUseWalletProvider.mockReturnValue({
        ...mockWalletContext,
        account: null,
        chain: null,
        isConnected: false,
      });

      const { result } = renderHook(() => useWallet());

      expect(result.current.account).toBeNull();
      expect(result.current.chain).toBeNull();
      expect(result.current.isConnected).toBe(false);
    });

    it("should handle partial account data", () => {
      mockUseWalletProvider.mockReturnValue({
        ...mockWalletContext,
        account: {
          address: "0x1234567890123456789012345678901234567890",
          isConnected: true,
          // balance is undefined
        },
      });

      const { result } = renderHook(() => useWallet());

      expect(result.current.account).toBeDefined();
      expect(result.current.account?.address).toBe(
        "0x1234567890123456789012345678901234567890"
      );
      expect(result.current.account?.isConnected).toBe(true);
      expect(result.current.account?.balance).toBeUndefined();
    });

    it("should handle chain with missing symbol", () => {
      mockUseWalletProvider.mockReturnValue({
        ...mockWalletContext,
        chain: {
          id: 42161,
          name: "Arbitrum One",
          symbol: "",
        },
      });

      const { result } = renderHook(() => useWallet());

      expect(result.current.chain?.symbol).toBe("");
    });
  });

  describe("Hook Stability", () => {
    it("should maintain stable function references from context", () => {
      const { result, rerender } = renderHook(() => useWallet());

      const firstConnect = result.current.connect;
      const firstDisconnect = result.current.disconnect;
      const firstSwitchChain = result.current.switchChain;
      const firstSignMessage = result.current.signMessage;
      const firstClearError = result.current.clearError;

      rerender();

      // Context functions should remain stable
      expect(result.current.connect).toBe(firstConnect);
      expect(result.current.disconnect).toBe(firstDisconnect);
      expect(result.current.switchChain).toBe(firstSwitchChain);
      expect(result.current.signMessage).toBe(firstSignMessage);
      expect(result.current.clearError).toBe(firstClearError);
    });

    it("should create new utility function instances on each render", () => {
      const { result, rerender } = renderHook(() => useWallet());

      const firstIsChainSupported = result.current.isChainSupported;
      const firstGetSupportedChains = result.current.getSupportedChains;

      rerender();

      // Utility functions are recreated (not memoized in implementation)
      expect(result.current.isChainSupported).not.toBe(firstIsChainSupported);
      expect(result.current.getSupportedChains).not.toBe(
        firstGetSupportedChains
      );

      // But they should have the same behavior
      expect(result.current.isChainSupported(42161)).toBe(
        firstIsChainSupported(42161)
      );
      expect(result.current.getSupportedChains()).toEqual(
        firstGetSupportedChains()
      );
    });
  });

  describe("State Transitions", () => {
    it("should transition from disconnected to connected", () => {
      const { result, rerender } = renderHook(() => useWallet());

      // Initially disconnected
      mockUseWalletProvider.mockReturnValue({
        ...mockWalletContext,
        account: null,
        chain: null,
        isConnected: false,
      });
      rerender();

      expect(result.current.isConnected).toBe(false);

      // After connection
      mockUseWalletProvider.mockReturnValue(mockWalletContext);
      rerender();

      expect(result.current.isConnected).toBe(true);
      expect(result.current.account).toBeDefined();
    });

    it("should transition from connected to disconnected", () => {
      const { result, rerender } = renderHook(() => useWallet());

      // Initially connected
      expect(result.current.isConnected).toBe(true);

      // After disconnection
      mockUseWalletProvider.mockReturnValue({
        ...mockWalletContext,
        account: null,
        chain: null,
        isConnected: false,
      });
      rerender();

      expect(result.current.isConnected).toBe(false);
      expect(result.current.account).toBeNull();
    });

    it("should show connecting state", () => {
      mockUseWalletProvider.mockReturnValue({
        ...mockWalletContext,
        isConnecting: true,
        account: null,
      });

      const { result } = renderHook(() => useWallet());

      expect(result.current.isConnecting).toBe(true);
      expect(result.current.isConnected).toBe(true); // Context still reports true
    });

    it("should show disconnecting state", () => {
      mockUseWalletProvider.mockReturnValue({
        ...mockWalletContext,
        isDisconnecting: true,
      });

      const { result } = renderHook(() => useWallet());

      expect(result.current.isDisconnecting).toBe(true);
      expect(result.current.isConnected).toBe(true);
    });
  });
});
