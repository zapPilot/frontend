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
  WalletActions: vi.fn(() => <div data-testid="wallet-actions" />),
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
});
