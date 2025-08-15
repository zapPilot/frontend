import { renderHook, waitFor, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useUser } from "../../../src/contexts/UserContext";
import { usePortfolioData } from "../../../src/hooks/usePortfolioData";
import { getPortfolioSummary } from "../../../src/services/quantEngine";
import { transformPortfolioSummary } from "../../../src/utils/portfolioTransformers";

// Mock the UserContext
vi.mock("../../../src/contexts/UserContext", () => ({
  useUser: vi.fn(),
}));

// Mock the services module
vi.mock("../../../src/services/quantEngine", () => ({
  getPortfolioSummary: vi.fn(),
}));

// Mock the transformers
vi.mock("../../../src/utils/portfolioTransformers", () => ({
  transformPortfolioSummary: vi.fn(),
  portfolioStateUtils: {
    hasItems: vi.fn(
      (array: any[] | null | undefined) =>
        Array.isArray(array) && array.length > 0
    ),
    isEmptyArray: vi.fn(
      (array: any[] | null | undefined) =>
        !Array.isArray(array) || array.length === 0
    ),
  },
}));

const mockGetPortfolioSummary = getPortfolioSummary as vi.MockedFunction<
  typeof getPortfolioSummary
>;
const mockTransformPortfolioSummary =
  transformPortfolioSummary as vi.MockedFunction<
    typeof transformPortfolioSummary
  >;
const mockUseUser = useUser as vi.MockedFunction<typeof useUser>;

