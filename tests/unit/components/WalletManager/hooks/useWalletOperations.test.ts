import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useWalletOperations } from "@/components/WalletManager/hooks/useWalletOperations";
import {
  addWallet as addWalletToBundle,
  loadWallets as fetchWallets,
  removeWallet as removeWalletFromBundle,
  updateWalletLabel,
} from "@/components/WalletManager/services/WalletService";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/providers/ToastProvider";
import { useWalletProvider } from "@/providers/WalletProvider";

// Mock dependencies
vi.mock("@/contexts/UserContext", () => ({
  useUser: vi.fn(),
}));

vi.mock("@/providers/ToastProvider", () => ({
  useToast: vi.fn(),
}));

vi.mock("@/providers/WalletProvider", () => ({
  useWalletProvider: vi.fn(),
}));

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return {
    ...(actual as any),
    useQueryClient: () => ({
      invalidateQueries: vi.fn(),
    }),
  };
});

vi.mock("@/components/WalletManager/services/WalletService", () => ({
  loadWallets: vi.fn(),
  addWallet: vi.fn(),
  removeWallet: vi.fn(),
  updateWalletLabel: vi.fn(),
}));

vi.mock("@/hooks/utils/useQueryInvalidation", () => ({
  invalidateAndRefetch: vi.fn(),
}));

vi.mock("@/services/accountService", () => ({
  deleteUser: vi.fn(),
}));

vi.mock("@/utils/clipboard", () => ({
  copyTextToClipboard: vi.fn().mockResolvedValue(true),
}));

