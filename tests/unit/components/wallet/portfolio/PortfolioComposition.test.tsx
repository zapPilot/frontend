/**
 * PortfolioComposition Component Tests
 *
 * Tests for the Portfolio Composition UI including:
 * - Drift indicator display and color coding
 * - Target and Current Portfolio bars
 * - Loading and empty states
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { WalletPortfolioDataWithDirection } from "@/adapters/walletPortfolioDataAdapter";
import { PortfolioComposition } from "@/components/wallet/portfolio/components/PortfolioComposition";

// Mock getRegimeAllocation to avoid deep dependency chain
vi.mock("@/components/wallet/regime/regimeData", () => ({
  getRegimeAllocation: vi.fn().mockReturnValue({
    spot: 40,
    lp: 20,
    stable: 40,
  }),
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  Zap: () => <svg data-testid="zap-icon" />,
}));

// Mock GradientButton to avoid icon issues
vi.mock("@/components/ui", () => ({
  GradientButton: ({
    children,
    disabled,
    ...props
  }: React.PropsWithChildren<{
    disabled?: boolean;
    "data-testid"?: string;
  }>) => (
    <button disabled={disabled} data-testid={props["data-testid"]}>
      {children}
    </button>
  ),
}));

// Mock the skeleton component
vi.mock("@/components/wallet/portfolio/views/DashboardSkeleton", () => ({
  PortfolioCompositionSkeleton: () => (
    <div data-testid="composition-skeleton">Loading...</div>
  ),
}));

const mockData: WalletPortfolioDataWithDirection = {
  totalBalance: 10000,
  currentAllocation: {
    crypto: 60,
    stable: 40,
    simplifiedCrypto: [
      {
        asset: "bitcoin",
        symbol: "BTC",
        name: "Bitcoin",
        value: 40,
        color: "#F7931A",
      },
      {
        asset: "ethereum",
        symbol: "ETH",
        name: "Ethereum",
        value: 20,
        color: "#627EEA",
      },
    ],
  },
  delta: 5.5,
  direction: "below",
};

describe("PortfolioComposition", () => {
  const mockOnRebalance = vi.fn();

  describe("Rendering", () => {
    it("renders the composition bar with title", () => {
      render(
        <PortfolioComposition
          data={mockData}
          currentRegime="Risk-On"
          onRebalance={mockOnRebalance}
        />
      );

      expect(screen.getByText("Portfolio Composition")).toBeInTheDocument();
    });

    it("renders target and current portfolio labels", () => {
      render(
        <PortfolioComposition
          data={mockData}
          currentRegime="Risk-On"
          onRebalance={mockOnRebalance}
        />
      );

      expect(screen.getByText("Target Allocation")).toBeInTheDocument();
      expect(screen.getByText("Current Portfolio")).toBeInTheDocument();
    });

    it("renders the rebalance button", () => {
      render(
        <PortfolioComposition
          data={mockData}
          currentRegime="Risk-On"
          onRebalance={mockOnRebalance}
        />
      );

      expect(screen.getByTestId("rebalance-button")).toBeInTheDocument();
    });
  });

  describe("Drift Indicator", () => {
    it("displays drift percentage in the header", () => {
      render(
        <PortfolioComposition
          data={mockData}
          currentRegime="Risk-On"
          onRebalance={mockOnRebalance}
        />
      );

      expect(screen.getByText(/Drift: 5.5%/)).toBeInTheDocument();
    });

    it("applies orange color when drift exceeds 5%", () => {
      const highDriftData = { ...mockData, delta: 7.2 };
      render(
        <PortfolioComposition
          data={highDriftData}
          currentRegime="Risk-On"
          onRebalance={mockOnRebalance}
        />
      );

      const driftElement = screen.getByText(/Drift: 7.2%/);
      expect(driftElement).toHaveClass("text-orange-400");
    });

    it("applies gray color when drift is at or below 5%", () => {
      const lowDriftData = { ...mockData, delta: 3.0 };
      render(
        <PortfolioComposition
          data={lowDriftData}
          currentRegime="Risk-On"
          onRebalance={mockOnRebalance}
        />
      );

      const driftElement = screen.getByText(/Drift: 3.0%/);
      expect(driftElement).toHaveClass("text-gray-500");
    });
  });

  describe("Loading State", () => {
    it("renders skeleton when isLoading is true", () => {
      render(
        <PortfolioComposition
          data={mockData}
          currentRegime="Risk-On"
          isLoading={true}
          onRebalance={mockOnRebalance}
        />
      );

      expect(screen.getByTestId("composition-skeleton")).toBeInTheDocument();
      expect(
        screen.queryByText("Portfolio Composition")
      ).not.toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("disables rebalance button when isEmptyState is true", () => {
      render(
        <PortfolioComposition
          data={mockData}
          currentRegime="Risk-On"
          isEmptyState={true}
          onRebalance={mockOnRebalance}
        />
      );

      expect(screen.getByTestId("rebalance-button")).toBeDisabled();
    });
  });

  describe("Target Allocation Fallback", () => {
    it("returns null when no target and no regime provided", () => {
      const { container } = render(
        <PortfolioComposition
          data={mockData}
          currentRegime={undefined}
          targetAllocation={undefined}
          onRebalance={mockOnRebalance}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it("renders when targetAllocation prop is provided without regime", () => {
      render(
        <PortfolioComposition
          data={mockData}
          currentRegime={undefined}
          targetAllocation={{ crypto: 50, stable: 50 }}
          onRebalance={mockOnRebalance}
        />
      );

      expect(screen.getByText("Portfolio Composition")).toBeInTheDocument();
    });
  });
});
