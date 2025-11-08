import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { WalletPortfolioViewModel } from "@/hooks/useWalletPortfolioState";

const mockUseWalletPortfolioState = vi.fn<[], WalletPortfolioViewModel>();

vi.mock("@/hooks/useWalletPortfolioState", () => ({
  useWalletPortfolioState: mockUseWalletPortfolioState,
}));

const mockPresenter = vi.fn(
  ({ vm }: { vm: WalletPortfolioViewModel }) => (
    <div data-testid="wallet-portfolio-presenter">
      <span data-testid="vm-user">{vm.resolvedUserId ?? "no-user"}</span>
      <span data-testid="vm-visitor">
        {vm.isVisitorMode ? "visitor" : "owner"}
      </span>
      <span data-testid="vm-hidden">
        {vm.balanceHidden ? "hidden" : "visible"}
      </span>
      <button
        data-testid="invoke-optimize"
        onClick={vm.onOptimizeClick}
        disabled={!vm.onOptimizeClick}
      >
        Optimize Action
      </button>
    </div>
  )
);

vi.mock("@/components/wallet/WalletPortfolioPresenter", () => {
  return {
    WalletPortfolioPresenter: mockPresenter,
  };
});


function createViewModel(
  overrides: Partial<WalletPortfolioViewModel> = {}
): WalletPortfolioViewModel {
  return {
    resolvedUserId: "user-123",
    isVisitorMode: false,
    landingPageData: undefined,
    pieChartData: [],
    categorySummaries: [],
    debtCategorySummaries: [],
    portfolioMetrics: null,
    portfolioState: {
      type: "has_data",
      isConnected: true,
      isLoading: false,
      hasError: false,
      hasZeroData: false,
      totalValue: 15000,
      errorMessage: null,
      isRetrying: false,
    },
    balanceHidden: false,
    toggleBalanceVisibility: vi.fn(),
    expandedCategory: null,
    toggleCategoryExpansion: vi.fn(),
    onOptimizeClick: vi.fn(),
    onZapInClick: vi.fn(),
    onZapOutClick: vi.fn(),
    onCategoryClick: vi.fn(),
    isOwnBundle: true,
    bundleUserName: "Alice",
    bundleUrl: "https://example.com/bundle",
    isWalletManagerOpen: false,
    openWalletManager: vi.fn(),
    closeWalletManager: vi.fn(),
    onRetry: vi.fn(),
    ...overrides,
  };
}

interface WalletPortfolioProps {
  urlUserId?: string;
  onOptimizeClick?: () => void;
  onZapInClick?: () => void;
  onZapOutClick?: () => void;
  onCategoryClick?: (categoryId: string) => void;
  isOwnBundle?: boolean;
  bundleUserName?: string;
  bundleUrl?: string;
}

async function renderWalletPortfolio(props: WalletPortfolioProps = {}) {
  vi.resetModules();
  const { WalletPortfolio } = await import("@/components/WalletPortfolio");
  render(<WalletPortfolio {...props} />);
}

describe("WalletPortfolio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseWalletPortfolioState.mockReturnValue(createViewModel());
    mockPresenter.mockClear();
  });

  it("renders the presenter with the view model from the hook", async () => {
    await renderWalletPortfolio();

    expect(mockUseWalletPortfolioState).toHaveBeenCalledTimes(1);
    expect(mockPresenter).toHaveBeenCalledTimes(1);
    const [{ vm }] = mockPresenter.mock.calls[0] ?? [];
    expect(vm?.resolvedUserId).toBe("user-123");
    expect(
      screen.getByTestId("wallet-portfolio-presenter")
    ).toBeInTheDocument();
  });

  it("forwards optional props to the wallet portfolio state hook", async () => {
    const callbacks = {
      onOptimizeClick: vi.fn(),
      onZapInClick: vi.fn(),
      onZapOutClick: vi.fn(),
      onCategoryClick: vi.fn(),
    };

    await renderWalletPortfolio({
      urlUserId: "bundle-user",
      isOwnBundle: false,
      bundleUserName: "Bob",
      bundleUrl: "https://zap.pilot/bundles/bob",
      ...callbacks,
    });

    expect(mockUseWalletPortfolioState).toHaveBeenCalledWith(
      expect.objectContaining({
        urlUserId: "bundle-user",
        isOwnBundle: false,
        bundleUserName: "Bob",
        bundleUrl: "https://zap.pilot/bundles/bob",
        ...callbacks,
      })
    );
  });

  it("propagates view model callbacks to the presenter component", async () => {
    const onOptimizeClick = vi.fn();
    mockUseWalletPortfolioState.mockReturnValue(
      createViewModel({ onOptimizeClick })
    );

    await renderWalletPortfolio();

    fireEvent.click(screen.getByTestId("invoke-optimize"));
    expect(onOptimizeClick).toHaveBeenCalledTimes(1);
  });
});
