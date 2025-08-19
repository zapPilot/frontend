import { act } from "@testing-library/react";
import { renderHook } from "../../test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePortfolio } from "../../../src/hooks/usePortfolio";
import { usePortfolioData } from "../../../src/hooks/usePortfolioData";
import { useWalletModal } from "../../../src/hooks/useWalletModal";
import { useWalletPortfolioState } from "../../../src/hooks/useWalletPortfolioState";
import { AssetCategory, PieChartData } from "../../../src/types/portfolio";
import { preparePortfolioDataWithBorrowing } from "../../../src/utils/portfolioTransformers";

// Mock all dependencies
vi.mock("../../../src/hooks/usePortfolioData");
vi.mock("../../../src/hooks/usePortfolio");
vi.mock("../../../src/hooks/useWalletModal");
vi.mock("../../../src/utils/portfolioTransformers");

describe("useWalletPortfolioState - Comprehensive Hook Integration Tests", () => {
  const mockUsePortfolioData = vi.mocked(usePortfolioData);
  const mockUsePortfolio = vi.mocked(usePortfolio);
  const mockUseWalletModal = vi.mocked(useWalletModal);
  const mockPreparePortfolioDataWithBorrowing = vi.mocked(
    preparePortfolioDataWithBorrowing
  );

  const mockApiCategoriesData: AssetCategory[] = [
    {
      id: "1",
      name: "BTC",
      totalValue: 10000,
      percentage: 50,
      color: "#F7931A",
      assets: [],
    },
    {
      id: "2",
      name: "ETH",
      totalValue: 6000,
      percentage: 30,
      color: "#627EEA",
      assets: [],
    },
  ];

  const mockPieChartData: PieChartData[] = [
    { label: "BTC", value: 10000, percentage: 50, color: "#F7931A" },
    { label: "ETH", value: 6000, percentage: 30, color: "#627EEA" },
  ];

  const mockPortfolioDataReturn = {
    portfolioData: mockApiCategoriesData,
    pieChartData: mockPieChartData,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockUsePortfolioData.mockReturnValue({
      totalValue: 16000,
      categories: mockApiCategoriesData,
      isLoading: false,
      error: null,
      retry: vi.fn(),
      isRetrying: false,
    });

    mockUsePortfolio.mockReturnValue({
      balanceHidden: false,
      expandedCategory: null,
      portfolioMetrics: { totalChangePercentage: 8.5 },
      toggleBalanceVisibility: vi.fn(),
      toggleCategoryExpansion: vi.fn(),
    });

    mockUseWalletModal.mockReturnValue({
      isOpen: false,
      openModal: vi.fn(),
      closeModal: vi.fn(),
    });

    mockPreparePortfolioDataWithBorrowing.mockReturnValue(
      mockPortfolioDataReturn
    );
  });

  describe("Hook Integration and Data Flow", () => {
    it("should integrate all hooks and return consolidated state", () => {
      const { result } = renderHook(() => useWalletPortfolioState());

      expect(result.current).toEqual({
        // API data and loading states
        totalValue: 16000,
        portfolioData: mockApiCategoriesData,
        pieChartData: mockPieChartData,
        isLoading: false,
        apiError: null,
        retry: expect.any(Function),
        isRetrying: false,

        // Portfolio UI state
        balanceHidden: false,
        expandedCategory: null,
        portfolioMetrics: { totalChangePercentage: 8.5 },
        toggleBalanceVisibility: expect.any(Function),
        toggleCategoryExpansion: expect.any(Function),

        // Wallet modal state
        isWalletManagerOpen: false,
        openWalletManager: expect.any(Function),
        closeWalletManager: expect.any(Function),
      });
    });

    it("should call usePortfolio with correct apiCategoriesData", () => {
      renderHook(() => useWalletPortfolioState());

      expect(mockUsePortfolio).toHaveBeenCalledWith(mockApiCategoriesData);
    });

    it("should call preparePortfolioDataWithBorrowing with correct parameters", () => {
      renderHook(() => useWalletPortfolioState());

      expect(mockPreparePortfolioDataWithBorrowing).toHaveBeenCalledWith(
        mockApiCategoriesData,
        16000,
        "useWalletPortfolioState"
      );
    });

    it("should handle null apiCategoriesData gracefully", () => {
      mockUsePortfolioData.mockReturnValue({
        totalValue: null,
        categories: null,
        isLoading: true,
        error: null,
        retry: vi.fn(),
        isRetrying: false,
      });

      renderHook(() => useWalletPortfolioState());

      expect(mockUsePortfolio).toHaveBeenCalledWith([]);
      expect(mockPreparePortfolioDataWithBorrowing).toHaveBeenCalledWith(
        null,
        null,
        "useWalletPortfolioState"
      );
    });
  });

  describe("Loading States Integration", () => {
    it("should handle loading state from usePortfolioData", () => {
      mockUsePortfolioData.mockReturnValue({
        totalValue: null,
        categories: null,
        isLoading: true,
        error: null,
        retry: vi.fn(),
        isRetrying: false,
      });

      const { result } = renderHook(() => useWalletPortfolioState());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.totalValue).toBe(null);
      expect(result.current.portfolioData).toBe(
        mockPortfolioDataReturn.portfolioData
      );
      expect(result.current.pieChartData).toBe(
        mockPortfolioDataReturn.pieChartData
      );
    });

    it("should handle retry loading state", () => {
      const mockRetry = vi.fn();
      mockUsePortfolioData.mockReturnValue({
        totalValue: 16000,
        categories: mockApiCategoriesData,
        isLoading: false,
        error: null,
        retry: mockRetry,
        isRetrying: true,
      });

      const { result } = renderHook(() => useWalletPortfolioState());

      expect(result.current.isRetrying).toBe(true);
      expect(result.current.retry).toBe(mockRetry);
    });

    it("should maintain stability during loading transitions", async () => {
      const { result, rerender } = renderHook(() => useWalletPortfolioState());

      // Capture initial state
      const initialState = result.current;

      // Simulate transition to loading
      mockUsePortfolioData.mockReturnValue({
        totalValue: null,
        categories: null,
        isLoading: true,
        error: null,
        retry: vi.fn(),
        isRetrying: false,
      });

      rerender();

      // Functions should remain stable
      expect(result.current.toggleBalanceVisibility).toBe(
        initialState.toggleBalanceVisibility
      );
      expect(result.current.toggleCategoryExpansion).toBe(
        initialState.toggleCategoryExpansion
      );
      expect(result.current.openWalletManager).toBe(
        initialState.openWalletManager
      );
      expect(result.current.closeWalletManager).toBe(
        initialState.closeWalletManager
      );
    });
  });

  describe("Error States Integration", () => {
    it("should handle API errors from usePortfolioData", () => {
      const errorMessage = "Failed to fetch portfolio data";
      mockUsePortfolioData.mockReturnValue({
        totalValue: null,
        categories: null,
        isLoading: false,
        error: errorMessage,
        retry: vi.fn(),
        isRetrying: false,
      });

      const { result } = renderHook(() => useWalletPortfolioState());

      expect(result.current.apiError).toBe(errorMessage);
      expect(result.current.isLoading).toBe(false);
    });

    it("should clear error state when data loads successfully", async () => {
      // Start with error state
      mockUsePortfolioData.mockReturnValue({
        totalValue: null,
        categories: null,
        isLoading: false,
        error: "API Error",
        retry: vi.fn(),
        isRetrying: false,
      });

      const { result, rerender } = renderHook(() => useWalletPortfolioState());

      expect(result.current.apiError).toBe("API Error");

      // Simulate successful data load
      mockUsePortfolioData.mockReturnValue({
        totalValue: 16000,
        categories: mockApiCategoriesData,
        isLoading: false,
        error: null,
        retry: vi.fn(),
        isRetrying: false,
      });

      rerender();

      expect(result.current.apiError).toBe(null);
      expect(result.current.totalValue).toBe(16000);
    });

    it("should handle error during retry", () => {
      const mockRetry = vi.fn();
      mockUsePortfolioData.mockReturnValue({
        totalValue: null,
        categories: null,
        isLoading: false,
        error: "Retry failed",
        retry: mockRetry,
        isRetrying: true,
      });

      const { result } = renderHook(() => useWalletPortfolioState());

      expect(result.current.apiError).toBe("Retry failed");
      expect(result.current.isRetrying).toBe(true);
      expect(result.current.retry).toBe(mockRetry);
    });
  });

  describe("Data Transformation Integration", () => {
    it("should pass correct data to preparePortfolioData", () => {
      renderHook(() => useWalletPortfolioState());

      expect(mockPreparePortfolioDataWithBorrowing).toHaveBeenCalledTimes(1);
      expect(mockPreparePortfolioDataWithBorrowing).toHaveBeenCalledWith(
        mockApiCategoriesData,
        16000,
        "useWalletPortfolioState"
      );
    });

    it("should handle preparePortfolioData with null inputs", () => {
      mockUsePortfolioData.mockReturnValue({
        totalValue: null,
        categories: null,
        isLoading: false,
        error: null,
        retry: vi.fn(),
        isRetrying: false,
      });

      renderHook(() => useWalletPortfolioState());

      expect(mockPreparePortfolioDataWithBorrowing).toHaveBeenCalledWith(
        null,
        null,
        "useWalletPortfolioState"
      );
    });

    it("should handle empty categories data", () => {
      mockUsePortfolioData.mockReturnValue({
        totalValue: 0,
        categories: [],
        isLoading: false,
        error: null,
        retry: vi.fn(),
        isRetrying: false,
      });

      renderHook(() => useWalletPortfolioState());

      expect(mockPreparePortfolioDataWithBorrowing).toHaveBeenCalledWith(
        [],
        0,
        "useWalletPortfolioState"
      );
    });

    it("should re-calculate when data changes", () => {
      const { rerender } = renderHook(() => useWalletPortfolioState());

      expect(mockPreparePortfolioDataWithBorrowing).toHaveBeenCalledTimes(1);

      // Change data
      const newCategoriesData: AssetCategory[] = [
        {
          id: "3",
          name: "USDC",
          totalValue: 5000,
          percentage: 100,
          color: "#2775CA",
          assets: [],
        },
      ];

      mockUsePortfolioData.mockReturnValue({
        totalValue: 5000,
        categories: newCategoriesData,
        isLoading: false,
        error: null,
        retry: vi.fn(),
        isRetrying: false,
      });

      rerender();

      expect(mockPreparePortfolioDataWithBorrowing).toHaveBeenCalledTimes(2);
      expect(mockPreparePortfolioDataWithBorrowing).toHaveBeenLastCalledWith(
        newCategoriesData,
        5000,
        "useWalletPortfolioState"
      );
    });

    it("should handle preparePortfolioData errors gracefully", () => {
      mockPreparePortfolioDataWithBorrowing.mockImplementation(() => {
        throw new Error("Transform error");
      });

      expect(() => {
        renderHook(() => useWalletPortfolioState());
      }).toThrow("Transform error");
    });
  });

  describe("Portfolio UI State Integration", () => {
    it("should handle balance visibility toggle", () => {
      const mockToggleBalance = vi.fn();
      mockUsePortfolio.mockReturnValue({
        balanceHidden: true,
        expandedCategory: null,
        portfolioMetrics: { totalChangePercentage: 8.5 },
        toggleBalanceVisibility: mockToggleBalance,
        toggleCategoryExpansion: vi.fn(),
      });

      const { result } = renderHook(() => useWalletPortfolioState());

      expect(result.current.balanceHidden).toBe(true);
      expect(result.current.toggleBalanceVisibility).toBe(mockToggleBalance);

      result.current.toggleBalanceVisibility();
      expect(mockToggleBalance).toHaveBeenCalledTimes(1);
    });

    it("should handle category expansion", () => {
      const mockToggleCategory = vi.fn();
      mockUsePortfolio.mockReturnValue({
        balanceHidden: false,
        expandedCategory: "btc",
        portfolioMetrics: { totalChangePercentage: 8.5 },
        toggleBalanceVisibility: vi.fn(),
        toggleCategoryExpansion: mockToggleCategory,
      });

      const { result } = renderHook(() => useWalletPortfolioState());

      expect(result.current.expandedCategory).toBe("btc");
      expect(result.current.toggleCategoryExpansion).toBe(mockToggleCategory);

      result.current.toggleCategoryExpansion("eth");
      expect(mockToggleCategory).toHaveBeenCalledWith("eth");
    });

    it("should handle portfolio metrics", () => {
      const mockMetrics = { totalChangePercentage: -5.2 };
      mockUsePortfolio.mockReturnValue({
        balanceHidden: false,
        expandedCategory: null,
        portfolioMetrics: mockMetrics,
        toggleBalanceVisibility: vi.fn(),
        toggleCategoryExpansion: vi.fn(),
      });

      const { result } = renderHook(() => useWalletPortfolioState());

      expect(result.current.portfolioMetrics).toBe(mockMetrics);
    });

    it("should pass empty array to usePortfolio when categories is null", () => {
      mockUsePortfolioData.mockReturnValue({
        totalValue: null,
        categories: null,
        isLoading: true,
        error: null,
        retry: vi.fn(),
        isRetrying: false,
      });

      renderHook(() => useWalletPortfolioState());

      expect(mockUsePortfolio).toHaveBeenCalledWith([]);
    });
  });

  describe("Wallet Modal Integration", () => {
    it("should handle wallet modal open/close state", () => {
      const mockOpenModal = vi.fn();
      const mockCloseModal = vi.fn();

      mockUseWalletModal.mockReturnValue({
        isOpen: true,
        openModal: mockOpenModal,
        closeModal: mockCloseModal,
      });

      const { result } = renderHook(() => useWalletPortfolioState());

      expect(result.current.isWalletManagerOpen).toBe(true);
      expect(result.current.openWalletManager).toBe(mockOpenModal);
      expect(result.current.closeWalletManager).toBe(mockCloseModal);

      result.current.openWalletManager();
      expect(mockOpenModal).toHaveBeenCalledTimes(1);

      result.current.closeWalletManager();
      expect(mockCloseModal).toHaveBeenCalledTimes(1);
    });

    it("should handle modal state changes", async () => {
      const { result, rerender } = renderHook(() => useWalletPortfolioState());

      expect(result.current.isWalletManagerOpen).toBe(false);

      // Simulate modal opening
      mockUseWalletModal.mockReturnValue({
        isOpen: true,
        openModal: vi.fn(),
        closeModal: vi.fn(),
      });

      rerender();

      expect(result.current.isWalletManagerOpen).toBe(true);
    });
  });

  describe("Performance and Memory Management", () => {
    it("should handle rapid hook updates without memory leaks", async () => {
      const { result, rerender, unmount } = renderHook(() =>
        useWalletPortfolioState()
      );

      // Simulate rapid updates
      for (let i = 0; i < 100; i++) {
        mockUsePortfolioData.mockReturnValue({
          totalValue: i * 1000,
          categories: mockApiCategoriesData,
          isLoading: false,
          error: null,
          retry: vi.fn(),
          isRetrying: false,
        });
        rerender();
      }

      expect(result.current.totalValue).toBe(99000);

      // Cleanup
      unmount();
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it("should maintain function reference stability", () => {
      const { result, rerender } = renderHook(() => useWalletPortfolioState());

      const initialFunctions = {
        toggleBalanceVisibility: result.current.toggleBalanceVisibility,
        toggleCategoryExpansion: result.current.toggleCategoryExpansion,
        openWalletManager: result.current.openWalletManager,
        closeWalletManager: result.current.closeWalletManager,
      };

      // Trigger re-render with same mock returns
      rerender();

      expect(result.current.toggleBalanceVisibility).toBe(
        initialFunctions.toggleBalanceVisibility
      );
      expect(result.current.toggleCategoryExpansion).toBe(
        initialFunctions.toggleCategoryExpansion
      );
      expect(result.current.openWalletManager).toBe(
        initialFunctions.openWalletManager
      );
      expect(result.current.closeWalletManager).toBe(
        initialFunctions.closeWalletManager
      );
    });

    it("should handle concurrent state updates", async () => {
      const { result } = renderHook(() => useWalletPortfolioState());

      // Simulate concurrent updates
      await act(async () => {
        result.current.toggleBalanceVisibility();
        result.current.toggleCategoryExpansion("btc");
        result.current.openWalletManager();
      });

      // All functions should have been called
      expect(mockUsePortfolio().toggleBalanceVisibility).toHaveBeenCalled();
      expect(mockUsePortfolio().toggleCategoryExpansion).toHaveBeenCalledWith(
        "btc"
      );
      expect(mockUseWalletModal().openModal).toHaveBeenCalled();
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle usePortfolioData throwing error", () => {
      mockUsePortfolioData.mockImplementation(() => {
        throw new Error("Portfolio data hook error");
      });

      expect(() => {
        renderHook(() => useWalletPortfolioState());
      }).toThrow("Portfolio data hook error");
    });

    it("should handle usePortfolio throwing error", () => {
      mockUsePortfolio.mockImplementation(() => {
        throw new Error("Portfolio hook error");
      });

      expect(() => {
        renderHook(() => useWalletPortfolioState());
      }).toThrow("Portfolio hook error");
    });

    it("should handle useWalletModal throwing error", () => {
      mockUseWalletModal.mockImplementation(() => {
        throw new Error("Wallet modal hook error");
      });

      expect(() => {
        renderHook(() => useWalletPortfolioState());
      }).toThrow("Wallet modal hook error");
    });

    it("should handle missing properties in hook returns", () => {
      mockUsePortfolioData.mockReturnValue({
        // Missing some required properties
        totalValue: 1000,
      } as any);

      mockUsePortfolio.mockReturnValue({
        balanceHidden: false,
      } as any);

      mockUseWalletModal.mockReturnValue({
        isOpen: false,
      } as any);

      const { result } = renderHook(() => useWalletPortfolioState());

      expect(result.current.totalValue).toBe(1000);
      expect(result.current.balanceHidden).toBe(false);
      expect(result.current.isWalletManagerOpen).toBe(false);
      // Other properties should be undefined but not cause crashes
    });

    it("should handle extreme data values", () => {
      mockUsePortfolioData.mockReturnValue({
        totalValue: Number.MAX_SAFE_INTEGER,
        categories: mockApiCategoriesData,
        isLoading: false,
        error: null,
        retry: vi.fn(),
        isRetrying: false,
      });

      const { result } = renderHook(() => useWalletPortfolioState());

      expect(result.current.totalValue).toBe(Number.MAX_SAFE_INTEGER);
      expect(mockPreparePortfolioDataWithBorrowing).toHaveBeenCalledWith(
        mockApiCategoriesData,
        Number.MAX_SAFE_INTEGER,
        "useWalletPortfolioState"
      );
    });

    it("should handle circular reference in categories data", () => {
      const circularData: any = {
        id: "1",
        name: "Test",
        totalValue: 1000,
        percentage: 100,
        color: "#000000",
        assets: [],
      };
      circularData.self = circularData; // Create circular reference

      mockUsePortfolioData.mockReturnValue({
        totalValue: 1000,
        categories: [circularData],
        isLoading: false,
        error: null,
        retry: vi.fn(),
        isRetrying: false,
      });

      // Should not crash despite circular reference
      const { result } = renderHook(() => useWalletPortfolioState());

      expect(result.current.totalValue).toBe(1000);
    });
  });

  describe("Hook Dependencies and Re-renders", () => {
    it("should re-run when usePortfolioData dependencies change", () => {
      const { rerender } = renderHook(() => useWalletPortfolioState());

      expect(mockPreparePortfolioDataWithBorrowing).toHaveBeenCalledTimes(1);

      // Change usePortfolioData return value
      mockUsePortfolioData.mockReturnValue({
        totalValue: 20000,
        categories: [],
        isLoading: false,
        error: null,
        retry: vi.fn(),
        isRetrying: false,
      });

      rerender();

      expect(mockPreparePortfolioDataWithBorrowing).toHaveBeenCalledTimes(2);
      expect(mockUsePortfolio).toHaveBeenCalledWith([]);
    });

    it("should not cause infinite re-renders", () => {
      let renderCount = 0;

      const TestHook = () => {
        renderCount++;
        return useWalletPortfolioState();
      };

      renderHook(TestHook);

      // Allow for a few renders due to hook dependencies
      expect(renderCount).toBeLessThan(10);
    });

    it("should handle async state changes gracefully", async () => {
      const { result, rerender } = renderHook(() => useWalletPortfolioState());

      // Simulate async data loading
      mockUsePortfolioData.mockReturnValue({
        totalValue: null,
        categories: null,
        isLoading: true,
        error: null,
        retry: vi.fn(),
        isRetrying: false,
      });

      rerender();

      expect(result.current.isLoading).toBe(true);

      // Simulate data arrival
      await act(async () => {
        mockUsePortfolioData.mockReturnValue({
          totalValue: 25000,
          categories: mockApiCategoriesData,
          isLoading: false,
          error: null,
          retry: vi.fn(),
          isRetrying: false,
        });

        rerender();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.totalValue).toBe(25000);
    });
  });
});
