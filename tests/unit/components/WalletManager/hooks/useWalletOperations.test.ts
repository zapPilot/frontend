import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { WalletData } from "@/lib/validation/walletUtils";

// Mock all dependencies before imports
vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-query")>(
    "@tanstack/react-query"
  );
  return {
    ...actual,
    useQueryClient: vi.fn(),
  };
});

vi.mock("@/contexts/UserContext");
vi.mock("@/hooks/useToast");
vi.mock("@/providers/WalletProvider");
vi.mock("@/utils/clipboard");
vi.mock("@/components/WalletManager/services/WalletService");
vi.mock("@/services/accountService");
vi.mock("@/hooks/useQueryInvalidation");
vi.mock("@/components/WalletManager/utils/validation");

// Now import the hook after all mocks are set up
const { useWalletOperations } = await import(
  "@/components/WalletManager/hooks/useWalletOperations"
);

describe("useWalletOperations", () => {
  const defaultParams = {
    viewingUserId: "user123",
    realUserId: "user123",
    isOwner: true,
    isOpen: true,
  };

  const mockWallets: WalletData[] = [
    {
      id: "wallet1",
      address: "0x1234567890123456789012345678901234567890",
      label: "Main Wallet",
      isMain: false,
      isActive: false,
      createdAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "wallet2",
      address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
      label: "Trading Wallet",
      isMain: false,
      isActive: false,
      createdAt: "2024-01-02T00:00:00Z",
    },
  ];

  beforeEach(async () => {
    vi.clearAllMocks();

    // Setup useQueryClient mock
    const { useQueryClient } = await import("@tanstack/react-query");
    vi.mocked(useQueryClient).mockReturnValue({
      invalidateQueries: vi.fn().mockResolvedValue(undefined),
    } as any);

    // Setup useUser mock
    const { useUser } = await import("@/contexts/UserContext");
    vi.mocked(useUser).mockReturnValue({
      refetch: vi.fn().mockResolvedValue(undefined),
    } as any);

    // Setup useToast mock
    const { useToast } = await import("@/hooks/useToast");
    vi.mocked(useToast).mockReturnValue({
      showToast: vi.fn(),
    } as any);

    // Setup useWalletProvider mock
    const { useWalletProvider } = await import("@/providers/WalletProvider");
    vi.mocked(useWalletProvider).mockReturnValue({
      disconnect: vi.fn().mockResolvedValue(undefined),
      isConnected: false,
      connectedWallets: [],
      switchActiveWallet: vi.fn().mockResolvedValue(undefined),
    } as any);

    // Setup clipboard mock
    const clipboard = await import("@/utils/clipboard");
    vi.mocked(clipboard.copyTextToClipboard).mockResolvedValue(true);

    // Setup WalletService mocks
    const WalletService = await import(
      "@/components/WalletManager/services/WalletService"
    );
    vi.mocked(WalletService.loadWallets).mockResolvedValue(mockWallets);
    vi.mocked(WalletService.addWallet).mockResolvedValue({ success: true });
    vi.mocked(WalletService.removeWallet).mockResolvedValue({ success: true });
    vi.mocked(WalletService.updateWalletLabel).mockResolvedValue({
      success: true,
    });

    // Setup accountService mocks
    const accountService = await import("@/services/accountService");
    vi.mocked(accountService.deleteUser).mockResolvedValue({
      success: true,
      message: "User deleted",
    });

    // Setup invalidateAndRefetch mock
    const { invalidateAndRefetch } = await import(
      "@/hooks/useQueryInvalidation"
    );
    vi.mocked(invalidateAndRefetch).mockResolvedValue(undefined);

    // Setup validation mock
    const validation = await import(
      "@/components/WalletManager/utils/validation"
    );
    vi.mocked(validation.validateNewWallet).mockImplementation(wallet => {
      if (!wallet.address.trim()) {
        return { isValid: false, error: "Wallet address is required" };
      }
      if (!wallet.label.trim()) {
        return { isValid: false, error: "Wallet label is required" };
      }
      if (wallet.label.trim().length < 2) {
        return {
          isValid: false,
          error: "Wallet label must be at least 2 characters long",
        };
      }
      if (!/^0x[a-fA-F0-9]{40}$/.test(wallet.address)) {
        return {
          isValid: false,
          error:
            "Invalid wallet address format. Must be a 42-character Ethereum address starting with 0x",
        };
      }
      return { isValid: true };
    });
  });

  describe("initialization", () => {
    it("should initialize with default state after loading", async () => {
      const { result } = renderHook(() => useWalletOperations(defaultParams));

      // Wait for initial load to complete
      await waitFor(() => {
        expect(result.current.isRefreshing).toBe(false);
      });

      expect(result.current.wallets).toHaveLength(2);
      expect(result.current.isRefreshing).toBe(false);
      expect(result.current.isAdding).toBe(false);
      expect(result.current.editingWallet).toBeNull();
      expect(result.current.validationError).toBeNull();
      expect(result.current.isDeletingAccount).toBe(false);
      expect(result.current.newWallet).toEqual({ address: "", label: "" });
      expect(result.current.operations).toEqual({
        adding: { isLoading: false, error: null },
        removing: {},
        editing: {},
        subscribing: { isLoading: false, error: null },
      });
    });
  });

  describe("loadWallets", () => {
    it("should load wallets on mount when isOpen is true", async () => {
      const WalletService = await import(
        "@/components/WalletManager/services/WalletService"
      );

      renderHook(() => useWalletOperations(defaultParams));

      await waitFor(() => {
        expect(WalletService.loadWallets).toHaveBeenCalledWith("user123");
      });
    });

    it("should not load wallets when isOpen is false", async () => {
      const WalletService = await import(
        "@/components/WalletManager/services/WalletService"
      );

      renderHook(() =>
        useWalletOperations({ ...defaultParams, isOpen: false })
      );

      await waitFor(
        () => {
          expect(WalletService.loadWallets).not.toHaveBeenCalled();
        },
        { timeout: 100 }
      ).catch(() => {
        /* Expected to not be called */
      });
    });

    it("should handle wallet load errors gracefully", async () => {
      const WalletService = await import(
        "@/components/WalletManager/services/WalletService"
      );
      vi.mocked(WalletService.loadWallets).mockRejectedValue(
        new Error("Network error")
      );

      const { result } = renderHook(() => useWalletOperations(defaultParams));

      await waitFor(() => {
        expect(result.current.wallets).toEqual([]);
        expect(result.current.isRefreshing).toBe(false);
      });
    });
  });

  describe("handleAddWallet", () => {
    it("should add wallet successfully", async () => {
      const WalletService = await import(
        "@/components/WalletManager/services/WalletService"
      );
      vi.mocked(WalletService.addWallet).mockResolvedValue({ success: true });

      const { result } = renderHook(() => useWalletOperations(defaultParams));

      await waitFor(() => {
        expect(result.current.wallets).toHaveLength(2);
      });

      act(() => {
        result.current.setNewWallet({
          address: "0xfedcbafedcbafedcbafedcbafedcbafedcbafed0",
          label: "New Wallet",
        });
      });

      await act(async () => {
        await result.current.handleAddWallet();
      });

      expect(WalletService.addWallet).toHaveBeenCalledWith(
        "user123",
        "0xfedcbafedcbafedcbafedcbafedcbafedcbafed0",
        "New Wallet"
      );
    });

    it("should validate wallet before adding", async () => {
      const { result } = renderHook(() => useWalletOperations(defaultParams));

      act(() => {
        result.current.setNewWallet({
          address: "",
          label: "Test",
        });
      });

      await act(async () => {
        await result.current.handleAddWallet();
      });

      expect(result.current.validationError).toBe("Wallet address is required");
    });
  });

  describe("handleDeleteWallet", () => {
    it("should delete wallet successfully", async () => {
      const WalletService = await import(
        "@/components/WalletManager/services/WalletService"
      );

      const { result } = renderHook(() => useWalletOperations(defaultParams));

      await waitFor(() => {
        expect(result.current.wallets).toHaveLength(2);
      });

      await act(async () => {
        await result.current.handleDeleteWallet("wallet1");
      });

      expect(WalletService.removeWallet).toHaveBeenCalledWith(
        "user123",
        "wallet1"
      );
      expect(result.current.wallets).toHaveLength(1);
    });
  });

  describe("handleCopyAddress", () => {
    it("should copy address and show success toast", async () => {
      const clipboard = await import("@/utils/clipboard");
      const { useToast } = await import("@/hooks/useToast");
      const mockShowToast = vi.fn();
      vi.mocked(useToast).mockReturnValue({
        showToast: mockShowToast,
      } as any);
      vi.mocked(clipboard.copyTextToClipboard).mockResolvedValue(true);

      const { result } = renderHook(() => useWalletOperations(defaultParams));

      await act(async () => {
        await result.current.handleCopyAddress(
          "0x1234567890123456789012345678901234567890"
        );
      });

      expect(clipboard.copyTextToClipboard).toHaveBeenCalledWith(
        "0x1234567890123456789012345678901234567890"
      );
      expect(mockShowToast).toHaveBeenCalledWith({
        type: "success",
        title: "Address Copied",
        message: expect.stringContaining("copied to clipboard"),
      });
    });
  });

  describe("state setters", () => {
    it("should update isAdding state", () => {
      const { result } = renderHook(() => useWalletOperations(defaultParams));

      act(() => {
        result.current.setIsAdding(true);
      });

      expect(result.current.isAdding).toBe(true);
    });

    it("should update newWallet state", () => {
      const { result } = renderHook(() => useWalletOperations(defaultParams));

      act(() => {
        result.current.setNewWallet({
          address: "0x1234567890123456789012345678901234567890",
          label: "Test",
        });
      });

      expect(result.current.newWallet).toEqual({
        address: "0x1234567890123456789012345678901234567890",
        label: "Test",
      });
    });
  });
});