describe("useWalletOperations", () => {
  const mockShowToast = vi.fn();
  const mockRefetch = vi.fn();
  const mockDisconnect = vi.fn();

  const defaultParams = {
    viewingUserId: "user-123",
    realUserId: "user-123",
    isOwner: true,
    isOpen: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useUser).mockReturnValue({ refetch: mockRefetch } as any);
    vi.mocked(useToast).mockReturnValue({ showToast: mockShowToast } as any);
    vi.mocked(useWalletProvider).mockReturnValue({
      disconnect: mockDisconnect,
      isConnected: true,
      connectedWallets: [],
      switchActiveWallet: vi.fn(),
    } as any);
    vi.mocked(fetchWallets).mockResolvedValue([]);
  });

  it("initializes with empty state", () => {
    const { result } = renderHook(() => useWalletOperations(defaultParams));

    expect(result.current.wallets).toEqual([]);
    expect(result.current.isRefreshing).toBe(true); // Initially refreshing
    expect(result.current.isAdding).toBe(false);
  });

  it("loads wallets when modal opens", async () => {
    const mockWallets = [
      { id: "w1", address: "0x123", label: "Main" },
      { id: "w2", address: "0x456", label: "Trading" },
    ];
    vi.mocked(fetchWallets).mockResolvedValue(mockWallets);

    const { result } = renderHook(() => useWalletOperations(defaultParams));

    await waitFor(() => {
      expect(result.current.wallets).toHaveLength(2);
    });

    expect(fetchWallets).toHaveBeenCalledWith("user-123");
  });

  it("handleAddWallet validates input", async () => {
    const { result } = renderHook(() => useWalletOperations(defaultParams));

    // Set invalid address
    act(() => {
      result.current.setNewWallet({ address: "invalid", label: "" });
    });

    await act(async () => {
      await result.current.handleAddWallet();
    });

    expect(result.current.validationError).toBeTruthy();
    expect(addWalletToBundle).not.toHaveBeenCalled();
  });

  it("handleAddWallet succeeds with valid wallet", async () => {
    vi.mocked(addWalletToBundle).mockResolvedValue({ success: true });
    vi.mocked(fetchWallets).mockResolvedValue([]);

    const { result } = renderHook(() => useWalletOperations(defaultParams));

    act(() => {
      result.current.setIsAdding(true);
      result.current.setNewWallet({
        address: "0x1234567890123456789012345678901234567890",
        label: "New Wallet",
      });
    });

    await act(async () => {
      await result.current.handleAddWallet();
    });

    expect(addWalletToBundle).toHaveBeenCalled();
    expect(result.current.isAdding).toBe(false);
  });

  it("handleDeleteWallet removes wallet", async () => {
    const mockWallets = [{ id: "w1", address: "0x123", label: "Main" }];
    vi.mocked(fetchWallets).mockResolvedValue(mockWallets);
    vi.mocked(removeWalletFromBundle).mockResolvedValue({ success: true });

    const { result } = renderHook(() => useWalletOperations(defaultParams));

    await waitFor(() => {
      expect(result.current.wallets).toHaveLength(1);
    });

    await act(async () => {
      await result.current.handleDeleteWallet("w1");
    });

    expect(removeWalletFromBundle).toHaveBeenCalledWith("user-123", "w1");
    expect(result.current.wallets).toHaveLength(0);
  });

  it("handleCopyAddress copies to clipboard", async () => {
    const { result } = renderHook(() => useWalletOperations(defaultParams));

    await act(async () => {
      await result.current.handleCopyAddress("0x123");
    });

    expect(mockShowToast).toHaveBeenCalledWith(
      expect.objectContaining({ type: "success" })
    );
  });

  it("editingWallet state management", () => {
    const { result } = renderHook(() => useWalletOperations(defaultParams));

    act(() => {
      result.current.setEditingWallet({ id: "w1", label: "Test" });
    });

    expect(result.current.editingWallet).toEqual({ id: "w1", label: "Test" });

    act(() => {
      result.current.setEditingWallet(null);
    });

    expect(result.current.editingWallet).toBeNull();
  });
  it("handleEditLabel updates label optimistically and calls API", async () => {
    const mockWallets = [{ id: "w1", address: "0x123", label: "Old" }];
    vi.mocked(fetchWallets).mockResolvedValue(mockWallets);
    vi.mocked(updateWalletLabel).mockResolvedValue({ success: true });

    const { result } = renderHook(() => useWalletOperations(defaultParams));

    await waitFor(() => {
      expect(result.current.wallets).toHaveLength(1);
    });

    await act(async () => {
      await result.current.handleEditLabel("w1", "New");
    });

    // Should update optimistically
    expect(result.current.wallets[0].label).toBe("New");
    expect(updateWalletLabel).toHaveBeenCalledWith("user-123", "0x123", "New");
  });

  it("handleEditLabel reverts optimistic update on API failure", async () => {
    const mockWallets = [{ id: "w1", address: "0x123", label: "Old" }];
    vi.mocked(fetchWallets).mockResolvedValue(mockWallets);
    vi.mocked(updateWalletLabel).mockResolvedValue({
      success: false,
      error: "API Error",
    });

    const { result } = renderHook(() => useWalletOperations(defaultParams));

    await waitFor(() => {
      expect(result.current.wallets).toHaveLength(1);
    });

    await act(async () => {
      await result.current.handleEditLabel("w1", "New");
    });

    // Should revert
    expect(result.current.wallets[0].label).toBe("Old");
    expect(result.current.operations.editing.w1.error).toBe("API Error");
  });

  it("handleDeleteAccount calls deleteUser and handles success", async () => {
    vi.mocked(useUser).mockReturnValue({
      refetch: mockRefetch,
      isConnected: false,
    } as any);
    const { result } = renderHook(() => useWalletOperations(defaultParams));

    await act(async () => {
      await result.current.handleDeleteAccount();
    });

    expect(result.current.isDeletingAccount).toBe(false);
    expect(mockShowToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Account Deleted",
        type: "success",
      })
    );
  });

  it("handleDeleteAccount attempts disconnect if connected", async () => {
    const { result } = renderHook(() => useWalletOperations(defaultParams));

    await act(async () => {
      await result.current.handleDeleteAccount();
    });

    expect(mockDisconnect).toHaveBeenCalled();
  });

  it("handleDeleteAccount handles disconnect failure gracefully", async () => {
    mockDisconnect.mockRejectedValue(new Error("Disconnect error"));
    const { result } = renderHook(() => useWalletOperations(defaultParams));

    await act(async () => {
      await result.current.handleDeleteAccount();
    });

    expect(mockShowToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Disconnect Wallet",
        type: "warning",
      })
    );
  });

  it("auto-refreshes wallets when conditions met", async () => {
    vi.useFakeTimers();
    vi.mocked(fetchWallets).mockResolvedValue([]);

    renderHook(() =>
      useWalletOperations({ ...defaultParams, isOwner: true, isOpen: true })
    );

    // Initial load
    expect(fetchWallets).toHaveBeenCalledTimes(1);

    // Advance time to trigger refresh
    await act(async () => {
      vi.advanceTimersByTime(30000); // 30s
    });

    expect(fetchWallets).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it("does not auto-refresh if not owner", async () => {
    vi.useFakeTimers();
    vi.mocked(fetchWallets).mockResolvedValue([]);

    renderHook(() =>
      useWalletOperations({ ...defaultParams, isOwner: false, isOpen: true })
    );

    await act(async () => {
      vi.advanceTimersByTime(30000);
    });

    expect(fetchWallets).toHaveBeenCalledTimes(1); // Only initial load
    vi.useRealTimers();
  });
});
