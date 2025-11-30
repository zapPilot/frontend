import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BalanceMetric } from "@/components/wallet/metrics/BalanceMetric";
import type { PoolDetail } from "@/types/domain/pool";

// Mock dependencies
vi.mock("@/hooks/useMetricState", () => ({
  useMetricState: vi.fn(({ isLoading, shouldShowLoading, value }) => ({
    shouldRenderSkeleton: isLoading || shouldShowLoading,
    value,
  })),
}));

vi.mock("@/components/wallet/tooltips", () => ({
  PoolDetailsTooltip: ({ poolDetails }: { poolDetails: PoolDetail[] }) => (
    <div data-testid="pool-tooltip">
      Pool Details: {poolDetails.length} pools
    </div>
  ),
  useMetricsTooltip: () => ({
    triggerRef: { current: null },
    tooltipRef: { current: null },
    visible: false,
    toggle: vi.fn(),
    position: { top: 0, left: 0 },
  }),
}));

const mockPoolDetails: PoolDetail[] = [
  {
    pool_id: "1",
    protocol: "Aave",
    chain: "Ethereum",
    symbols: ["USDC"],
    balance_usd: 1000,
    supply_apy: 5.2,
    borrow_apy: 0,
    net_apy: 5.2,
  },
  {
    pool_id: "2",
    protocol: "Compound",
    chain: "Ethereum",
    symbols: ["DAI"],
    balance_usd: 500,
    supply_apy: 4.8,
    borrow_apy: 0,
    net_apy: 4.8,
  },
];

