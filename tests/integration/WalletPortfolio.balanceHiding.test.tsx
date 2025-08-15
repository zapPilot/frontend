import {
  act,
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WalletPortfolio } from "../../src/components/WalletPortfolio";
import { useUser } from "../../src/contexts/UserContext";
import { usePortfolioData } from "../../src/hooks/usePortfolioData";

// Mock dependencies
vi.mock("../../src/contexts/UserContext");
vi.mock("../../src/hooks/usePortfolioData");
vi.mock("../../src/services/quantEngine");

// Mock framer-motion for simpler testing
vi.mock("framer-motion", () => ({
  motion: {
    div: vi.fn(({ children, ...props }) => <div {...props}>{children}</div>),
    circle: vi.fn(({ children, ...props }) => (
      <circle {...props}>{children}</circle>
    )),
  },
}));

// Mock child components with testable outputs
vi.mock("../../src/components/WalletManager", () => ({
  WalletManager: vi.fn(
    ({ isOpen }: { isOpen: boolean; onClose: () => void }) =>
      isOpen ? <div data-testid="wallet-manager">Wallet Manager</div> : null
  ),
}));

vi.mock("../../src/components/ui", () => ({
  GlassCard: vi.fn(({ children }: { children: React.ReactNode }) => (
    <div data-testid="glass-card">{children}</div>
  )),
  WalletConnectionPrompt: vi.fn(() => (
    <div data-testid="wallet-connection-prompt">Connect Wallet</div>
  )),
}));

// Mock wallet components that show/hide balance
vi.mock("../../src/components/wallet/WalletHeader", () => ({
  WalletHeader: vi.fn(
    ({
      onToggleBalance,
      balanceHidden,
    }: {
      onToggleBalance: () => void;
      balanceHidden: boolean;
      onAnalyticsClick?: () => void;
      onWalletManagerClick?: () => void;
    }) => (
      <div data-testid="wallet-header">
        <button
          data-testid="toggle-balance-btn"
          onClick={onToggleBalance}
          aria-label={balanceHidden ? "Show Balance" : "Hide Balance"}
        >
          {balanceHidden ? "Show Balance" : "Hide Balance"}
        </button>
        <span data-testid="balance-state">
          {balanceHidden ? "hidden" : "visible"}
        </span>
      </div>
    )
  ),
}));

vi.mock("../../src/components/wallet/WalletMetrics", () => ({
  WalletMetrics: vi.fn(
    ({
      totalValue,
      balanceHidden,
    }: {
      totalValue: number | null;
      balanceHidden: boolean;
      isLoading?: boolean;
      error?: string | null;
      portfolioChangePercentage?: number;
      onRetry?: () => void;
      isRetrying?: boolean;
    }) => (
      <div data-testid="wallet-metrics">
        <div data-testid="total-value">
          {balanceHidden
            ? "••••••••"
            : `$${totalValue?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}`}
        </div>
        <div data-testid="balance-visibility">
          {balanceHidden ? "hidden" : "visible"}
        </div>
      </div>
    )
  ),
}));

vi.mock("../../src/components/wallet/WalletActions", () => ({
  WalletActions: vi.fn(() => <div data-testid="wallet-actions">Actions</div>),
}));

// Mock PortfolioOverview to verify props are passed correctly
vi.mock("../../src/components/PortfolioOverview", () => ({
  PortfolioOverview: vi.fn(
    ({
      renderBalanceDisplay,
      balanceHidden,
      pieChartData,
      totalValue,
    }: {
      renderBalanceDisplay?: () => React.ReactNode;
      balanceHidden?: boolean;
      pieChartData: any[];
      totalValue?: number;
    }) => (
      <div data-testid="portfolio-overview">
        <div data-testid="pie-chart-mock">
          <div data-testid="pie-chart-balance">
            {renderBalanceDisplay
              ? renderBalanceDisplay()
              : `$${totalValue?.toFixed(2) || "0.00"}`}
          </div>
          <div data-testid="pie-chart-visibility-state">
            {balanceHidden ? "hidden" : "visible"}
          </div>
        </div>
        <div data-testid="portfolio-data-count">
          {pieChartData?.length || 0}
        </div>
      </div>
    )
  ),
}));

const mockUseUser = useUser as ReturnType<typeof vi.fn>;
const mockUsePortfolioData = usePortfolioData as ReturnType<typeof vi.fn>;

// Mock data defined inline
const mockUserInfo = {
  userId: "test-user-123",
  primaryWallet: "0x1234567890abcdef1234567890abcdef12345678",
  email: "test@example.com",
};

