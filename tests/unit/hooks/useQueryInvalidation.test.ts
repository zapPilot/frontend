/**
 * Unit tests for useQueryInvalidation utilities
 *
 * Tests the invalidateAndRefetch function for proper cache invalidation
 * and graceful error handling.
 */

import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { invalidateAndRefetch } from "../../../src/hooks/useQueryInvalidation";

// Mock the logger
vi.mock("@/utils/logger", () => ({
  walletLogger: {
    error: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

import { walletLogger } from "@/utils/logger";

describe("useQueryInvalidation", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  describe("invalidateAndRefetch", () => {
    it("should successfully invalidate queries and refetch", async () => {
      const queryKey = ["test-key"];
      const mockRefetch = vi.fn().mockResolvedValue({ data: "test" });

      // Set up some cached data
      queryClient.setQueryData(queryKey, { oldData: true });

      await invalidateAndRefetch({
        queryClient,
        queryKey,
        refetch: mockRefetch,
        operationName: "test operation",
      });

      expect(mockRefetch).toHaveBeenCalled();
      expect(walletLogger.error).not.toHaveBeenCalled();
    });

    it("should use default operation name when not provided", async () => {
      const queryKey = ["default-test"];
      const mockRefetch = vi.fn().mockResolvedValue({});

      await invalidateAndRefetch({
        queryClient,
        queryKey,
        refetch: mockRefetch,
      });

      expect(mockRefetch).toHaveBeenCalled();
    });

    it("should handle invalidation error gracefully", async () => {
      const queryKey = ["error-key"];
      const mockRefetch = vi.fn().mockResolvedValue({});

      // Mock invalidateQueries to throw
      const originalInvalidate = queryClient.invalidateQueries.bind(queryClient);
      queryClient.invalidateQueries = vi.fn().mockRejectedValue(new Error("Invalidation failed"));

      await invalidateAndRefetch({
        queryClient,
        queryKey,
        refetch: mockRefetch,
        operationName: "failing invalidation",
      });

      // Should still attempt refetch even if invalidation fails
      expect(mockRefetch).toHaveBeenCalled();
      expect(walletLogger.error).toHaveBeenCalledWith(
        "Failed to invalidate queries after failing invalidation",
        expect.any(Error)
      );

      // Restore
      queryClient.invalidateQueries = originalInvalidate;
    });

    it("should handle refetch error gracefully", async () => {
      const queryKey = ["refetch-error-key"];
      const mockRefetch = vi.fn().mockRejectedValue(new Error("Refetch failed"));

      await invalidateAndRefetch({
        queryClient,
        queryKey,
        refetch: mockRefetch,
        operationName: "failing refetch",
      });

      expect(walletLogger.error).toHaveBeenCalledWith(
        "Failed to refetch data after failing refetch",
        expect.any(Error)
      );
    });

    it("should handle both invalidation and refetch errors gracefully", async () => {
      const queryKey = ["both-error-key"];
      const mockRefetch = vi.fn().mockRejectedValue(new Error("Refetch failed"));

      // Mock invalidateQueries to throw
      const originalInvalidate = queryClient.invalidateQueries.bind(queryClient);
      queryClient.invalidateQueries = vi.fn().mockRejectedValue(new Error("Invalidation failed"));

      await invalidateAndRefetch({
        queryClient,
        queryKey,
        refetch: mockRefetch,
        operationName: "double failure",
      });

      // Should log both errors
      expect(walletLogger.error).toHaveBeenCalledTimes(2);
      expect(walletLogger.error).toHaveBeenCalledWith(
        "Failed to invalidate queries after double failure",
        expect.any(Error)
      );
      expect(walletLogger.error).toHaveBeenCalledWith(
        "Failed to refetch data after double failure",
        expect.any(Error)
      );

      // Restore
      queryClient.invalidateQueries = originalInvalidate;
    });

    it("should work with complex query keys", async () => {
      const queryKey = ["users", { userId: "123" }, "wallets"];
      const mockRefetch = vi.fn().mockResolvedValue({});

      await invalidateAndRefetch({
        queryClient,
        queryKey,
        refetch: mockRefetch,
      });

      expect(mockRefetch).toHaveBeenCalled();
    });
  });
});
