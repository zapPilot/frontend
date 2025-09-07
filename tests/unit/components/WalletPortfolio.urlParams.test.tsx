import { render, screen } from "../../test-utils";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { WalletPortfolio } from "../../../src/components/WalletPortfolio";
import { useUser } from "../../../src/contexts/UserContext";
import { useLandingPageData } from "../../../src/hooks/queries/usePortfolioQuery";

vi.mock("../../../src/contexts/UserContext");
vi.mock("../../../src/hooks/queries/usePortfolioQuery");

// Keep child components lightweight
vi.mock("../../../src/components/PortfolioOverview", () => ({
  PortfolioOverview: vi.fn(({ title }) => (
    <div data-testid="portfolio-overview">{title || "Asset Distribution"}</div>
  )),
}));

// Avoid heavy WalletMetrics rendering and icon imports
vi.mock("../../../src/components/wallet/WalletMetrics", () => ({
  WalletMetrics: vi.fn(() => <div data-testid="wallet-metrics" />),
}));

vi.mock("../../../src/components/wallet/WalletActions", () => ({
  WalletActions: vi.fn(
    ({ disabled, onZapInClick, onZapOutClick, onOptimizeClick }) => (
      <div data-testid="wallet-actions">
        <span data-testid="disabled-state">
          {disabled ? "disabled" : "enabled"}
        </span>
        <button data-testid="zap-in" onClick={onZapInClick} disabled={disabled}>
          Zap In
        </button>
        <button
          data-testid="zap-out"
          onClick={onZapOutClick}
          disabled={disabled}
        >
          Zap Out
        </button>
        <button
          data-testid="optimize"
          onClick={onOptimizeClick}
          disabled={disabled}
        >
          Optimize
        </button>
      </div>
    )
  ),
}));

// Mock icons to avoid DOM noise
vi.mock("lucide-react", () => ({
  DollarSign: vi.fn(() => <span />),
  Wallet: vi.fn(() => <span />),
  Eye: vi.fn(() => <span />),
  EyeOff: vi.fn(() => <span />),
  Copy: vi.fn(() => <span />),
  Check: vi.fn(() => <span />),
}));

const mockUseUser = vi.mocked(useUser);
const mockUseLanding = vi.mocked(useLandingPageData);

describe("WalletPortfolio - urlUserId override", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUser.mockReturnValue({
      userInfo: { userId: "owner-abc", email: "owner@example.com" },
      isConnected: true,
    } as any);
    mockUseLanding.mockReturnValue({
      data: {
        user_id: "viewer-xyz",
        total_net_usd: 0,
        total_assets_usd: 0,
        total_debt_usd: 0,
        weighted_apr: 0,
        estimated_monthly_income: 0,
        portfolio_allocation: {
          btc: { total_value: 0, percentage_of_portfolio: 0 },
          eth: { total_value: 0, percentage_of_portfolio: 0 },
          stablecoins: { total_value: 0, percentage_of_portfolio: 0 },
          others: { total_value: 0, percentage_of_portfolio: 0 },
        },
        category_summary_debt: { btc: 0, eth: 0, stablecoins: 0, others: 0 },
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    } as any);
  });

  it("calls useLandingPageData with urlUserId and shows bundle header for viewer", () => {
    render(
      <WalletPortfolio
        urlUserId="viewer-xyz"
        isOwnBundle={false}
        bundleUserName="Viewer"
        bundleUrl="https://example.com/b/viewer-xyz"
      />
    );

    // Confirms it used the urlUserId rather than owner from context
    expect(mockUseLanding).toHaveBeenCalledWith("viewer-xyz");

    // Header reflects viewing another user's bundle
    expect(screen.getByText("Viewer's Portfolio")).toBeInTheDocument();

    // Copy link button rendered when bundleUrl provided
    expect(screen.getByTitle("Copy bundle link")).toBeInTheDocument();
  });

  describe("Visitor mode functionality", () => {
    it("should disable wallet actions when viewing someone else's bundle", () => {
      const mockZapIn = vi.fn();
      const mockZapOut = vi.fn();
      const mockOptimize = vi.fn();

      render(
        <WalletPortfolio
          urlUserId="viewer-xyz"
          isOwnBundle={false}
          bundleUserName="Viewer"
          bundleUrl="https://example.com/b/viewer-xyz"
          onZapInClick={mockZapIn}
          onZapOutClick={mockZapOut}
          onOptimizeClick={mockOptimize}
        />
      );

      // Actions should be disabled for visitor mode (viewing someone else's bundle)
      expect(screen.getByTestId("disabled-state")).toHaveTextContent(
        "disabled"
      );
      expect(screen.getByTestId("zap-in")).toBeDisabled();
      expect(screen.getByTestId("zap-out")).toBeDisabled();
      expect(screen.getByTestId("optimize")).toBeDisabled();
    });

    it("should disable wallet actions when not connected", () => {
      mockUseUser.mockReturnValue({
        userInfo: null,
        isConnected: false,
      } as any);

      const mockZapIn = vi.fn();
      const mockZapOut = vi.fn();
      const mockOptimize = vi.fn();

      render(
        <WalletPortfolio
          onZapInClick={mockZapIn}
          onZapOutClick={mockZapOut}
          onOptimizeClick={mockOptimize}
        />
      );

      // Actions should be disabled when not connected (visitor mode)
      expect(screen.getByTestId("disabled-state")).toHaveTextContent(
        "disabled"
      );
      expect(screen.getByTestId("zap-in")).toBeDisabled();
      expect(screen.getByTestId("zap-out")).toBeDisabled();
      expect(screen.getByTestId("optimize")).toBeDisabled();
    });

    it("should enable wallet actions when viewing own bundle", () => {
      const mockZapIn = vi.fn();
      const mockZapOut = vi.fn();
      const mockOptimize = vi.fn();

      render(
        <WalletPortfolio
          urlUserId="owner-abc" // Same as the userInfo.userId in beforeEach
          isOwnBundle={true}
          onZapInClick={mockZapIn}
          onZapOutClick={mockZapOut}
          onOptimizeClick={mockOptimize}
        />
      );

      // Actions should be enabled when viewing own bundle
      expect(screen.getByTestId("disabled-state")).toHaveTextContent("enabled");
      expect(screen.getByTestId("zap-in")).not.toBeDisabled();
      expect(screen.getByTestId("zap-out")).not.toBeDisabled();
      expect(screen.getByTestId("optimize")).not.toBeDisabled();
    });
  });
});