describe("usePortfolioData", () => {
  const mockUserId = "test-user-123";
  const mockApiResponse = {
    metrics: {
      total_value_usd: 50000,
      wallets_included: 1,
    },
    categories: [
      {
        category: "btc",
        positions: [{ symbol: "BTC", total_usd_value: 50000 }],
      },
    ],
  };

  const mockTransformedData = {
    categories: [
      {
        name: "btc",
        totalValue: 50000,
        percentage: 100,
        color: "#f7931a",
        assets: [
          {
            symbol: "BTC",
            totalValue: 50000,
            percentage: 100,
            amount: 1.5,
            price: 33333,
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPortfolioSummary.mockResolvedValue(mockApiResponse);
    mockTransformPortfolioSummary.mockReturnValue(mockTransformedData);
    mockUseUser.mockReturnValue({
      userInfo: { userId: mockUserId },
      loading: false,
    });
  });

  describe("Initial State", () => {
    it("starts with loading state and no data", () => {
      mockUseUser.mockReturnValue({
        userInfo: { userId: mockUserId },
        loading: false,
      });

      let result: any;
      act(() => {
        result = renderHook(() => usePortfolioData()).result;
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.totalValue).toBeNull();
      expect(result.current.categories).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it("does not fetch when userId is undefined", () => {
      mockUseUser.mockReturnValue({
        userInfo: null,
        loading: false,
      });

      renderHook(() => usePortfolioData());

      expect(mockGetPortfolioSummary).not.toHaveBeenCalled();
    });

    it("does not fetch when user is loading", () => {
      mockUseUser.mockReturnValue({
        userInfo: null,
        loading: true,
      });

      renderHook(() => usePortfolioData());

      expect(mockGetPortfolioSummary).not.toHaveBeenCalled();
    });
  });

  describe("Successful Data Fetching", () => {
    it("fetches and transforms portfolio data successfully", async () => {
      const { result } = renderHook(() => usePortfolioData());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGetPortfolioSummary).toHaveBeenCalledWith(mockUserId, true);
      expect(mockTransformPortfolioSummary).toHaveBeenCalledWith(
        mockApiResponse
      );
      expect(result.current.totalValue).toBe(50000);
      expect(result.current.categories).toEqual(mockTransformedData.categories);
      expect(result.current.error).toBeNull();
    });

    it("updates data when userId changes", async () => {
      const { result, rerender } = renderHook(() => usePortfolioData());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGetPortfolioSummary).toHaveBeenCalledTimes(1);

      // Change userId in context
      const newUserId = "new-user-456";
      mockUseUser.mockReturnValue({
        userInfo: { userId: newUserId },
        loading: false,
      });

      rerender();

      await waitFor(() => {
        expect(mockGetPortfolioSummary).toHaveBeenCalledWith(newUserId, true);
      });

      expect(mockGetPortfolioSummary).toHaveBeenCalledTimes(2);
    });

    it("handles empty portfolio data correctly", async () => {
      const emptyApiResponse = {
        metrics: { total_value_usd: 0, wallets_included: 0 },
        categories: [],
      };

      mockGetPortfolioSummary.mockResolvedValueOnce(emptyApiResponse);

      const { result } = renderHook(() => usePortfolioData());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.totalValue).toBe(0);
      expect(result.current.categories).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe("Error Handling", () => {
    it("handles API fetch errors", async () => {
      const fetchError = new Error("API fetch failed");
      mockGetPortfolioSummary.mockRejectedValueOnce(fetchError);

      const { result } = renderHook(() => usePortfolioData());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe("API fetch failed");
      expect(result.current.totalValue).toBeNull();
      expect(result.current.categories).toBeNull();
    });

    it("handles transformation errors", async () => {
      const transformError = new Error("Transformation failed");
      mockTransformPortfolioSummary.mockImplementationOnce(() => {
        throw transformError;
      });

      const { result } = renderHook(() => usePortfolioData());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe("Transformation failed");
      expect(result.current.totalValue).toBeNull();
      expect(result.current.categories).toBeNull();
    });

    it("handles network timeout errors", async () => {
      const timeoutError = new Error("Request timeout");
      mockGetPortfolioSummary.mockRejectedValueOnce(timeoutError);

      const { result } = renderHook(() => usePortfolioData());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe("Request timeout");
    });

    it("resets error state on successful retry", async () => {
      // First call fails
      const fetchError = new Error("API fetch failed");
      mockGetPortfolioSummary.mockRejectedValueOnce(fetchError);

      const { result, rerender } = renderHook(() => usePortfolioData());

      await waitFor(() => {
        expect(result.current.error).toBe("API fetch failed");
      });

      // Reset mocks and set up successful response
      mockGetPortfolioSummary.mockReset();
      mockTransformPortfolioSummary.mockReset();
      mockGetPortfolioSummary.mockResolvedValue(mockApiResponse);
      mockTransformPortfolioSummary.mockReturnValue(mockTransformedData);

      // Change userId to trigger refetch
      mockUseUser.mockReturnValue({
        userInfo: { userId: "new-user-retry" },
        loading: false,
      });

      // Trigger re-render
      rerender();

      await waitFor(() => {
        expect(result.current.error).toBeNull();
        expect(result.current.totalValue).toBe(50000);
      });
    });
  });

  describe("Loading States", () => {
    it("shows loading during initial fetch", () => {
      // Mock a delayed response
      mockGetPortfolioSummary.mockImplementationOnce(
        () =>
          new Promise(resolve =>
            setTimeout(() => resolve(mockApiResponse), 100)
          )
      );

      const { result } = renderHook(() => usePortfolioData());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.totalValue).toBeNull();
      expect(result.current.categories).toBeNull();
    });

    it("shows loading when userId changes", async () => {
      const { result, rerender } = renderHook(() => usePortfolioData());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Mock delayed response for new user
      mockGetPortfolioSummary.mockImplementationOnce(
        () =>
          new Promise(resolve =>
            setTimeout(() => resolve(mockApiResponse), 100)
          )
      );

      const newUserId = "new-user-456";
      mockUseUser.mockReturnValue({
        userInfo: { userId: newUserId },
        loading: false,
      });

      rerender();

      expect(result.current.isLoading).toBe(true);
    });

    it("handles rapid userId changes correctly", async () => {
      mockUseUser.mockReturnValue({
        userInfo: { userId: "user1" },
        loading: false,
      });

      const { rerender } = renderHook(() => usePortfolioData());

      // Rapidly change userIds in context
      mockUseUser.mockReturnValue({
        userInfo: { userId: "user2" },
        loading: false,
      });
      rerender();

      mockUseUser.mockReturnValue({
        userInfo: { userId: "user3" },
        loading: false,
      });
      rerender();

      mockUseUser.mockReturnValue({
        userInfo: { userId: "user4" },
        loading: false,
      });
      rerender();

      await waitFor(() => {
        // Should only call for the latest userId
        expect(mockGetPortfolioSummary).toHaveBeenLastCalledWith("user4", true);
      });
    });
  });

  describe("Data Consistency", () => {
    it("maintains referential stability for categories array when data unchanged", async () => {
      const { result, rerender } = renderHook(() => usePortfolioData());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const firstCategories = result.current.categories;

      // Re-render with same data
      rerender();

      await waitFor(() => {
        expect(result.current.categories).toBe(firstCategories);
      });
    });

    it("validates transformed data structure", async () => {
      const invalidTransformedData = {
        categories: null, // Should be array
      };

      mockTransformPortfolioSummary.mockReturnValueOnce(
        invalidTransformedData as any
      );

      const { result } = renderHook(() => usePortfolioData());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Hook should handle invalid data gracefully
      expect(result.current.totalValue).toBe(50000); // From metrics
      expect(result.current.categories).toBeNull();
    });
  });

  describe("Cleanup and Memory Management", () => {
    it("cleans up on unmount", async () => {
      const { unmount } = renderHook(() => usePortfolioData());

      unmount();

      // Hook should not throw or cause memory leaks on unmount
      expect(() => unmount()).not.toThrow();
    });

    it("handles component unmount during async operation", async () => {
      // Create a delayed promise
      let resolvePromise: (value: any) => void;
      const delayedPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      mockGetPortfolioSummary.mockReturnValueOnce(delayedPromise);

      const { unmount } = renderHook(() => usePortfolioData());

      // Unmount before promise resolves
      unmount();

      // Resolve the promise after unmount
      resolvePromise!(mockApiResponse);

      // Should not throw errors or update state after unmount
      await new Promise(resolve => setTimeout(resolve, 10));
    });
  });

  describe("Edge Cases", () => {
    it("handles null API response", async () => {
      mockGetPortfolioSummary.mockResolvedValueOnce(null as any);

      const { result } = renderHook(() => usePortfolioData());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.totalValue).toBeNull();
      expect(result.current.categories).toBeNull();
    });

    it("handles undefined API response", async () => {
      mockGetPortfolioSummary.mockResolvedValueOnce(undefined as any);

      const { result } = renderHook(() => usePortfolioData());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.totalValue).toBeNull();
      expect(result.current.categories).toBeNull();
    });

    it("handles very large portfolio values", async () => {
      const largeValueResponse = {
        metrics: {
          total_value_usd: 999999999999,
          wallets_included: 5,
        },
        categories: [
          {
            category: "btc",
            total_usd_value: 999999999999,
            positions: [],
          },
        ],
      };

      const largeTransformedData = {
        categories: [],
      };

      mockGetPortfolioSummary.mockResolvedValueOnce(largeValueResponse);
      mockTransformPortfolioSummary.mockReturnValueOnce(largeTransformedData);

      const { result } = renderHook(() => usePortfolioData());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.totalValue).toBe(999999999999);
    });
  });
});