const mockPortfolioData = [
  {
    name: "DeFi",
    totalValue: 15000,
    percentage: 60,
    color: "#8B5CF6",
    assets: [
      {
        protocol: "Uniswap",
        symbol: "UNI",
        name: "Uniswap",
        amount: 1000,
        value: 5000,
        price: 5.0,
        change24h: 2.5,
        address: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
      },
    ],
  },
  {
    name: "CEX",
    totalValue: 7500,
    percentage: 30,
    color: "#06B6D4",
    assets: [],
  },
  {
    name: "NFTs",
    totalValue: 2500,
    percentage: 10,
    color: "#F59E0B",
    assets: [],
  },
];

describe("WalletPortfolio - Balance Hiding Integration", () => {
  beforeEach(() => {
    // Default mock implementations
    mockUseUser.mockReturnValue({
      userInfo: mockUserInfo,
      loading: false,
      error: null,
      isConnected: true,
      connectedWallet: mockUserInfo.primaryWallet,
      fetchUserInfo: vi.fn(),
      clearUserInfo: vi.fn(),
    });

    mockUsePortfolioData.mockReturnValue({
      totalValue: 25000,
      categories: mockPortfolioData,
      pieChartData: [
        { label: "DeFi", value: 15000, percentage: 60, color: "#8B5CF6" },
        { label: "CEX", value: 7500, percentage: 30, color: "#06B6D4" },
        { label: "NFTs", value: 2500, percentage: 10, color: "#F59E0B" },
      ],
      isLoading: false,
      error: null,
      retry: vi.fn(),
      isRetrying: false,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Balance Toggle Functionality", () => {
    it("should initially show balance by default", () => {
      render(<WalletPortfolio />);

      // Verify initial state shows balance
      expect(screen.getByTestId("balance-state")).toHaveTextContent("visible");
      expect(screen.getByTestId("balance-visibility")).toHaveTextContent(
        "visible"
      );
      expect(
        screen.getByTestId("pie-chart-visibility-state")
      ).toHaveTextContent("visible");

      // Verify actual values are displayed
      expect(screen.getByTestId("total-value")).toHaveTextContent("$25,000.00");
      expect(screen.getByTestId("pie-chart-balance")).toHaveTextContent(
        "$25,000.00"
      );
    });

    it("should hide balance when toggle button is clicked", async () => {
      render(<WalletPortfolio />);

      // Click the toggle button
      const toggleButton = screen.getByTestId("toggle-balance-btn");
      await act(async () => {
        fireEvent.click(toggleButton);
      });

      // Verify balance is now hidden
      await waitFor(() => {
        expect(screen.getAllByTestId("balance-state")[0]).toHaveTextContent(
          "hidden"
        );
        expect(
          screen.getAllByTestId("balance-visibility")[0]
        ).toHaveTextContent("hidden");
        expect(
          screen.getAllByTestId("pie-chart-visibility-state")[0]
        ).toHaveTextContent("hidden");
      });

      // Verify hidden placeholders are displayed
      expect(screen.getByTestId("total-value")).toHaveTextContent("••••••••");
      expect(screen.getByTestId("pie-chart-balance")).toHaveTextContent(
        "••••••••"
      );

      // Verify button text changed
      expect(toggleButton).toHaveTextContent("Show Balance");
    });

    it("should show balance again when toggle button is clicked twice", async () => {
      render(<WalletPortfolio />);

      const toggleButton = screen.getByTestId("toggle-balance-btn");

      // Hide balance
      await act(async () => {
        fireEvent.click(toggleButton);
      });

      await waitFor(() => {
        expect(screen.getAllByTestId("balance-state")[0]).toHaveTextContent(
          "hidden"
        );
      });

      // Show balance again
      await act(async () => {
        fireEvent.click(toggleButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId("balance-state")).toHaveTextContent(
          "visible"
        );
        expect(screen.getByTestId("balance-visibility")).toHaveTextContent(
          "visible"
        );
        expect(
          screen.getByTestId("pie-chart-visibility-state")
        ).toHaveTextContent("visible");
      });

      // Verify actual values are displayed again
      expect(screen.getByTestId("total-value")).toHaveTextContent("$25,000.00");
      expect(screen.getByTestId("pie-chart-balance")).toHaveTextContent(
        "$25,000.00"
      );
      expect(toggleButton).toHaveTextContent("Hide Balance");
    });
  });

  describe("Cross-Component State Synchronization", () => {
    it("should synchronize balance visibility across all components", async () => {
      render(<WalletPortfolio />);

      // Verify all components start in sync
      expect(screen.getByTestId("balance-state")).toHaveTextContent("visible");
      expect(screen.getByTestId("balance-visibility")).toHaveTextContent(
        "visible"
      );
      expect(
        screen.getByTestId("pie-chart-visibility-state")
      ).toHaveTextContent("visible");

      // Toggle balance
      await act(async () => {
        fireEvent.click(screen.getByTestId("toggle-balance-btn"));
      });

      // Verify all components are updated synchronously
      await waitFor(() => {
        expect(screen.getAllByTestId("balance-state")[0]).toHaveTextContent(
          "hidden"
        );
        expect(
          screen.getAllByTestId("balance-visibility")[0]
        ).toHaveTextContent("hidden");
        expect(
          screen.getAllByTestId("pie-chart-visibility-state")[0]
        ).toHaveTextContent("hidden");
      });

      // Verify all display the hidden state
      expect(screen.getByTestId("total-value")).toHaveTextContent("••••••••");
      expect(screen.getByTestId("pie-chart-balance")).toHaveTextContent(
        "••••••••"
      );
    });

    it("should maintain balance visibility state during data updates", async () => {
      const { rerender } = render(<WalletPortfolio />);

      // Hide balance first
      await act(async () => {
        fireEvent.click(screen.getByTestId("toggle-balance-btn"));
      });

      await waitFor(() => {
        expect(screen.getAllByTestId("balance-state")[0]).toHaveTextContent(
          "hidden"
        );
      });

      // Update portfolio data
      mockUsePortfolioData.mockReturnValue({
        totalValue: 30000, // Different value
        categories: mockPortfolioData,
        pieChartData: [
          { label: "DeFi", value: 18000, percentage: 60, color: "#8B5CF6" },
          { label: "CEX", value: 9000, percentage: 30, color: "#06B6D4" },
          { label: "NFTs", value: 3000, percentage: 10, color: "#F59E0B" },
        ],
        isLoading: false,
        error: null,
        retry: vi.fn(),
        isRetrying: false,
      });

      rerender(<WalletPortfolio />);

      // Verify balance remains hidden despite data update
      expect(screen.getAllByTestId("balance-state")[0]).toHaveTextContent(
        "hidden"
      );
      expect(screen.getAllByTestId("balance-visibility")[0]).toHaveTextContent(
        "hidden"
      );
      expect(
        screen.getAllByTestId("pie-chart-visibility-state")[0]
      ).toHaveTextContent("hidden");

      // Verify hidden placeholders are still shown
      expect(screen.getByTestId("total-value")).toHaveTextContent("••••••••");
      expect(screen.getByTestId("pie-chart-balance")).toHaveTextContent(
        "••••••••"
      );
    });
  });

  describe("Custom Balance Renderer Integration", () => {
    it("should pass custom renderBalanceDisplay to PieChart", () => {
      render(<WalletPortfolio />);

      // The PieChart should receive the custom renderer
      // This is verified by checking that the balance display uses formatCurrency
      expect(screen.getByTestId("pie-chart-balance")).toHaveTextContent(
        "$25,000.00"
      );
    });

    it("should use custom renderBalanceDisplay when balance is hidden", async () => {
      render(<WalletPortfolio />);

      // Hide balance
      await act(async () => {
        fireEvent.click(screen.getByTestId("toggle-balance-btn"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("pie-chart-balance")).toHaveTextContent(
          "••••••••"
        );
      });
    });

    it("should handle totalValue changes with custom renderer", async () => {
      const { rerender } = render(<WalletPortfolio />);

      // Update with different totalValue
      mockUsePortfolioData.mockReturnValue({
        totalValue: 50000,
        categories: mockPortfolioData,
        pieChartData: [
          { label: "DeFi", value: 30000, percentage: 60, color: "#8B5CF6" },
          { label: "CEX", value: 15000, percentage: 30, color: "#06B6D4" },
          { label: "NFTs", value: 5000, percentage: 10, color: "#F59E0B" },
        ],
        isLoading: false,
        error: null,
        retry: vi.fn(),
        isRetrying: false,
      });

      rerender(<WalletPortfolio />);

      // Verify new value is displayed
      expect(screen.getByTestId("pie-chart-balance")).toHaveTextContent(
        "$50,000.00"
      );

      // Hide balance and verify custom renderer respects the hidden state
      await act(async () => {
        fireEvent.click(screen.getByTestId("toggle-balance-btn"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("pie-chart-balance")).toHaveTextContent(
          "••••••••"
        );
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle null totalValue gracefully", async () => {
      mockUsePortfolioData.mockReturnValue({
        totalValue: null,
        categories: null,
        pieChartData: [],
        isLoading: false,
        error: null,
        retry: vi.fn(),
        isRetrying: false,
      });

      render(<WalletPortfolio />);

      // Should show $0.00 for null value
      expect(screen.getByTestId("pie-chart-balance")).toHaveTextContent(
        "$0.00"
      );

      // Hide balance
      await act(async () => {
        fireEvent.click(screen.getByTestId("toggle-balance-btn"));
      });

      // Should show hidden placeholder
      await waitFor(() => {
        expect(screen.getByTestId("pie-chart-balance")).toHaveTextContent(
          "••••••••"
        );
      });
    });

    it("should handle zero totalValue correctly", async () => {
      mockUsePortfolioData.mockReturnValue({
        totalValue: 0,
        categories: [],
        pieChartData: [],
        isLoading: false,
        error: null,
        retry: vi.fn(),
        isRetrying: false,
      });

      render(<WalletPortfolio />);

      // Should show $0.00 for zero value
      expect(screen.getByTestId("pie-chart-balance")).toHaveTextContent(
        "$0.00"
      );

      // Hide balance
      await act(async () => {
        fireEvent.click(screen.getByTestId("toggle-balance-btn"));
      });

      // Should show hidden placeholder
      await waitFor(() => {
        expect(screen.getByTestId("pie-chart-balance")).toHaveTextContent(
          "••••••••"
        );
      });
    });

    it("should maintain balance visibility during loading states", async () => {
      render(<WalletPortfolio />);

      // Hide balance first
      await act(async () => {
        fireEvent.click(screen.getByTestId("toggle-balance-btn"));
      });

      await waitFor(() => {
        expect(screen.getAllByTestId("balance-state")[0]).toHaveTextContent(
          "hidden"
        );
      });

      // Simulate loading state
      mockUsePortfolioData.mockReturnValue({
        totalValue: null,
        categories: null,
        pieChartData: [],
        isLoading: true,
        error: null,
        retry: vi.fn(),
        isRetrying: false,
      });

      const { rerender } = render(<WalletPortfolio />);
      rerender(<WalletPortfolio />);

      // Balance should remain hidden during loading
      expect(screen.getAllByTestId("balance-state")[0]).toHaveTextContent(
        "hidden"
      );
      expect(screen.getAllByTestId("balance-visibility")[0]).toHaveTextContent(
        "hidden"
      );
    });

    it("should maintain balance visibility during error states", async () => {
      render(<WalletPortfolio />);

      // Hide balance first
      await act(async () => {
        fireEvent.click(screen.getByTestId("toggle-balance-btn"));
      });

      await waitFor(() => {
        expect(screen.getAllByTestId("balance-state")[0]).toHaveTextContent(
          "hidden"
        );
      });

      // Simulate error state
      mockUsePortfolioData.mockReturnValue({
        totalValue: null,
        categories: null,
        pieChartData: [],
        isLoading: false,
        error: "API Error",
        retry: vi.fn(),
        isRetrying: false,
      });

      const { rerender } = render(<WalletPortfolio />);
      rerender(<WalletPortfolio />);

      // Balance should remain hidden during error
      expect(screen.getAllByTestId("balance-state")[0]).toHaveTextContent(
        "hidden"
      );
      expect(screen.getAllByTestId("balance-visibility")[0]).toHaveTextContent(
        "hidden"
      );
    });
  });

  describe("Accessibility", () => {
    it("should have proper aria-label for toggle button", () => {
      render(<WalletPortfolio />);

      const toggleButton = screen.getByTestId("toggle-balance-btn");
      expect(toggleButton).toHaveAttribute("aria-label", "Hide Balance");
    });

    it("should update aria-label when balance visibility changes", async () => {
      render(<WalletPortfolio />);

      const toggleButton = screen.getByTestId("toggle-balance-btn");

      // Hide balance
      await act(async () => {
        fireEvent.click(toggleButton);
      });

      await waitFor(() => {
        expect(toggleButton).toHaveAttribute("aria-label", "Show Balance");
      });

      // Show balance again
      await act(async () => {
        fireEvent.click(toggleButton);
      });

      await waitFor(() => {
        expect(toggleButton).toHaveAttribute("aria-label", "Hide Balance");
      });
    });
  });
});
