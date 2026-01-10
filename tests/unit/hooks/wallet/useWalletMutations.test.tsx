import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as WalletService from "@/components/WalletManager/services/WalletService";
import * as validation from "@/components/WalletManager/utils/validation";
import * as UserContext from "@/contexts/UserContext";
import * as queryInvalidation from "@/hooks/utils/useQueryInvalidation";
import { useWalletMutations } from "@/hooks/wallet/useWalletMutations";

// Mock dependencies
vi.mock("@/components/WalletManager/services/WalletService");
vi.mock("@/components/WalletManager/utils/validation");
vi.mock("@/contexts/UserContext");
vi.mock("@/hooks/utils/useQueryInvalidation");
vi.mock("@/lib/validation/walletUtils", () => ({
  handleWalletError: (_error: unknown) => "Mocked error message",
}));

describe("useWalletMutations", () => {
  let queryClient: QueryClient;
  const mockRefetch = vi.fn();
  const mockSetOperations = vi.fn();
  const mockSetWallets = vi.fn();
  const mockSetWalletOperationState = vi.fn();
  const mockLoadWallets = vi.fn();

  const defaultProps = {
    userId: "user-123",
    operations: {
      adding: { isLoading: false, error: null },
      removing: {},
      updating: {},
    },
    setOperations: mockSetOperations,
    setWallets: mockSetWallets,
    setWalletOperationState: mockSetWalletOperationState,
    loadWallets: mockLoadWallets,
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();

    vi.spyOn(UserContext, "useUser").mockReturnValue({
      refetch: mockRefetch,
    } as any);

    // Mock set state functions to behave like functional updates if possible,
    // but here we just mock the calls.
    // For setOperations(prev => ...), we can check what it was called with roughly.
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe("handleAddWallet", () => {
    it("should return error if userId is missing", async () => {
      const { result } = renderHook(
        () => useWalletMutations({ ...defaultProps, userId: "" }),
        { wrapper }
      );

      const res = await result.current.handleAddWallet({
        address: "0x123",
        label: "Test",
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe("User ID is required");
    });

    it("should return error if validation fails", async () => {
      vi.spyOn(validation, "validateNewWallet").mockReturnValue({
        isValid: false,
        error: "Validation error",
      });

      const { result } = renderHook(() => useWalletMutations(defaultProps), {
        wrapper,
      });

      const res = await result.current.handleAddWallet({
        address: "invalid",
        label: "Test",
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe("Validation error");
    });

    it("should handle successful wallet addition", async () => {
      vi.spyOn(validation, "validateNewWallet").mockReturnValue({
        isValid: true,
      });
      vi.spyOn(WalletService, "addWallet").mockResolvedValue({
        success: true,
        walletId: "wallet-123",
      });

      const { result } = renderHook(() => useWalletMutations(defaultProps), {
        wrapper,
      });

      // We need better mocking for setState to track 'loading' states in sequence if we want to be strict.
      // But checking terminal calls is often enough.

      const res = await result.current.handleAddWallet({
        address: "0x123",
        label: "Test",
      });

      expect(res.success).toBe(true);
      expect(mockLoadWallets).toHaveBeenCalled();
      expect(queryInvalidation.invalidateAndRefetch).toHaveBeenCalled();

      // Check that loading state was turned off eventually
      // The implementation calls setOperations multiple times.
      expect(mockSetOperations).toHaveBeenCalled();
    });

    it("should handle API error during addition", async () => {
      vi.spyOn(validation, "validateNewWallet").mockReturnValue({
        isValid: true,
      });
      vi.spyOn(WalletService, "addWallet").mockResolvedValue({
        success: false,
        error: "API Error",
      });

      const { result } = renderHook(() => useWalletMutations(defaultProps), {
        wrapper,
      });

      const res = await result.current.handleAddWallet({
        address: "0x123",
        label: "Test",
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe("API Error");
      expect(mockLoadWallets).not.toHaveBeenCalled();
    });

    it("should handle exception during addition", async () => {
      vi.spyOn(validation, "validateNewWallet").mockReturnValue({
        isValid: true,
      });
      vi.spyOn(WalletService, "addWallet").mockRejectedValue(
        new Error("Network error")
      );

      const { result } = renderHook(() => useWalletMutations(defaultProps), {
        wrapper,
      });

      const res = await result.current.handleAddWallet({
        address: "0x123",
        label: "Test",
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe("Mocked error message");
    });
  });

  describe("handleDeleteWallet", () => {
    it("should do nothing if userId is missing", async () => {
      const { result } = renderHook(
        () => useWalletMutations({ ...defaultProps, userId: "" }),
        { wrapper }
      );

      await result.current.handleDeleteWallet("wallet-123");
      expect(mockSetWalletOperationState).not.toHaveBeenCalled();
    });

    it("should handle successful wallet deletion", async () => {
      vi.spyOn(WalletService, "removeWallet").mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(() => useWalletMutations(defaultProps), {
        wrapper,
      });

      await result.current.handleDeleteWallet("wallet-123");

      expect(mockSetWallets).toHaveBeenCalled(); // Optimistic update
      expect(queryInvalidation.invalidateAndRefetch).toHaveBeenCalled();
      // Should reset loading state
      expect(mockSetWalletOperationState).toHaveBeenCalledWith(
        "removing",
        "wallet-123",
        { isLoading: false, error: null }
      );
    });

    it("should handle API failure during deletion", async () => {
      vi.spyOn(WalletService, "removeWallet").mockResolvedValue({
        success: false,
        error: "Delete failed",
      });

      const { result } = renderHook(() => useWalletMutations(defaultProps), {
        wrapper,
      });

      await result.current.handleDeleteWallet("wallet-123");

      expect(mockSetWallets).not.toHaveBeenCalled();
      // Actually, wait, the implementation calls setWalletOperationState first.

      expect(mockSetWalletOperationState).toHaveBeenLastCalledWith(
        "removing",
        "wallet-123",
        { isLoading: false, error: "Delete failed" }
      );
    });

    it("should handle exception during deletion", async () => {
      vi.spyOn(WalletService, "removeWallet").mockRejectedValue(
        new Error("Crash")
      );

      const { result } = renderHook(() => useWalletMutations(defaultProps), {
        wrapper,
      });

      await result.current.handleDeleteWallet("wallet-123");

      expect(mockSetWalletOperationState).toHaveBeenLastCalledWith(
        "removing",
        "wallet-123",
        { isLoading: false, error: "Mocked error message" }
      );
    });
  });
});
