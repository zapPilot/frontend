import { render, screen } from "../../test-utils";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { WalletPortfolio } from "../../../src/components/WalletPortfolio";
import { useUser } from "../../../src/contexts/UserContext";
import { useLandingPageData } from "../../../src/hooks/queries/usePortfolioQuery";

// Mock dependencies
vi.mock("../../../src/contexts/UserContext");
vi.mock("../../../src/hooks/queries/usePortfolioQuery");

// Mock components to focus on visitor mode logic
vi.mock("../../../src/components/PortfolioOverview", () => ({
  PortfolioOverview: vi.fn(({ portfolioState, categorySummaries, title }) => (
    <div data-testid="portfolio-overview">
      <span data-testid="portfolio-state-type">{portfolioState.type}</span>
      <span data-testid="portfolio-title">{title || "Asset Distribution"}</span>
      <span data-testid="categories-count">{categorySummaries.length}</span>
    </div>
  )),
}));

vi.mock("../../../src/components/wallet/WalletMetrics", () => ({
  WalletMetrics: vi.fn(({ portfolioState, landingPageData }) => (
    <div data-testid="wallet-metrics">
      <span data-testid="metrics-state-type">{portfolioState.type}</span>
      <span data-testid="metrics-total-value">
        {portfolioState.totalValue || "null"}
      </span>
      <span data-testid="metrics-has-data">
        {landingPageData ? "has-data" : "no-data"}
      </span>
    </div>
  )),
}));

vi.mock("../../../src/components/wallet/WalletActions", () => ({
  WalletActions: vi.fn(
    ({ disabled, onZapInClick, onZapOutClick, onOptimizeClick }) => (
      <div data-testid="wallet-actions">
        <span data-testid="actions-disabled">
          {disabled ? "disabled" : "enabled"}
        </span>
        <button
          data-testid="zap-in-btn"
          onClick={onZapInClick}
          disabled={disabled}
        >
          Zap In
        </button>
        <button
          data-testid="zap-out-btn"
          onClick={onZapOutClick}
          disabled={disabled}
        >
          Zap Out
        </button>
        <button
          data-testid="optimize-btn"
          onClick={onOptimizeClick}
          disabled={disabled}
        >
          Optimize
        </button>
      </div>
    )
  ),
}));

vi.mock("../../../src/components/wallet/WalletHeader", () => ({
  WalletHeader: vi.fn(({ isOwnBundle, bundleUserName }) => (
    <div data-testid="wallet-header">
      <span data-testid="header-bundle-type">
        {isOwnBundle ? "own" : "visitor"}
      </span>
      <span data-testid="header-user-name">{bundleUserName || "self"}</span>
    </div>
  )),
}));

// Mock other components to avoid complexity
vi.mock("../../../src/components/ui", () => ({
  GlassCard: vi.fn(({ children }) => (
    <div data-testid="glass-card">{children}</div>
  )),
}));

vi.mock("../../../src/components/errors/ErrorBoundary", () => ({
  ErrorBoundary: vi.fn(({ children }) => <div>{children}</div>),
}));

vi.mock("../../../src/contexts/BalanceVisibilityContext", () => ({
  BalanceVisibilityProvider: vi.fn(({ children }) => <div>{children}</div>),
}));

vi.mock("../../../src/hooks/usePortfolio", () => ({
  usePortfolio: () => ({
    balanceHidden: false,
    toggleBalanceVisibility: vi.fn(),
  }),
}));

vi.mock("../../../src/components/WalletManager", () => ({
  WalletManager: vi.fn(() => null),
}));

const mockUseUser = vi.mocked(useUser);
const mockUseLandingPageData = vi.mocked(useLandingPageData);

