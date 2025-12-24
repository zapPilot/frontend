/**
 * WalletProvider - Provider Tests
 *
 * Comprehensive test suite for wallet provider functionality.
 * Tests context provision, ThirdWeb integration, state management, and error handling.
 */

import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Import after mocks
import { useWalletProvider,WalletProvider } from "@/providers/WalletProvider";

// Mock ThirdWeb hooks
const mockUseActiveAccount = vi.fn();
const mockUseActiveWallet = vi.fn();
const mockUseActiveWalletChain = vi.fn();
const mockUseConnect = vi.fn();
const mockUseDisconnect = vi.fn();
const mockUseSwitchActiveWalletChain = vi.fn();
const mockUseWalletBalance = vi.fn();
const mockUseConnectedWallets = vi.fn();
const mockUseSetActiveWallet = vi.fn();

vi.mock("thirdweb/react", () => ({
  useActiveAccount: () => mockUseActiveAccount(),
  useActiveWallet: () => mockUseActiveWallet(),
  useActiveWalletChain: () => mockUseActiveWalletChain(),
  useConnect: () => mockUseConnect(),
  useDisconnect: () => mockUseDisconnect(),
  useSwitchActiveWalletChain: () => mockUseSwitchActiveWalletChain(),
  useWalletBalance: () => mockUseWalletBalance(),
  useConnectedWallets: () => mockUseConnectedWallets(),
  useSetActiveWallet: () => mockUseSetActiveWallet(),
}));