describe("BalanceMetric", () => {
  describe("Loading States", () => {
    it("should render loading skeleton when isLoading is true", () => {
      render(<BalanceMetric isLoading={true} />);

      expect(screen.getByText("Balance")).toBeInTheDocument();
      // BalanceSkeleton is rendered inside a div with h-8 class
      const skeletonContainer = screen.getByText("Balance").parentElement?.nextElementSibling;
      expect(skeletonContainer).toHaveClass("h-8");
    });

    it("should render loading skeleton when shouldShowLoading is true", () => {
      render(<BalanceMetric shouldShowLoading={true} totalNetUsd={1000} />);

      expect(screen.getByText("Balance")).toBeInTheDocument();
      const skeletonContainer = screen.getByText("Balance").parentElement?.nextElementSibling;
      expect(skeletonContainer).toHaveClass("h-8");
    });
  });

  describe("Error States", () => {
    it("should render error state with error message", () => {
      render(
        <BalanceMetric
          shouldShowError={true}
          errorMessage="Failed to fetch balance"
        />
      );

      expect(screen.getByText("Balance")).toBeInTheDocument();
      expect(screen.getByText("Failed to fetch balance")).toBeInTheDocument();
    });

    it("should use red styling for error state", () => {
      const { container } = render(
        <BalanceMetric
          shouldShowError={true}
          errorMessage="Network error"
        />
      );

      // Check for red badge
      const badge = screen.getByText("Balance").parentElement;
      expect(badge).toHaveClass("bg-red-500/10", "border-red-500/20");

      // Check for error card styling
      const card = container.querySelector('[class*="bg-gray-900/50"]');
      expect(card).toHaveClass("border-red-900/30");
    });

    it("should not render error for USER_NOT_FOUND", () => {
      render(
        <BalanceMetric
          shouldShowError={true}
          errorMessage="USER_NOT_FOUND"
          shouldShowNoDataMessage={true}
        />
      );

      // Should show no data instead of error
      expect(screen.queryByText("USER_NOT_FOUND")).not.toBeInTheDocument();
    });
  });

  describe("No Data State", () => {
    it("should render NoDataMetricCard when shouldShowNoDataMessage is true", () => {
      render(<BalanceMetric shouldShowNoDataMessage={true} />);

      expect(screen.getByText("Balance")).toBeInTheDocument();
      // NoDataMetricCard renders the label
      const labels = screen.getAllByText("Balance");
      expect(labels.length).toBeGreaterThan(0);
    });
  });

  describe("Normal Display", () => {
    it("should display formatted currency value", () => {
      render(<BalanceMetric totalNetUsd={15000.5} />);

      expect(screen.getByText("$15,000.50")).toBeInTheDocument();
    });

    it("should hide balance when balanceHidden is true", () => {
      render(<BalanceMetric totalNetUsd={15000.5} balanceHidden={true} />);

      expect(screen.getByText("••••••••")).toBeInTheDocument();
      expect(screen.queryByText("$15,000.50")).not.toBeInTheDocument();
    });

    it("should use custom getDisplayTotalValue when provided", () => {
      const getDisplayTotalValue = vi.fn(() => 25000);
      render(
        <BalanceMetric
          totalNetUsd={15000}
          getDisplayTotalValue={getDisplayTotalValue}
        />
      );

      expect(getDisplayTotalValue).toHaveBeenCalled();
      expect(screen.getByText("$25,000.00")).toBeInTheDocument();
    });

    it("should display $0.00 when value is null", () => {
      render(<BalanceMetric totalNetUsd={null} />);

      expect(screen.getByText("$0.00")).toBeInTheDocument();
    });
  });

  describe("Pool Details Tooltip", () => {
    it("should render info icon when poolDetails provided", () => {
      render(
        <BalanceMetric totalNetUsd={1500} poolDetails={mockPoolDetails} />
      );

      // Info icon should be present (role="button" with aria-label)
      const infoButton = screen.getByRole("button", { name: "Pool details" });
      expect(infoButton).toBeInTheDocument();
    });

    it("should not render info icon when poolDetails is undefined", () => {
      render(<BalanceMetric totalNetUsd={1500} />);

      expect(
        screen.queryByRole("button", { name: "Pool details" })
      ).not.toBeInTheDocument();
    });

    it("should have accessible keyboard interaction", () => {
      render(
        <BalanceMetric totalNetUsd={1500} poolDetails={mockPoolDetails} />
      );

      const infoButton = screen.getByRole("button", { name: "Pool details" });

      // Verify keyboard accessibility attributes
      expect(infoButton).toHaveAttribute("tabIndex", "0");
      expect(infoButton).toHaveAttribute("role", "button");
      expect(infoButton).toHaveAttribute("aria-label", "Pool details");
    });
  });

  describe("Pool Statistics Grid", () => {
    it("should render positions, protocols, and chains stats", () => {
      render(
        <BalanceMetric
          totalNetUsd={1500}
          poolDetails={mockPoolDetails}
          totalPositions={5}
          protocolsCount={3}
          chainsCount={2}
        />
      );

      expect(screen.getByText("Positions")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();

      expect(screen.getByText("Protocols")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();

      expect(screen.getByText("Chains")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    it("should display 0 for missing pool statistics", () => {
      render(
        <BalanceMetric totalNetUsd={1500} poolDetails={mockPoolDetails} />
      );

      const zeros = screen.getAllByText("0");
      expect(zeros.length).toBe(3); // All three stats should show 0
    });

    it("should not render pool stats when poolDetails is undefined", () => {
      render(
        <BalanceMetric
          totalNetUsd={1500}
          totalPositions={5}
          protocolsCount={3}
          chainsCount={2}
        />
      );

      expect(screen.queryByText("Positions")).not.toBeInTheDocument();
      expect(screen.queryByText("Protocols")).not.toBeInTheDocument();
      expect(screen.queryByText("Chains")).not.toBeInTheDocument();
    });
  });

  describe("Visual Elements", () => {
    it("should render badge label with blue styling", () => {
      render(<BalanceMetric totalNetUsd={1500} />);

      const badge = screen.getByText("Balance").parentElement;
      expect(badge).toHaveClass(
        "px-2",
        "py-0.5",
        "rounded-full",
        "bg-blue-500/10",
        "border-blue-500/20"
      );
    });

    it("should have consistent height of h-[140px]", () => {
      const { container } = render(<BalanceMetric totalNetUsd={1500} />);

      const card = container.querySelector('[class*="h-\\[140px\\]"]');
      expect(card).toBeInTheDocument();
    });

    it("should render left gradient accent border", () => {
      const { container } = render(<BalanceMetric totalNetUsd={1500} />);

      const gradientBorder = container.querySelector(
        '[class*="bg-gradient-to-b"][class*="from-blue-500"][class*="to-purple-500"]'
      );
      expect(gradientBorder).toBeInTheDocument();
    });

    it("should not render gradient border in error state", () => {
      const { container } = render(
        <BalanceMetric shouldShowError={true} errorMessage="Error occurred" />
      );

      const gradientBorder = container.querySelector(
        '[class*="bg-gradient-to-b"]'
      );
      expect(gradientBorder).not.toBeInTheDocument();
    });
  });
});