// Mock landing page data for visitor bundle
const mockVisitorBundleData = {
  user_id: "visitor-123",
  total_net_usd: 25000,
  total_assets_usd: 27000,
  total_debt_usd: 2000,
  weighted_apr: 0.12,
  estimated_monthly_income: 2000,
  portfolio_allocation: {
    btc: { total_value: 15000, percentage_of_portfolio: 60 },
    eth: { total_value: 7500, percentage_of_portfolio: 30 },
    stablecoins: { total_value: 2500, percentage_of_portfolio: 10 },
    others: { total_value: 0, percentage_of_portfolio: 0 },
  },
  category_summary_debt: {
    btc: 0,
    eth: 1000,
    stablecoins: 1000,
    others: 0,
  },
  portfolio_roi: {
    recommended_yearly_roi: 15.2,
    estimated_yearly_pnl_usd: 3800,
    recommended_roi_period: "roi_30d",
    roi_7d: { value: 3.1, data_points: 7 },
    roi_30d: { value: 12.6, data_points: 30 },
    roi_365d: { value: 15.2, data_points: 365 },
  },
};

describe("WalletPortfolio - Visitor Mode Bundle Viewing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Visitor with Valid Bundle Data (Critical Fix)", () => {
    beforeEach(() => {
      // Visitor: not connected, viewing someone else's bundle
      mockUseUser.mockReturnValue({
        userInfo: null,
        isConnected: false,
      } as any);

      // API successfully returns bundle data
      mockUseLandingPageData.mockReturnValue({
        data: mockVisitorBundleData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      } as any);
    });

    it("should show bundle data instead of connect prompts for visitor", () => {
      render(
        <WalletPortfolio
          urlUserId="visitor-123"
          isOwnBundle={false}
          bundleUserName="Alice"
          bundleUrl="https://example.com/bundle?userId=visitor-123"
        />
      );

      // Critical: Should show "has_data" state, not "wallet_disconnected"
      expect(screen.getByTestId("portfolio-state-type")).toHaveTextContent(
        "has_data"
      );
      expect(screen.getByTestId("metrics-state-type")).toHaveTextContent(
        "has_data"
      );

      // Should display actual bundle data
      expect(screen.getByTestId("metrics-total-value")).toHaveTextContent(
        "25000"
      );
      expect(screen.getByTestId("metrics-has-data")).toHaveTextContent(
        "has-data"
      );

      // Should show visitor mode in header
      expect(screen.getByTestId("header-bundle-type")).toHaveTextContent(
        "visitor"
      );
      expect(screen.getByTestId("header-user-name")).toHaveTextContent("Alice");
    });

    it("should disable wallet actions in visitor mode", () => {
      const mockZapIn = vi.fn();
      const mockZapOut = vi.fn();
      const mockOptimize = vi.fn();

      render(
        <WalletPortfolio
          urlUserId="visitor-123"
          isOwnBundle={false}
          onZapInClick={mockZapIn}
          onZapOutClick={mockZapOut}
          onOptimizeClick={mockOptimize}
        />
      );

      // Actions should be disabled for visitor
      expect(screen.getByTestId("actions-disabled")).toHaveTextContent(
        "disabled"
      );
      expect(screen.getByTestId("zap-in-btn")).toBeDisabled();
      expect(screen.getByTestId("zap-out-btn")).toBeDisabled();
      expect(screen.getByTestId("optimize-btn")).toBeDisabled();
    });

    it("should use urlUserId for data fetching instead of connected user", () => {
      render(<WalletPortfolio urlUserId="visitor-123" />);

      // Should fetch data for the specific user, not the connected user
      expect(mockUseLandingPageData).toHaveBeenCalledWith("visitor-123");
    });

    it("should show portfolio overview with correct categories", () => {
      render(<WalletPortfolio urlUserId="visitor-123" isOwnBundle={false} />);

      // Portfolio overview should render with data
      expect(screen.getByTestId("portfolio-overview")).toBeInTheDocument();
      expect(screen.getByTestId("portfolio-title")).toHaveTextContent(
        "Asset Distribution"
      );

      // Should have categories (mocked as length > 0)
      const categoriesCount =
        screen.getByTestId("categories-count").textContent;
      expect(parseInt(categoriesCount || "0")).toBeGreaterThan(0);
    });
  });

  describe("Visitor with Zero/No Data", () => {
    it("should show connect prompts when visitor has no bundle data", () => {
      mockUseUser.mockReturnValue({
        userInfo: null,
        isConnected: false,
      } as any);

      // No data from API
      mockUseLandingPageData.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      } as any);

      render(<WalletPortfolio urlUserId="visitor-123" />);

      // Should show connect prompt when no data available
      expect(screen.getByTestId("portfolio-state-type")).toHaveTextContent(
        "wallet_disconnected"
      );
      expect(screen.getByTestId("metrics-state-type")).toHaveTextContent(
        "wallet_disconnected"
      );
      expect(screen.getByTestId("metrics-has-data")).toHaveTextContent(
        "no-data"
      );
    });

    it("should show connect prompts when visitor has zero data", () => {
      mockUseUser.mockReturnValue({
        userInfo: null,
        isConnected: false,
      } as any);

      // Zero data from API
      const zeroData = {
        ...mockVisitorBundleData,
        total_net_usd: 0,
        total_assets_usd: 0,
        total_debt_usd: 0,
        portfolio_allocation: {
          btc: { total_value: 0, percentage_of_portfolio: 0 },
          eth: { total_value: 0, percentage_of_portfolio: 0 },
          stablecoins: { total_value: 0, percentage_of_portfolio: 0 },
          others: { total_value: 0, percentage_of_portfolio: 0 },
        },
      };

      mockUseLandingPageData.mockReturnValue({
        data: zeroData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      } as any);

      render(<WalletPortfolio urlUserId="visitor-123" />);

      // Should show connect prompt when data is all zeros
      expect(screen.getByTestId("portfolio-state-type")).toHaveTextContent(
        "wallet_disconnected"
      );
      expect(screen.getByTestId("metrics-state-type")).toHaveTextContent(
        "wallet_disconnected"
      );
    });
  });

  describe("Connected User Viewing Someone Else's Bundle", () => {
    it("should behave as visitor mode when connected user views another bundle", () => {
      // Connected user
      mockUseUser.mockReturnValue({
        userInfo: { userId: "connected-user", email: "user@example.com" },
        isConnected: true,
      } as any);

      // Viewing someone else's bundle data
      mockUseLandingPageData.mockReturnValue({
        data: mockVisitorBundleData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      } as any);

      render(
        <WalletPortfolio
          urlUserId="visitor-123" // Different from connected user
          isOwnBundle={false}
          bundleUserName="Bob"
        />
      );

      // Should show bundle data (has_data state)
      expect(screen.getByTestId("portfolio-state-type")).toHaveTextContent(
        "has_data"
      );
      expect(screen.getByTestId("metrics-state-type")).toHaveTextContent(
        "has_data"
      );

      // Should be in visitor mode (actions disabled)
      expect(screen.getByTestId("actions-disabled")).toHaveTextContent(
        "disabled"
      );
      expect(screen.getByTestId("header-bundle-type")).toHaveTextContent(
        "visitor"
      );
      expect(screen.getByTestId("header-user-name")).toHaveTextContent("Bob");
    });
  });

  describe("Connected User Viewing Own Bundle", () => {
    it("should behave as owner mode when connected user views own bundle", () => {
      const connectedUser = {
        userId: "connected-user",
        email: "user@example.com",
      };

      mockUseUser.mockReturnValue({
        userInfo: connectedUser,
        isConnected: true,
      } as any);

      // Viewing own bundle data
      mockUseLandingPageData.mockReturnValue({
        data: { ...mockVisitorBundleData, user_id: "connected-user" },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      } as any);

      const mockZapIn = vi.fn();
      const mockOptimize = vi.fn();

      render(
        <WalletPortfolio
          urlUserId="connected-user" // Same as connected user
          isOwnBundle={true}
          onZapInClick={mockZapIn}
          onOptimizeClick={mockOptimize}
        />
      );

      // Should show bundle data
      expect(screen.getByTestId("portfolio-state-type")).toHaveTextContent(
        "has_data"
      );

      // Should be in owner mode (actions enabled)
      expect(screen.getByTestId("actions-disabled")).toHaveTextContent(
        "enabled"
      );
      expect(screen.getByTestId("zap-in-btn")).not.toBeDisabled();
      expect(screen.getByTestId("optimize-btn")).not.toBeDisabled();
      expect(screen.getByTestId("header-bundle-type")).toHaveTextContent("own");
    });
  });

  describe("Error and Loading States for Visitors", () => {
    it("should show error state for visitor when API fails", () => {
      mockUseUser.mockReturnValue({
        userInfo: null,
        isConnected: false,
      } as any);

      mockUseLandingPageData.mockReturnValue({
        data: null,
        isLoading: false,
        error: { message: "Bundle not found" },
        refetch: vi.fn(),
        isRefetching: false,
      } as any);

      render(<WalletPortfolio urlUserId="invalid-user" />);

      // Should show error state
      expect(screen.getByTestId("portfolio-state-type")).toHaveTextContent(
        "error"
      );
      expect(screen.getByTestId("metrics-state-type")).toHaveTextContent(
        "error"
      );
    });

    it("should show loading state for visitor while fetching bundle", () => {
      mockUseUser.mockReturnValue({
        userInfo: null,
        isConnected: false,
      } as any);

      mockUseLandingPageData.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      } as any);

      render(<WalletPortfolio urlUserId="visitor-123" />);

      // Should show loading state
      expect(screen.getByTestId("portfolio-state-type")).toHaveTextContent(
        "loading"
      );
      expect(screen.getByTestId("metrics-state-type")).toHaveTextContent(
        "loading"
      );
    });

    it("should show loading state for visitor during refetch", () => {
      mockUseUser.mockReturnValue({
        userInfo: null,
        isConnected: false,
      } as any);

      mockUseLandingPageData.mockReturnValue({
        data: mockVisitorBundleData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: true, // Refetching
      } as any);

      render(<WalletPortfolio urlUserId="visitor-123" />);

      // Should show loading state during refetch
      expect(screen.getByTestId("portfolio-state-type")).toHaveTextContent(
        "loading"
      );
      expect(screen.getByTestId("metrics-state-type")).toHaveTextContent(
        "loading"
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle missing urlUserId gracefully", () => {
      mockUseUser.mockReturnValue({
        userInfo: null,
        isConnected: false,
      } as any);

      mockUseLandingPageData.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      } as any);

      render(<WalletPortfolio />); // No urlUserId

      // Should fetch with null userId
      expect(mockUseLandingPageData).toHaveBeenCalledWith(null);

      // Should show connect prompt
      expect(screen.getByTestId("portfolio-state-type")).toHaveTextContent(
        "wallet_disconnected"
      );
    });

    it("should handle bundle URL correctly in visitor mode", () => {
      mockUseUser.mockReturnValue({
        userInfo: null,
        isConnected: false,
      } as any);

      mockUseLandingPageData.mockReturnValue({
        data: mockVisitorBundleData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      } as any);

      const bundleUrl = "https://app.zappilot.com/bundle?userId=visitor-123";

      render(
        <WalletPortfolio
          urlUserId="visitor-123"
          bundleUrl={bundleUrl}
          bundleUserName="Charlie"
        />
      );

      // Should render correctly with bundle info
      expect(screen.getByTestId("header-user-name")).toHaveTextContent(
        "Charlie"
      );
      expect(screen.getByTestId("portfolio-state-type")).toHaveTextContent(
        "has_data"
      );
    });
  });
});
