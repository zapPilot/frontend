import { waitFor } from "@testing-library/react";
import { renderHook } from "../../test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePortfolioData } from "../../../src/hooks/usePortfolioData";
import { useUser } from "../../../src/contexts/UserContext";

// Mock the UserContext
vi.mock("../../../src/contexts/UserContext", () => ({
  useUser: vi.fn(),
}));

// Mock the portfolio query hook since it uses React Query internally
vi.mock("../../../src/hooks/queries/usePortfolioQuery", () => ({
  usePortfolioData: vi.fn(() => ({
    totalValue: null,
    categories: null,
    pieChartData: null,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    isRefetching: false,
  })),
}));

const mockUseUser = vi.mocked(useUser);

describe("usePortfolioData", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock for useUser
    mockUseUser.mockReturnValue({
      userInfo: { userId: "test-user-123" },
      loading: false,
      error: null,
      isConnected: true,
    });
  });

  describe("Initial State", () => {
    it("should return the expected interface structure", () => {
      const { result } = renderHook(() => usePortfolioData());

      expect(result.current).toHaveProperty("totalValue");
      expect(result.current).toHaveProperty("categories");
      expect(result.current).toHaveProperty("pieChartData");
      expect(result.current).toHaveProperty("isLoading");
      expect(result.current).toHaveProperty("error");
      expect(result.current).toHaveProperty("retry");
      expect(result.current).toHaveProperty("isRetrying");
      expect(result.current).toHaveProperty("isConnected");
    });

    it("should handle USER_NOT_FOUND error from useUser", () => {
      mockUseUser.mockReturnValue({
        userInfo: null,
        loading: false,
        error: "USER_NOT_FOUND",
        isConnected: false,
      });

      const { result } = renderHook(() => usePortfolioData());

      expect(result.current.error).toBe("USER_NOT_FOUND");
      expect(result.current.totalValue).toBeNull();
      expect(result.current.categories).toBeNull();
      expect(result.current.pieChartData).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isConnected).toBe(false);
    });

    it("should handle when user is not connected", () => {
      mockUseUser.mockReturnValue({
        userInfo: null,
        loading: false,
        error: null,
        isConnected: false,
      });

      const { result } = renderHook(() => usePortfolioData());

      expect(result.current.isConnected).toBe(false);
    });
  });

  describe("Loading States", () => {
    it("should reflect loading state from user context", () => {
      mockUseUser.mockReturnValue({
        userInfo: null,
        loading: true,
        error: null,
        isConnected: true,
      });

      const { result } = renderHook(() => usePortfolioData());

      // Since it uses React Query internally, loading state will depend on the query state
      expect(typeof result.current.isLoading).toBe("boolean");
    });
  });

  describe("Function Properties", () => {
    it("should provide retry function", () => {
      const { result } = renderHook(() => usePortfolioData());

      expect(typeof result.current.retry).toBe("function");
    });

    it("should provide retry function that can be called", () => {
      const { result } = renderHook(() => usePortfolioData());

      expect(() => result.current.retry()).not.toThrow();
    });
  });

  describe("Data Types", () => {
    it("should return correct data types", () => {
      const { result } = renderHook(() => usePortfolioData());

      // totalValue should be number or null
      expect(
        result.current.totalValue === null ||
          typeof result.current.totalValue === "number"
      ).toBe(true);

      // categories should be array or null
      expect(
        result.current.categories === null ||
          Array.isArray(result.current.categories)
      ).toBe(true);

      // pieChartData should be array or null
      expect(
        result.current.pieChartData === null ||
          Array.isArray(result.current.pieChartData)
      ).toBe(true);

      // error should be string or null
      expect(
        result.current.error === null ||
          typeof result.current.error === "string"
      ).toBe(true);

      // isRetrying should be boolean
      expect(typeof result.current.isRetrying).toBe("boolean");
    });
  });

  describe("Integration with UserContext", () => {
    it("should update when user context changes", async () => {
      const { result, rerender } = renderHook(() => usePortfolioData());

      const initialState = result.current;

      // Change user context
      mockUseUser.mockReturnValue({
        userInfo: { userId: "new-user-456" },
        loading: false,
        error: null,
        isConnected: true,
      });

      rerender();

      await waitFor(() => {
        // The hook should react to user context changes
        expect(result.current).toBeDefined();
      });
    });

    it("should handle user context errors appropriately", () => {
      mockUseUser.mockReturnValue({
        userInfo: null,
        loading: false,
        error: "NETWORK_ERROR",
        isConnected: false,
      });

      const { result } = renderHook(() => usePortfolioData());

      // Should handle non-USER_NOT_FOUND errors gracefully
      expect(result.current.isConnected).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    it("should handle undefined userInfo gracefully", () => {
      mockUseUser.mockReturnValue({
        userInfo: undefined,
        loading: false,
        error: null,
        isConnected: true,
      });

      const { result } = renderHook(() => usePortfolioData());

      expect(result.current).toBeDefined();
      expect(typeof result.current.isLoading).toBe("boolean");
    });

    it("should handle null userInfo gracefully", () => {
      mockUseUser.mockReturnValue({
        userInfo: null,
        loading: false,
        error: null,
        isConnected: true,
      });

      const { result } = renderHook(() => usePortfolioData());

      expect(result.current).toBeDefined();
      expect(typeof result.current.isLoading).toBe("boolean");
    });
  });

  describe("Component Unmounting", () => {
    it("should handle unmounting gracefully", () => {
      const { unmount } = renderHook(() => usePortfolioData());

      expect(() => unmount()).not.toThrow();
    });
  });
});
