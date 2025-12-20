/**
 * WalletPortfolioPresenter - Regime Highlighting Tests
 *
 * Tests data consistency for market regime highlighting in the AnimatePresence section.
 * Ensures correct regime is highlighted based on sentiment data.
 */

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { WalletPortfolioPresenter } from "@/components/wallet/portfolio/WalletPortfolioPresenter";
import { type RegimeId, regimes } from "@/components/wallet/regime/regimeData";

import {
  MOCK_DATA,
  MOCK_SCENARIOS,
} from "../../../../fixtures/mockPortfolioData";

const getDefaultStrategy = (regimeId: RegimeId) => {
  const regime = regimes.find(item => item.id === regimeId);

  if (!regime) {
    throw new Error(`Missing regime configuration for ${regimeId}`);
  }

  if ("default" in regime.strategies) {
    return regime.strategies.default;
  }

  return regime.strategies.fromLeft ?? regime.strategies.fromRight;
};

const getZapAction = (regimeId: RegimeId) =>
  getDefaultStrategy(regimeId)?.useCase?.zapAction ?? "";

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
    button: ({ children, className, ...props }: any) => (
      <button className={className} {...props}>
        {children}
      </button>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock child components to simplify testing
vi.mock("@/components/wallet/portfolio/views/AnalyticsView", () => ({
  AnalyticsView: () => <div data-testid="analytics-view">Analytics View</div>,
}));

vi.mock("@/components/wallet/portfolio/views/BacktestingView", () => ({
  BacktestingView: () => (
    <div data-testid="backtesting-view">Backtesting View</div>
  ),
}));

vi.mock("@/components/wallet/portfolio/modals", () => ({
  DepositModal: ({ isOpen }: any) =>
    isOpen ? <div data-testid="deposit-modal">Deposit Modal</div> : null,
  RebalanceModal: ({ isOpen }: any) =>
    isOpen ? <div data-testid="rebalance-modal">Rebalance Modal</div> : null,
}));

vi.mock("@/components/wallet/portfolio/modals/WithdrawModal", () => ({
  WithdrawModal: ({ isOpen }: any) =>
    isOpen ? <div data-testid="withdraw-modal">Withdraw Modal</div> : null,
}));

vi.mock("@/components/wallet/portfolio/components/WalletMenu", () => ({
  WalletMenu: () => <div data-testid="wallet-menu">Wallet Menu</div>,
}));

vi.mock("@/components/WalletManager/WalletManager", () => ({
  WalletManager: ({ isOpen }: any) =>
    isOpen ? <div data-testid="wallet-manager">Wallet Manager</div> : null,
}));

vi.mock("@/components/Footer/Footer", () => ({
  Footer: () => <footer data-testid="footer">Footer</footer>,
}));

describe("WalletPortfolioPresenter - Regime Highlighting", () => {
  describe("Regime Spectrum Display", () => {
    it("should highlight Extreme Fear regime when currentRegime is 'ef'", async () => {
      const user = userEvent.setup();
      const mockData = MOCK_SCENARIOS.extremeFear;

      render(<WalletPortfolioPresenter data={mockData} />);

      // Expand strategy section to show regime spectrum
      const strategyCard = screen.getByTestId("strategy-card");
      await user.click(strategyCard);

      // Find the regime spectrum container
      const regimeSpectrum = screen.getByTestId("regime-spectrum");
      expect(regimeSpectrum).toBeInTheDocument();

      // Verify all 5 regimes are rendered
      expect(
        within(regimeSpectrum).getByText("Extreme Fear")
      ).toBeInTheDocument();
      expect(within(regimeSpectrum).getByText("Fear")).toBeInTheDocument();
      expect(within(regimeSpectrum).getByText("Neutral")).toBeInTheDocument();
      expect(within(regimeSpectrum).getByText("Greed")).toBeInTheDocument();
      expect(
        within(regimeSpectrum).getByText("Extreme Greed")
      ).toBeInTheDocument();

      // Verify Extreme Fear is highlighted
      const extremeFearRegime = within(regimeSpectrum)
        .getByText("Extreme Fear")
        .closest("button");
      expect(extremeFearRegime).toHaveClass("bg-gray-800");
      expect(
        within(extremeFearRegime!).getByText("Current")
      ).toBeInTheDocument();

      // Verify other regimes are not highlighted
      const greedRegime = within(regimeSpectrum)
        .getByText("Greed")
        .closest("button");
      expect(greedRegime).toHaveClass("opacity-60");
      expect(greedRegime).not.toHaveClass("bg-gray-800");
    });

    it("should highlight Fear regime when currentRegime is 'f'", async () => {
      const user = userEvent.setup();
      const mockData = {
        ...MOCK_DATA,
        sentimentValue: 35,
        sentimentStatus: "Fear" as const,
        currentRegime: "f" as RegimeId,
      };

      render(<WalletPortfolioPresenter data={mockData} />);

      // Expand strategy section
      const strategyCard = screen.getByTestId("strategy-card");
      await user.click(strategyCard);

      const regimeSpectrum = screen.getByTestId("regime-spectrum");

      // Verify Fear is highlighted
      const fearRegime = within(regimeSpectrum)
        .getByText("Fear")
        .closest("button");
      expect(fearRegime).toHaveClass("bg-gray-800");
      expect(within(fearRegime!).getByText("Current")).toBeInTheDocument();
    });

    it("should highlight Neutral regime when currentRegime is 'n'", async () => {
      const user = userEvent.setup();
      const mockData = {
        ...MOCK_SCENARIOS.neutral,
        currentAllocation: {
          ...MOCK_SCENARIOS.neutral.currentAllocation,
          simplifiedCrypto: MOCK_DATA.currentAllocation.simplifiedCrypto,
        },
      };

      render(<WalletPortfolioPresenter data={mockData} />);

      // Expand strategy section
      const strategyCard = screen.getByTestId("strategy-card");
      await user.click(strategyCard);

      const regimeSpectrum = screen.getByTestId("regime-spectrum");

      // Verify Neutral is highlighted
      const neutralRegime = within(regimeSpectrum)
        .getByText("Neutral")
        .closest("button");
      expect(neutralRegime).toHaveClass("bg-gray-800");
      expect(within(neutralRegime!).getByText("Current")).toBeInTheDocument();
    });

    it("should highlight Greed regime when currentRegime is 'g'", async () => {
      const user = userEvent.setup();
      const mockData = MOCK_DATA; // Default is Greed

      render(<WalletPortfolioPresenter data={mockData} />);

      // Expand strategy section
      const strategyCard = screen.getByTestId("strategy-card");
      await user.click(strategyCard);

      const regimeSpectrum = screen.getByTestId("regime-spectrum");

      // Verify Greed is highlighted
      const greedRegime = within(regimeSpectrum)
        .getByText("Greed")
        .closest("button");
      expect(greedRegime).toHaveClass("bg-gray-800");
      expect(within(greedRegime!).getByText("Current")).toBeInTheDocument();
    });

    it("should highlight Extreme Greed regime when currentRegime is 'eg'", async () => {
      const user = userEvent.setup();
      const mockData = MOCK_SCENARIOS.extremeGreed;

      render(<WalletPortfolioPresenter data={mockData} />);

      // Expand strategy section
      const strategyCard = screen.getByTestId("strategy-card");
      await user.click(strategyCard);

      const regimeSpectrum = screen.getByTestId("regime-spectrum");

      // Verify Extreme Greed is highlighted
      const extremeGreedRegime = within(regimeSpectrum)
        .getByText("Extreme Greed")
        .closest("button");
      expect(extremeGreedRegime).toHaveClass("bg-gray-800");
      expect(
        within(extremeGreedRegime!).getByText("Current")
      ).toBeInTheDocument();

      // Verify other regimes are not highlighted
      const greedRegime = within(regimeSpectrum)
        .getByText("Greed")
        .closest("button");
      expect(greedRegime).toHaveClass("opacity-60");
      expect(greedRegime).not.toHaveClass("bg-gray-800");
    });
  });

  describe("Visual State Verification", () => {
    it("should apply active styling to current regime", async () => {
      const user = userEvent.setup();
      const mockData = MOCK_SCENARIOS.extremeGreed;

      render(<WalletPortfolioPresenter data={mockData} />);

      // Expand strategy section
      const strategyCard = screen.getByTestId("strategy-card");
      await user.click(strategyCard);

      const regimeSpectrum = screen.getByTestId("regime-spectrum");
      const activeRegime = within(regimeSpectrum)
        .getByText("Extreme Greed")
        .closest("button");

      // Verify active styling
      expect(activeRegime).toHaveClass("bg-gray-800");
      expect(activeRegime).toHaveClass("border");
      expect(activeRegime).toHaveClass("border-gray-600");
      expect(activeRegime).toHaveClass("scale-102");

      // Verify "Current" label exists
      expect(within(activeRegime!).getByText("Current")).toBeInTheDocument();

      // Verify color dot has animate-pulse
      const colorDot = activeRegime!.querySelector(".animate-pulse");
      expect(colorDot).toBeInTheDocument();
    });

    it("should apply inactive styling to non-current regimes", async () => {
      const user = userEvent.setup();
      const mockData = MOCK_SCENARIOS.extremeGreed;

      render(<WalletPortfolioPresenter data={mockData} />);

      // Expand strategy section
      const strategyCard = screen.getByTestId("strategy-card");
      await user.click(strategyCard);

      const regimeSpectrum = screen.getByTestId("regime-spectrum");
      const inactiveRegime = within(regimeSpectrum)
        .getByText("Greed")
        .closest("button");

      // Verify inactive styling
      expect(inactiveRegime).toHaveClass("opacity-60");
      expect(inactiveRegime).not.toHaveClass("bg-gray-800");

      // Verify no "Current" label
      expect(
        within(inactiveRegime!).queryByText("Current")
      ).not.toBeInTheDocument();

      // Verify color dot does not have animate-pulse
      const colorDot = inactiveRegime!.querySelector(".animate-pulse");
      expect(colorDot).not.toBeInTheDocument();
    });
  });

  describe("Data Consistency", () => {
    it("should display correct regime label dynamically in strategy explanation", async () => {
      const user = userEvent.setup();

      // Test Extreme Greed - verify label appears in the explanation
      const { unmount: unmount1 } = render(
        <WalletPortfolioPresenter data={MOCK_SCENARIOS.extremeGreed} />
      );
      let strategyCard = screen.getByTestId("strategy-card");
      await user.click(strategyCard);
      expect(screen.getByText(getZapAction("eg"))).toBeInTheDocument();
      unmount1();

      // Test Greed
      const { unmount: unmount2 } = render(
        <WalletPortfolioPresenter data={MOCK_DATA} />
      );
      strategyCard = screen.getByTestId("strategy-card");
      await user.click(strategyCard);
      expect(screen.getByText(getZapAction("g"))).toBeInTheDocument();
      unmount2();

      // Test Neutral (with fixed mock data)
      const neutralMockData = {
        ...MOCK_SCENARIOS.neutral,
        currentAllocation: {
          ...MOCK_SCENARIOS.neutral.currentAllocation,
          simplifiedCrypto: MOCK_DATA.currentAllocation.simplifiedCrypto,
        },
      };
      const { unmount: unmount3 } = render(
        <WalletPortfolioPresenter data={neutralMockData} />
      );
      strategyCard = screen.getByTestId("strategy-card");
      await user.click(strategyCard);
      expect(screen.getByText(getZapAction("n"))).toBeInTheDocument();
      unmount3();

      // Test Extreme Fear
      render(<WalletPortfolioPresenter data={MOCK_SCENARIOS.extremeFear} />);
      strategyCard = screen.getByTestId("strategy-card");
      await user.click(strategyCard);
      expect(screen.getByText(getZapAction("ef"))).toBeInTheDocument();
    });

    it("should use correct regime colors from regimeData", async () => {
      const user = userEvent.setup();
      const mockData = MOCK_SCENARIOS.extremeGreed;

      render(<WalletPortfolioPresenter data={mockData} />);

      // Expand strategy section
      const strategyCard = screen.getByTestId("strategy-card");
      await user.click(strategyCard);

      const regimeSpectrum = screen.getByTestId("regime-spectrum");

      // Verify each regime has correct fillColor from regimeData.ts
      for (const regime of regimes) {
        const regimeElement = within(regimeSpectrum)
          .getByText(regime.label)
          .closest("button");
        const colorDot = regimeElement!.querySelector(".rounded-full");

        expect(colorDot).toHaveStyle({
          backgroundColor: regime.fillColor,
        });
      }
    });

    it("should show 'prices are high' for Greed/Extreme Greed", async () => {
      const user = userEvent.setup();
      render(<WalletPortfolioPresenter data={MOCK_SCENARIOS.extremeGreed} />);

      const strategyCard = screen.getByTestId("strategy-card");
      await user.click(strategyCard);

      expect(screen.getByText(getZapAction("eg"))).toBeInTheDocument();
    });

    it("should show 'prices are low' for Fear/Extreme Fear", async () => {
      const user = userEvent.setup();
      render(<WalletPortfolioPresenter data={MOCK_SCENARIOS.extremeFear} />);

      const strategyCard = screen.getByTestId("strategy-card");
      await user.click(strategyCard);

      expect(screen.getByText(getZapAction("ef"))).toBeInTheDocument();
    });

    it("should show 'market sentiment is balanced' for Neutral", async () => {
      const user = userEvent.setup();
      const neutralMockData = {
        ...MOCK_SCENARIOS.neutral,
        currentAllocation: {
          ...MOCK_SCENARIOS.neutral.currentAllocation,
          simplifiedCrypto: MOCK_DATA.currentAllocation.simplifiedCrypto,
        },
      };

      render(<WalletPortfolioPresenter data={neutralMockData} />);

      const strategyCard = screen.getByTestId("strategy-card");
      await user.click(strategyCard);

      expect(screen.getByText(getZapAction("n"))).toBeInTheDocument();
    });
  });

  describe("AnimatePresence Rendering", () => {
    it("should not render regime spectrum when strategy is collapsed", () => {
      render(<WalletPortfolioPresenter data={MOCK_DATA} />);

      // Regime spectrum should not be visible initially
      expect(screen.queryByTestId("regime-spectrum")).not.toBeInTheDocument();
    });

    it("should render regime spectrum when strategy is expanded", async () => {
      const user = userEvent.setup();
      render(<WalletPortfolioPresenter data={MOCK_DATA} />);

      // Initially not visible
      expect(screen.queryByTestId("regime-spectrum")).not.toBeInTheDocument();

      // Click to expand
      const strategyCard = screen.getByTestId("strategy-card");
      await user.click(strategyCard);

      // Now visible
      const regimeSpectrum = screen.getByTestId("regime-spectrum");
      expect(regimeSpectrum).toBeInTheDocument();

      // All 5 regimes should be rendered
      expect(
        within(regimeSpectrum).getByText("Extreme Fear")
      ).toBeInTheDocument();
      expect(within(regimeSpectrum).getByText("Fear")).toBeInTheDocument();
      expect(within(regimeSpectrum).getByText("Neutral")).toBeInTheDocument();
      expect(within(regimeSpectrum).getByText("Greed")).toBeInTheDocument();
      expect(
        within(regimeSpectrum).getByText("Extreme Greed")
      ).toBeInTheDocument();
    });
  });
});
