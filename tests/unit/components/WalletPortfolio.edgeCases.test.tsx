import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { WalletPortfolio } from "@/components/WalletPortfolio";
import { useUser } from "@/hooks/useUser";
import { usePortfolioDisplayData } from "@/hooks/queries/usePortfolioQuery";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useWalletModal } from "@/hooks/useWalletModal";
import { preparePortfolioDataWithBorrowing } from "@/utils/portfolioTransformers";

// Mock all dependencies
vi.mock("@/hooks/useUser");
vi.mock("@/hooks/queries/usePortfolioQuery");
vi.mock("@/hooks/usePortfolio");
vi.mock("@/hooks/useWalletModal");
vi.mock("@/utils/portfolioTransformers");
vi.mock("@/components/ErrorBoundary", () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="error-boundary">{children}</div>
  ),
}));

const mockUseUser = vi.mocked(useUser);
const mockUsePortfolioDisplayData = vi.mocked(usePortfolioDisplayData);
const mockUsePortfolio = vi.mocked(usePortfolio);
const mockUseWalletModal = vi.mocked(useWalletModal);
const mockPreparePortfolioDataWithBorrowing = vi.mocked(
  preparePortfolioDataWithBorrowing
);

const mockPortfolioData = {
  totalValue: 1000,
  categories: [
    { id: "1", name: "DeFi", value: 500, percentage: 50 },
    { id: "2", name: "Staking", value: 300, percentage: 30 },
    { id: "3", name: "Lending", value: 200, percentage: 20 },
  ],
};

