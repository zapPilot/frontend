import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AnalyticsTab } from "../../../src/components/AnalyticsTab";
import { useUser } from "../../../src/contexts/UserContext";
import { useLandingPageData } from "../../../src/hooks/queries/usePortfolioQuery";

// Mock dependencies
vi.mock("../../../src/contexts/UserContext");
vi.mock("../../../src/hooks/queries/usePortfolioQuery");

// Mock child components
vi.mock("../../../src/components/MoreTab/index", () => ({
  AnalyticsDashboard: vi.fn(() => (
    <div data-testid="analytics-dashboard">Analytics Dashboard</div>
  )),
}));

vi.mock("../../../src/components/PortfolioChart", () => ({
  PortfolioChart: vi.fn(() => (
    <div data-testid="portfolio-chart">Portfolio Chart</div>
  )),
}));

// Mock LoadingSpinner specifically to avoid dynamic import issues
vi.mock("../../../src/components/ui/LoadingSpinner", () => ({
  LoadingSpinner: vi.fn(
    ({ size, className }: { size?: string; className?: string }) => (
      <div data-testid="loading-spinner" className={className} data-size={size}>
        Loading...
      </div>
    )
  ),
}));

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: vi.fn(({ children, ...props }) => <div {...props}>{children}</div>),
  },
}));

// Mock PoolPerformanceTable
vi.mock("../../../src/components/PoolAnalytics", () => ({
  PoolPerformanceTable: vi.fn(() => (
    <div data-testid="pool-performance-table">Pool Performance Table</div>
  )),
}));

describe("AnalyticsTab", () => {
  const mockUseUser = vi.mocked(useUser);
  const mockUseLandingPageData = vi.mocked(useLandingPageData);

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    mockUseUser.mockReturnValue({
      userInfo: {
        userId: "test-user-id",
        email: "test@example.com",
        name: "Test User",
      },
      login: vi.fn(),
      logout: vi.fn(),
    });

    mockUseLandingPageData.mockReturnValue({
      data: {
        pool_details: [],
        weighted_apr: 0.125,
        estimated_monthly_income: 1000,
        total_assets_usd: 10000,
        total_debt_usd: 0,
        total_net_usd: 10000,
        pie_chart_categories: {
          btc: 0,
          eth: 0,
          stablecoins: 0,
          others: 0,
        },
        total_positions: 0,
        protocols_count: 0,
        chains_count: 0,
        last_updated: null,
        apr_coverage: {
          matched_pools: 0,
          total_pools: 0,
          coverage_percentage: 0,
          matched_asset_value_usd: 0,
        },
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    });
  });
  describe("UI Layout Structure", () => {
    it("should render header section with title and description", () => {
      render(<AnalyticsTab />);

      // Header elements
      expect(screen.getByText("Portfolio Analytics")).toBeInTheDocument();
      expect(
        screen.getByText("Advanced metrics and historical performance analysis")
      ).toBeInTheDocument();
    });

    it("should have gradient text styling on title", () => {
      render(<AnalyticsTab />);

      const title = screen.getByText("Portfolio Analytics");
      expect(title).toHaveClass("gradient-text");
      expect(title).toHaveClass("text-3xl", "font-bold");
    });

    it("should render description with proper styling", () => {
      render(<AnalyticsTab />);

      const description = screen.getByText(
        "Advanced metrics and historical performance analysis"
      );
      expect(description).toHaveClass("text-gray-400");
    });

    it("should render PortfolioChart component", () => {
      render(<AnalyticsTab />);

      // Since we're using dynamic imports, check for the dynamic component mock
      expect(screen.getByTestId("dynamic-component-mock")).toBeInTheDocument();
    });

    it("should render AnalyticsDashboard component", () => {
      render(<AnalyticsTab />);

      expect(screen.getByTestId("analytics-dashboard")).toBeInTheDocument();
    });

    it("should have centered header layout", () => {
      render(<AnalyticsTab />);

      const headerSection = screen.getByText(
        "Portfolio Analytics"
      ).parentElement;
      expect(headerSection).toHaveClass("text-center");
    });

    it("should render all required child components", () => {
      render(<AnalyticsTab />);

      // Ensure both child components are present
      // PortfolioChart is dynamically imported so it shows as dynamic-component-mock
      expect(screen.getByTestId("dynamic-component-mock")).toBeInTheDocument();
      expect(screen.getByTestId("analytics-dashboard")).toBeInTheDocument();

      // Verify they have content
      expect(screen.getByText("Dynamic Component Mock")).toBeInTheDocument();
      expect(screen.getByText("Analytics Dashboard")).toBeInTheDocument();
    });

    it("should maintain component structure without props", () => {
      // AnalyticsTab doesn't take props, but verify it still renders correctly
      render(<AnalyticsTab />);

      expect(screen.getByText("Portfolio Analytics")).toBeInTheDocument();
      expect(screen.getByTestId("dynamic-component-mock")).toBeInTheDocument();
      expect(screen.getByTestId("analytics-dashboard")).toBeInTheDocument();
    });
  });

  describe("Animation Structure", () => {
    it("should render motion.div for header with animation props", () => {
      render(<AnalyticsTab />);

      // Header should be wrapped in motion.div
      const header = screen.getByText("Portfolio Analytics").parentElement;
      expect(header).toBeInTheDocument();
    });

    it("should render all sections with proper structure", () => {
      render(<AnalyticsTab />);

      // Main sections should all be present
      expect(screen.getByText("Portfolio Analytics")).toBeInTheDocument();
      expect(screen.getByTestId("dynamic-component-mock")).toBeInTheDocument();
      expect(screen.getByTestId("analytics-dashboard")).toBeInTheDocument();
    });
  });

  describe("Content Verification", () => {
    it("should display correct header text", () => {
      render(<AnalyticsTab />);

      expect(
        screen.getByRole("heading", { name: "Portfolio Analytics" })
      ).toBeInTheDocument();
    });

    it("should display correct description text", () => {
      render(<AnalyticsTab />);

      expect(
        screen.getByText("Advanced metrics and historical performance analysis")
      ).toBeInTheDocument();
    });

    it("should not render any error states by default", () => {
      render(<AnalyticsTab />);

      // Should not show any error messages
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/failed/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/unavailable/i)).not.toBeInTheDocument();
    });

    it("should not render any loading states by default", () => {
      render(<AnalyticsTab />);

      // Should not show loading spinners
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
  });
});