// Mock logger
vi.mock("@/utils/logger", () => ({
  walletLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock ThirdWeb client
vi.mock("@/utils/thirdweb", () => ({
  default: { clientId: "test-client-id" },
}));

describe("WalletProvider", () => {
  // Mock wallet objects
  const mockWallet1 = {
    getAccount: vi.fn(() => ({
      address: "0x1234567890123456789012345678901234567890",
    })),
  };

  const mockWallet2 = {
    getAccount: vi.fn(() => ({
      address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    })),
  };

  const mockAccount = {
    address: "0x1234567890123456789012345678901234567890",
    signMessage: vi.fn(),
  };

  const mockChain = {
    id: 1,
    name: "Ethereum Mainnet",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
  };

  const mockBalance = {
    data: {
      displayValue: "1.5",
      value: BigInt("1500000000000000000"),
    },
    isLoading: false,
    isError: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockUseActiveAccount.mockReturnValue(null);
    mockUseActiveWallet.mockReturnValue(null);
    mockUseActiveWalletChain.mockReturnValue(null);
    mockUseConnect.mockReturnValue({ connect: vi.fn() });
    mockUseDisconnect.mockReturnValue({ disconnect: vi.fn() });
    mockUseSwitchActiveWalletChain.mockReturnValue(vi.fn());
    mockUseWalletBalance.mockReturnValue({ data: null, isLoading: false });
    mockUseConnectedWallets.mockReturnValue([]);
    mockUseSetActiveWallet.mockReturnValue(vi.fn());
  });

  describe("Provider rendering", () => {
    it("should provide context value to children", () => {
      const { result } = renderHook(() => useWalletProvider(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <WalletProvider>{children}</WalletProvider>
        ),
      });

      expect(result.current).toBeDefined();
      expect(result.current.account).toBeNull();
      expect(result.current.chain).toBeNull();
      expect(result.current.isConnected).toBe(false);
    });
  });

  describe("useWalletProvider hook", () => {
    it("should throw error when used outside provider", () => {
      expect(() => {
        renderHook(() => useWalletProvider());
      }).toThrow("useWalletProvider must be used within a WalletProvider");
    });

    it("should return context value when used inside provider", () => {
      const { result } = renderHook(() => useWalletProvider(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <WalletProvider>{children}</WalletProvider>
        ),
      });

      expect(result.current).toHaveProperty("account");
      expect(result.current).toHaveProperty("chain");
      expect(result.current).toHaveProperty("connect");
      expect(result.current).toHaveProperty("disconnect");
      expect(result.current).toHaveProperty("switchChain");
      expect(result.current).toHaveProperty("signMessage");
      expect(result.current).toHaveProperty("isConnected");
      expect(result.current).toHaveProperty("error");
      expect(result.current).toHaveProperty("clearError");
    });
  });

  describe("Wallet connection states", () => {
    it("should show disconnected state by default", () => {
      const { result } = renderHook(() => useWalletProvider(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <WalletProvider>{children}</WalletProvider>
        ),
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.isConnecting).toBe(false);
      expect(result.current.isDisconnecting).toBe(false);
      expect(result.current.account).toBeNull();
    });

    it("should show connected state when account is present", () => {
      mockUseActiveAccount.mockReturnValue(mockAccount);
      mockUseActiveWallet.mockReturnValue(mockWallet1);
      mockUseActiveWalletChain.mockReturnValue(mockChain);
      mockUseWalletBalance.mockReturnValue(mockBalance);

      const { result } = renderHook(() => useWalletProvider(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <WalletProvider>{children}</WalletProvider>
        ),
      });

      expect(result.current.isConnected).toBe(true);
      expect(result.current.account).toEqual({
        address: mockAccount.address,
        isConnected: true,
        balance: "1.5",
      });
    });

    it("should show connecting state when wallet present but no account", () => {
      mockUseActiveAccount.mockReturnValue(null);
      mockUseActiveWallet.mockReturnValue(mockWallet1);

      const { result } = renderHook(() => useWalletProvider(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <WalletProvider>{children}</WalletProvider>
        ),
      });

      expect(result.current.isConnecting).toBe(true);
      expect(result.current.isConnected).toBe(false);
    });

    it("should show disconnecting state when account present but no wallet", () => {
      mockUseActiveAccount.mockReturnValue(mockAccount);
      mockUseActiveWallet.mockReturnValue(null);

      const { result } = renderHook(() => useWalletProvider(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <WalletProvider>{children}</WalletProvider>
        ),
      });

      expect(result.current.isDisconnecting).toBe(true);
      expect(result.current.isConnected).toBe(true);
    });
  });

  describe("Account state transformation", () => {
    it("should return null account when not connected", () => {
      const { result } = renderHook(() => useWalletProvider(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <WalletProvider>{children}</WalletProvider>
        ),
      });

      expect(result.current.account).toBeNull();
    });

    it("should transform account with balance", () => {
      mockUseActiveAccount.mockReturnValue(mockAccount);
      mockUseWalletBalance.mockReturnValue(mockBalance);

      const { result } = renderHook(() => useWalletProvider(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <WalletProvider>{children}</WalletProvider>
        ),
      });

      expect(result.current.account).toEqual({
        address: mockAccount.address,
        isConnected: true,
        balance: "1.5",
      });
    });

    it("should default balance to '0' when no balance data", () => {
      mockUseActiveAccount.mockReturnValue(mockAccount);
      mockUseWalletBalance.mockReturnValue({ data: null, isLoading: false });

      const { result } = renderHook(() => useWalletProvider(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <WalletProvider>{children}</WalletProvider>
        ),
      });

      expect(result.current.account?.balance).toBe("0");
    });
  });

  describe("Chain state transformation", () => {
    it("should return null chain when not connected", () => {
      const { result } = renderHook(() => useWalletProvider(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <WalletProvider>{children}</WalletProvider>
        ),
      });

      expect(result.current.chain).toBeNull();
    });

    it("should transform chain with full data", () => {
      mockUseActiveWalletChain.mockReturnValue(mockChain);

      const { result } = renderHook(() => useWalletProvider(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <WalletProvider>{children}</WalletProvider>
        ),
      });

      expect(result.current.chain).toEqual({
        id: 1,
        name: "Ethereum Mainnet",
        symbol: "ETH",
      });
    });

    it("should use fallback name when chain name is missing", () => {
      mockUseActiveWalletChain.mockReturnValue({
        id: 137,
        nativeCurrency: { symbol: "MATIC", decimals: 18 },
      });

      const { result } = renderHook(() => useWalletProvider(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <WalletProvider>{children}</WalletProvider>
        ),
      });

      expect(result.current.chain?.name).toBe("Chain 137");
    });

    it("should use fallback symbol when currency symbol is missing", () => {
      mockUseActiveWalletChain.mockReturnValue({
        id: 1,
        name: "Ethereum",
        nativeCurrency: { decimals: 18 },
      });

      const { result } = renderHook(() => useWalletProvider(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <WalletProvider>{children}</WalletProvider>
        ),
      });

      expect(result.current.chain?.symbol).toBe("ETH");
    });
  });

  describe("Multi-wallet support", () => {
    it("should return empty wallet list when no wallets connected", () => {
      mockUseConnectedWallets.mockReturnValue([]);

      const { result } = renderHook(() => useWalletProvider(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <WalletProvider>{children}</WalletProvider>
        ),
      });

      expect(result.current.connectedWallets).toEqual([]);
      expect(result.current.hasMultipleWallets).toBe(false);
    });

    it("should list connected wallets with active state", () => {
      mockUseActiveAccount.mockReturnValue(mockAccount);
      mockUseConnectedWallets.mockReturnValue([mockWallet1, mockWallet2]);

      const { result } = renderHook(() => useWalletProvider(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <WalletProvider>{children}</WalletProvider>
        ),
      });

      expect(result.current.connectedWallets).toHaveLength(2);
      expect(result.current.connectedWallets[0]).toEqual({
        address: "0x1234567890123456789012345678901234567890",
        isActive: true,
      });
      expect(result.current.connectedWallets[1]).toEqual({
        address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
        isActive: false,
      });
    });

    it("should detect multiple wallets", () => {
      mockUseConnectedWallets.mockReturnValue([mockWallet1, mockWallet2]);

      const { result } = renderHook(() => useWalletProvider(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <WalletProvider>{children}</WalletProvider>
        ),
      });

      expect(result.current.hasMultipleWallets).toBe(true);
    });

    it("should filter out wallets without addresses", () => {
      const mockWalletNoAddress = {
        getAccount: vi.fn(() => ({ address: "" })),
      };

      mockUseConnectedWallets.mockReturnValue([
        mockWallet1,
        mockWalletNoAddress,
      ]);

      const { result } = renderHook(() => useWalletProvider(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <WalletProvider>{children}</WalletProvider>
        ),
      });

      expect(result.current.connectedWallets).toHaveLength(1);
    });
  });

  describe("Connect function", () => {
    it("should call connect with first available wallet", async () => {
      const mockConnect = vi.fn().mockResolvedValue();
      mockUseConnect.mockReturnValue({ connect: mockConnect });
      mockUseConnectedWallets.mockReturnValue([mockWallet1]);

      const { result } = renderHook(() => useWalletProvider(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <WalletProvider>{children}</WalletProvider>
        ),
      });

      await result.current.connect();

      expect(mockConnect).toHaveBeenCalledWith(mockWallet1);
    });

    it("should throw error when no wallet available", async () => {
      const mockConnect = vi.fn();
      mockUseConnect.mockReturnValue({ connect: mockConnect });
      mockUseConnectedWallets.mockReturnValue([]);

      const { result } = renderHook(() => useWalletProvider(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <WalletProvider>{children}</WalletProvider>
        ),
      });

      await expect(result.current.connect()).rejects.toThrow(
        "No wallet available"
      );

      await waitFor(() => {
        expect(result.current.error).toEqual({
          message: "No wallet available",
          code: "CONNECT_ERROR",
        });
      });
    });

    it("should set error state on connection failure", async () => {
      const mockConnect = vi.fn().mockRejectedValue(new Error("User rejected"));
      mockUseConnect.mockReturnValue({ connect: mockConnect });
      mockUseConnectedWallets.mockReturnValue([mockWallet1]);

      const { result } = renderHook(() => useWalletProvider(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <WalletProvider>{children}</WalletProvider>
        ),
      });

      await expect(result.current.connect()).rejects.toThrow("User rejected");

      await waitFor(() => {
        expect(result.current.error).toEqual({
          message: "User rejected",
          code: "CONNECT_ERROR",
        });
      });
    });

    it("should clear previous errors before connecting", async () => {
      const mockConnect = vi
        .fn()
        .mockRejectedValueOnce(new Error("First error"))
        .mockResolvedValueOnce();
      mockUseConnect.mockReturnValue({ connect: mockConnect });
      mockUseConnectedWallets.mockReturnValue([mockWallet1]);

      const { result } = renderHook(() => useWalletProvider(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <WalletProvider>{children}</WalletProvider>
        ),
      });

      // First attempt fails
      await expect(result.current.connect()).rejects.toThrow("First error");
      expect(result.current.error).toBeDefined();

      // Second attempt succeeds
      await result.current.connect();
      expect(result.current.error).toBeNull();
    });
  });

  describe("Disconnect function", () => {
    it("should call disconnect with current wallet", async () => {
      const mockDisconnect = vi.fn().mockResolvedValue();
      mockUseDisconnect.mockReturnValue({ disconnect: mockDisconnect });
      mockUseActiveWallet.mockReturnValue(mockWallet1);

      const { result } = renderHook(() => useWalletProvider(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <WalletProvider>{children}</WalletProvider>
        ),
      });

      await result.current.disconnect();

      expect(mockDisconnect).toHaveBeenCalledWith(mockWallet1);
    });

    it("should handle disconnect errors", async () => {
      const mockDisconnect = vi
        .fn()
        .mockRejectedValue(new Error("Disconnect failed"));
      mockUseDisconnect.mockReturnValue({ disconnect: mockDisconnect });
      mockUseActiveWallet.mockReturnValue(mockWallet1);

      const { result } = renderHook(() => useWalletProvider(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <WalletProvider>{children}</WalletProvider>
        ),
      });

      await expect(result.current.disconnect()).rejects.toThrow(
        "Disconnect failed"
      );

      await waitFor(() => {
        expect(result.current.error).toEqual({
          message: "Disconnect failed",
          code: "DISCONNECT_ERROR",
        });
      });
    });

    it("should do nothing when no wallet is connected", async () => {
      const mockDisconnect = vi.fn();
      mockUseDisconnect.mockReturnValue({ disconnect: mockDisconnect });
      mockUseActiveWallet.mockReturnValue(null);

      const { result } = renderHook(() => useWalletProvider(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <WalletProvider>{children}</WalletProvider>
        ),
      });

      await result.current.disconnect();

      expect(mockDisconnect).not.toHaveBeenCalled();
    });
  });

  describe("Switch chain function", () => {
    it("should switch to target chain", async () => {
      const mockSwitchChain = vi.fn().mockResolvedValue();
      mockUseSwitchActiveWalletChain.mockReturnValue(mockSwitchChain);

      const { result } = renderHook(() => useWalletProvider(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <WalletProvider>{children}</WalletProvider>
        ),
      });

      await result.current.switchChain(137);

      expect(mockSwitchChain).toHaveBeenCalledWith({
        id: 137,
        name: "Chain 137",
        rpc: "https://rpc-137.example.com",
        nativeCurrency: {
          name: "ETH",
          symbol: "ETH",
          decimals: 18,
        },
      });
    });

    it("should throw error on chain switch failure", async () => {
      const mockSwitchChain = vi
        .fn()
        .mockRejectedValue(new Error("User rejected chain switch"));
      mockUseSwitchActiveWalletChain.mockReturnValue(mockSwitchChain);

      const { result } = renderHook(() => useWalletProvider(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <WalletProvider>{children}</WalletProvider>
        ),
      });

      await expect(result.current.switchChain(137)).rejects.toThrow(
        "User rejected chain switch"
      );
    });
  });

  describe("Sign message function", () => {
    it("should sign message with active account", async () => {
      const mockSignMessage = vi.fn().mockResolvedValue("0xsignature");
      const accountWithSign = {
        ...mockAccount,
        signMessage: mockSignMessage,
      };
      mockUseActiveAccount.mockReturnValue(accountWithSign);

      const { result } = renderHook(() => useWalletProvider(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <WalletProvider>{children}</WalletProvider>
        ),
      });

      const signature = await result.current.signMessage("Hello, world!");

      expect(mockSignMessage).toHaveBeenCalledWith({
        message: "Hello, world!",
      });
      expect(signature).toBe("0xsignature");
    });

    it("should throw error when no account is connected", async () => {
      mockUseActiveAccount.mockReturnValue(null);

      const { result } = renderHook(() => useWalletProvider(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <WalletProvider>{children}</WalletProvider>
        ),
      });

      await expect(result.current.signMessage("test")).rejects.toThrow(
        "No account connected"
      );
    });

    it("should throw error on signing failure", async () => {
      const mockSignMessage = vi
        .fn()
        .mockRejectedValue(new Error("User rejected signing"));
      const accountWithSign = {
        ...mockAccount,
        signMessage: mockSignMessage,
      };
      mockUseActiveAccount.mockReturnValue(accountWithSign);

      const { result } = renderHook(() => useWalletProvider(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <WalletProvider>{children}</WalletProvider>
        ),
      });

      await expect(result.current.signMessage("test")).rejects.toThrow(
        "User rejected signing"
      );
    });
  });

  describe("Switch active wallet function", () => {
    it("should switch to target wallet", async () => {
      const mockSetActiveWallet = vi.fn().mockResolvedValue();
      mockUseSetActiveWallet.mockReturnValue(mockSetActiveWallet);
      mockUseConnectedWallets.mockReturnValue([mockWallet1, mockWallet2]);

      const { result } = renderHook(() => useWalletProvider(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <WalletProvider>{children}</WalletProvider>
        ),
      });

      await result.current.switchActiveWallet(
        "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
      );

      expect(mockSetActiveWallet).toHaveBeenCalledWith(mockWallet2);
    });

    it("should throw error when target wallet not found", async () => {
      mockUseConnectedWallets.mockReturnValue([mockWallet1]);

      const { result } = renderHook(() => useWalletProvider(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <WalletProvider>{children}</WalletProvider>
        ),
      });

      await expect(
        result.current.switchActiveWallet("0xnonexistent")
      ).rejects.toThrow("Wallet 0xnonexistent not found");

      await waitFor(() => {
        expect(result.current.error).toEqual({
          message: "Wallet 0xnonexistent not found",
          code: "WALLET_NOT_FOUND",
        });
      });
    });

    it("should handle switch wallet errors", async () => {
      const mockSetActiveWallet = vi
        .fn()
        .mockRejectedValue(new Error("Switch failed"));
      mockUseSetActiveWallet.mockReturnValue(mockSetActiveWallet);
      mockUseConnectedWallets.mockReturnValue([mockWallet1, mockWallet2]);

      const { result } = renderHook(() => useWalletProvider(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <WalletProvider>{children}</WalletProvider>
        ),
      });

      await expect(
        result.current.switchActiveWallet(
          "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
        )
      ).rejects.toThrow("Switch failed");

      await waitFor(() => {
        expect(result.current.error).toEqual({
          message: "Switch failed",
          code: "SWITCH_WALLET_ERROR",
        });
      });
    });
  });

  describe("Error management", () => {
    it("should clear error when clearError is called", async () => {
      const mockConnect = vi
        .fn()
        .mockRejectedValue(new Error("Connection failed"));
      mockUseConnect.mockReturnValue({ connect: mockConnect });
      mockUseConnectedWallets.mockReturnValue([mockWallet1]);

      const { result } = renderHook(() => useWalletProvider(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <WalletProvider>{children}</WalletProvider>
        ),
      });

      // Trigger an error
      await expect(result.current.connect()).rejects.toThrow(
        "Connection failed"
      );
      expect(result.current.error).toBeDefined();

      // Clear the error
      result.current.clearError();

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });

    it("should have no error by default", () => {
      const { result } = renderHook(() => useWalletProvider(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <WalletProvider>{children}</WalletProvider>
        ),
      });

      expect(result.current.error).toBeNull();
    });
  });
});