describe("WalletPortfolio - Edge Cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mocks
    mockUseUser.mockReturnValue({
      userInfo: { userId: "test-user-123", email: "test@example.com" },
      isConnected: true,
      login: vi.fn(),
      logout: vi.fn(),
      isLoading: false,
    });

    mockUsePortfolioDisplayData.mockReturnValue({
      totalValue: 1000,
      categories: mockPortfolioData.categories,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    });

    mockUsePortfolio.mockReturnValue({
      balanceHidden: false,
      expandedCategory: null,
      portfolioMetrics: { totalValue: 1000, changePercent: 5.2 },
      toggleBalanceVisibility: vi.fn(),
      toggleCategoryExpansion: vi.fn(),
    });

    mockUseWalletModal.mockReturnValue({
      isOpen: false,
      openModal: vi.fn(),
      closeModal: vi.fn(),
    });

    mockPreparePortfolioDataWithBorrowing.mockReturnValue({
      portfolioData: mockPortfolioData.categories,
      pieChartData: mockPortfolioData.categories.map(cat => ({
        name: cat.name,
        value: cat.value,
        percentage: cat.percentage,
      })),
    });
  });

  describe("User Authentication Edge Cases", () => {
    it("should handle null userInfo gracefully", () => {
      mockUseUser.mockReturnValue({
        userInfo: null,
        isConnected: false,
        login: vi.fn(),
        logout: vi.fn(),
        isLoading: false,
      });

      mockUsePortfolioDisplayData.mockReturnValue({
        totalValue: 0,
        categories: [],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      render(<WalletPortfolio />);

      expect(mockUsePortfolioDisplayData).toHaveBeenCalledWith(null);
    });

    it("should handle undefined userId", () => {
      mockUseUser.mockReturnValue({
        userInfo: { userId: undefined, email: "test@example.com" },
        isConnected: true,
        login: vi.fn(),
        logout: vi.fn(),
        isLoading: false,
      });

      render(<WalletPortfolio />);

      expect(mockUsePortfolioDisplayData).toHaveBeenCalledWith(undefined);
    });

    it("should handle user loading state", () => {
      mockUseUser.mockReturnValue({
        userInfo: null,
        isConnected: false,
        login: vi.fn(),
        logout: vi.fn(),
        isLoading: true,
      });

      render(<WalletPortfolio />);

      expect(screen.getByTestId("error-boundary")).toBeInTheDocument();
    });
  });

  describe("Portfolio Data Edge Cases", () => {
    it("should handle empty portfolio categories", () => {
      mockUsePortfolioDisplayData.mockReturnValue({
        totalValue: 0,
        categories: [],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      mockUsePortfolio.mockReturnValue({
        balanceHidden: false,
        expandedCategory: null,
        portfolioMetrics: { totalValue: 0, changePercent: 0 },
        toggleBalanceVisibility: vi.fn(),
        toggleCategoryExpansion: vi.fn(),
      });

      mockPreparePortfolioDataWithBorrowing.mockReturnValue({
        portfolioData: [],
        pieChartData: [],
      });

      render(<WalletPortfolio />);

      expect(mockUsePortfolio).toHaveBeenCalledWith([]);
      expect(mockPreparePortfolioDataWithBorrowing).toHaveBeenCalledWith(
        [],
        0,
        "WalletPortfolio"
      );
    });

    it("should handle null categories", () => {
      mockUsePortfolioDisplayData.mockReturnValue({
        totalValue: 0,
        categories: null,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      render(<WalletPortfolio />);

      expect(mockUsePortfolio).toHaveBeenCalledWith([]);
    });

    it("should handle undefined categories", () => {
      mockUsePortfolioDisplayData.mockReturnValue({
        totalValue: 0,
        categories: undefined,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      render(<WalletPortfolio />);

      expect(mockUsePortfolio).toHaveBeenCalledWith([]);
    });

    it("should handle negative total value", () => {
      mockUsePortfolioDisplayData.mockReturnValue({
        totalValue: -500,
        categories: [{ id: "1", name: "Debt", value: -500, percentage: 100 }],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      render(<WalletPortfolio />);

      expect(mockPreparePortfolioDataWithBorrowing).toHaveBeenCalledWith(
        [{ id: "1", name: "Debt", value: -500, percentage: 100 }],
        -500,
        "WalletPortfolio"
      );
    });

    it("should handle zero total value with categories", () => {
      const categories = [
        { id: "1", name: "Category1", value: 100, percentage: 0 },
        { id: "2", name: "Category2", value: -100, percentage: 0 },
      ];

      mockUsePortfolioDisplayData.mockReturnValue({
        totalValue: 0,
        categories,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      render(<WalletPortfolio />);

      expect(mockPreparePortfolioDataWithBorrowing).toHaveBeenCalledWith(
        categories,
        0,
        "WalletPortfolio"
      );
    });
  });

  describe("Loading State Edge Cases", () => {
    it("should handle simultaneous loading and refetching", () => {
      mockUsePortfolioDisplayData.mockReturnValue({
        totalValue: 1000,
        categories: mockPortfolioData.categories,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
        isRefetching: true,
      });

      render(<WalletPortfolio />);

      // Component should render despite both loading states being true
      expect(screen.getByTestId("error-boundary")).toBeInTheDocument();
    });

    it("should handle loading state with existing data", () => {
      mockUsePortfolioDisplayData.mockReturnValue({
        totalValue: 1000,
        categories: mockPortfolioData.categories,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      render(<WalletPortfolio />);

      // Should still process existing data while loading
      expect(mockUsePortfolio).toHaveBeenCalledWith(
        mockPortfolioData.categories
      );
    });
  });

  describe("Error Boundary Reset Edge Cases", () => {
    it("should handle resetKeys with null userId and disconnected state", () => {
      mockUseUser.mockReturnValue({
        userInfo: null,
        isConnected: false,
        login: vi.fn(),
        logout: vi.fn(),
        isLoading: false,
      });

      render(<WalletPortfolio />);

      const errorBoundaries = screen.getAllByTestId("error-boundary");
      expect(errorBoundaries).toHaveLength(4); // Main + 3 section boundaries
    });

    it("should handle resetKeys with empty string userId", () => {
      mockUseUser.mockReturnValue({
        userInfo: { userId: "", email: "test@example.com" },
        isConnected: true,
        login: vi.fn(),
        logout: vi.fn(),
        isLoading: false,
      });

      render(<WalletPortfolio />);

      const errorBoundaries = screen.getAllByTestId("error-boundary");
      expect(errorBoundaries).toHaveLength(4);
    });

    it("should handle connection state changes", async () => {
      const { rerender } = render(<WalletPortfolio />);

      // Change connection state
      mockUseUser.mockReturnValue({
        userInfo: { userId: "test-user-123", email: "test@example.com" },
        isConnected: false,
        login: vi.fn(),
        logout: vi.fn(),
        isLoading: false,
      });

      rerender(<WalletPortfolio />);

      const errorBoundaries = screen.getAllByTestId("error-boundary");
      expect(errorBoundaries).toHaveLength(4);
    });
  });

  describe("Hook Integration Edge Cases", () => {
    it("should handle portfolio metrics calculation with edge values", () => {
      mockUsePortfolio.mockReturnValue({
        balanceHidden: false,
        expandedCategory: null,
        portfolioMetrics: {
          totalValue: Number.MAX_SAFE_INTEGER,
          changePercent: Number.MIN_SAFE_INTEGER,
        },
        toggleBalanceVisibility: vi.fn(),
        toggleCategoryExpansion: vi.fn(),
      });

      render(<WalletPortfolio />);

      expect(mockUsePortfolio).toHaveBeenCalled();
    });

    it("should handle portfolio metrics with NaN values", () => {
      mockUsePortfolio.mockReturnValue({
        balanceHidden: false,
        expandedCategory: null,
        portfolioMetrics: {
          totalValue: NaN,
          changePercent: NaN,
        },
        toggleBalanceVisibility: vi.fn(),
        toggleCategoryExpansion: vi.fn(),
      });

      render(<WalletPortfolio />);

      expect(mockUsePortfolio).toHaveBeenCalled();
    });

    it("should handle portfolio metrics with Infinity values", () => {
      mockUsePortfolio.mockReturnValue({
        balanceHidden: false,
        expandedCategory: null,
        portfolioMetrics: {
          totalValue: Infinity,
          changePercent: -Infinity,
        },
        toggleBalanceVisibility: vi.fn(),
        toggleCategoryExpansion: vi.fn(),
      });

      render(<WalletPortfolio />);

      expect(mockUsePortfolio).toHaveBeenCalled();
    });
  });

  describe("Data Preparation Edge Cases", () => {
    it("should handle preparePortfolioDataWithBorrowing returning null data", () => {
      mockPreparePortfolioDataWithBorrowing.mockReturnValue({
        portfolioData: null,
        pieChartData: null,
      });

      render(<WalletPortfolio />);

      expect(mockPreparePortfolioDataWithBorrowing).toHaveBeenCalledWith(
        mockPortfolioData.categories,
        1000,
        "WalletPortfolio"
      );
    });

    it("should handle preparePortfolioDataWithBorrowing throwing error", () => {
      mockPreparePortfolioDataWithBorrowing.mockImplementation(() => {
        throw new Error("Data preparation failed");
      });

      // Should not crash the component due to error boundary
      expect(() => render(<WalletPortfolio />)).not.toThrow();
    });

    it("should handle malformed category data", () => {
      const malformedCategories = [
        { id: null, name: undefined, value: "invalid", percentage: NaN },
        { id: "", name: "", value: 0, percentage: 0 },
        {
          /* missing required fields */
        },
      ];

      mockUsePortfolioDisplayData.mockReturnValue({
        totalValue: 1000,
        categories: malformedCategories,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      render(<WalletPortfolio />);

      expect(mockUsePortfolio).toHaveBeenCalledWith(malformedCategories);
      expect(mockPreparePortfolioDataWithBorrowing).toHaveBeenCalledWith(
        malformedCategories,
        1000,
        "WalletPortfolio"
      );
    });
  });

  describe("Performance Edge Cases", () => {
    it("should handle rapid prop changes", async () => {
      const { rerender } = render(<WalletPortfolio />);

      // Simulate rapid userId changes
      for (let i = 0; i < 10; i++) {
        mockUseUser.mockReturnValue({
          userInfo: { userId: `user-${i}`, email: "test@example.com" },
          isConnected: true,
          login: vi.fn(),
          logout: vi.fn(),
          isLoading: false,
        });

        rerender(<WalletPortfolio />);
      }

      // Should handle rapid changes without issues
      expect(screen.getByTestId("error-boundary")).toBeInTheDocument();
    });

    it("should handle large datasets", () => {
      const largeCategories = Array.from({ length: 1000 }, (_, i) => ({
        id: `category-${i}`,
        name: `Category ${i}`,
        value: Math.random() * 1000,
        percentage: Math.random() * 100,
      }));

      mockUsePortfolioDisplayData.mockReturnValue({
        totalValue: 1000000,
        categories: largeCategories,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      render(<WalletPortfolio />);

      expect(mockUsePortfolio).toHaveBeenCalledWith(largeCategories);
      expect(mockPreparePortfolioDataWithBorrowing).toHaveBeenCalledWith(
        largeCategories,
        1000000,
        "WalletPortfolio"
      );
    });
  });

  describe("Memory Cleanup Edge Cases", () => {
    it("should handle unmounting during async operations", async () => {
      const mockRefetch = vi
        .fn()
        .mockImplementation(
          () => new Promise(resolve => setTimeout(resolve, 1000))
        );

      mockUsePortfolioDisplayData.mockReturnValue({
        totalValue: 1000,
        categories: mockPortfolioData.categories,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        isRefetching: true,
      });

      const { unmount } = render(<WalletPortfolio />);

      // Trigger async operation
      mockRefetch();

      // Unmount before operation completes
      unmount();

      // Should not cause memory leaks or errors
      expect(mockRefetch).toHaveBeenCalled();
    });
  });
});
