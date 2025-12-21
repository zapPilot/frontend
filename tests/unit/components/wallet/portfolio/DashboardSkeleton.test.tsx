/**
 * Dashboard Skeleton Components Tests
 *
 * Tests for content-aware skeleton components that show real labels/buttons
 * while using skeleton placeholders only for dynamic data
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
    BalanceCardSkeleton,
    DashboardSkeleton,
    PortfolioCompositionSkeleton,
    StrategyCardSkeleton,
} from "@/components/wallet/portfolio/views/DashboardSkeleton";

describe("BalanceCardSkeleton", () => {
  it("should render the 'Net Worth' label", () => {
    render(<BalanceCardSkeleton />);
    expect(screen.getByText("Net Worth")).toBeInTheDocument();
  });

  it("should render disabled Deposit button", () => {
    render(<BalanceCardSkeleton />);
    const depositButton = screen.getByRole("button", { name: /deposit/i, hidden: true });
    expect(depositButton).toBeInTheDocument();
    expect(depositButton).toBeDisabled();
  });

  it("should render disabled Withdraw button", () => {
    render(<BalanceCardSkeleton />);
    const withdrawButton = screen.getByRole("button", { name: /withdraw/i, hidden: true });
    expect(withdrawButton).toBeInTheDocument();
    expect(withdrawButton).toBeDisabled();
  });

  it("should have skeleton placeholders for balance value", () => {
    const { container } = render(<BalanceCardSkeleton />);
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("should have proper card styling", () => {
    const { container } = render(<BalanceCardSkeleton />);
    const card = container.querySelector(".bg-gray-900\\/40");
    expect(card).toBeInTheDocument();
  });

  it("should be marked as aria-hidden", () => {
    const { container } = render(<BalanceCardSkeleton />);
    const skeleton = container.firstChild;
    expect(skeleton).toHaveAttribute("aria-hidden", "true");
  });
});

describe("StrategyCardSkeleton", () => {
  it("should render the 'Current Strategy' label", () => {
    render(<StrategyCardSkeleton />);
    expect(screen.getByText("Current Strategy")).toBeInTheDocument();
  });

  it("should render Info icon", () => {
    const { container } = render(<StrategyCardSkeleton />);
    // Check for lucide-react Info icon (svg)
    const infoIcon = container.querySelector("svg");
    expect(infoIcon).toBeInTheDocument();
  });

  it("should render Chevron icon", () => {
    const { container } = render(<StrategyCardSkeleton />);
    // ChevronDown is rendered
    const chevronIcons = container.querySelectorAll("svg");
    expect(chevronIcons.length).toBeGreaterThan(0);
  });

  it("should have skeleton placeholders for regime badge and text", () => {
    const { container } = render(<StrategyCardSkeleton />);
    const skeletons = container.querySelectorAll(".animate-pulse");
    // Should have skeleton for regime badge, title, and philosophy text
    expect(skeletons.length).toBeGreaterThanOrEqual(3);
  });

  it("should have proper card styling", () => {
    const { container } = render(<StrategyCardSkeleton />);
    const card = container.querySelector(".bg-gray-900\\/40");
    expect(card).toBeInTheDocument();
  });

  it("should be marked as aria-hidden", () => {
    const { container } = render(<StrategyCardSkeleton />);
    const skeleton = container.firstChild;
    expect(skeleton).toHaveAttribute("aria-hidden", "true");
  });
});

describe("PortfolioCompositionSkeleton", () => {
  it("should render the 'Portfolio Composition' title", () => {
    render(<PortfolioCompositionSkeleton />);
    expect(screen.getByText("Portfolio Composition")).toBeInTheDocument();
  });

  it("should render the 'Target:' label", () => {
    render(<PortfolioCompositionSkeleton />);
    expect(screen.getByText("Target:")).toBeInTheDocument();
  });

  it("should render disabled Rebalance button", () => {
    render(<PortfolioCompositionSkeleton />);
    const rebalanceButton = screen.getByRole("button", { name: /rebalance/i, hidden: true });
    expect(rebalanceButton).toBeInTheDocument();
    expect(rebalanceButton).toBeDisabled();
  });

  it("should render legend labels for Crypto and Stablecoins", () => {
    render(<PortfolioCompositionSkeleton />);
    expect(screen.getByText("Crypto")).toBeInTheDocument();
    expect(screen.getByText("Stablecoins")).toBeInTheDocument();
  });

  it("should have skeleton placeholders for allocation chips and drift", () => {
    const { container } = render(<PortfolioCompositionSkeleton />);
    const skeletons = container.querySelectorAll(".animate-pulse");
    // Should have skeletons for: 2 allocation chips, composition bar, drift value
    expect(skeletons.length).toBeGreaterThanOrEqual(4);
  });

  it("should render colored dots for legend", () => {
    const { container } = render(<PortfolioCompositionSkeleton />);
    const legendDots = container.querySelectorAll(".w-2.h-2.rounded-full");
    expect(legendDots.length).toBeGreaterThanOrEqual(2);
  });

  it("should be marked as aria-hidden", () => {
    const { container } = render(<PortfolioCompositionSkeleton />);
    const skeleton = container.firstChild;
    expect(skeleton).toHaveAttribute("aria-hidden", "true");
  });
});

describe("DashboardSkeleton", () => {
  it("should render all three dashboard skeletons", () => {
    render(<DashboardSkeleton />);

    // Check for labels from all three skeleton components
    expect(screen.getByText("Net Worth")).toBeInTheDocument();
    expect(screen.getByText("Current Strategy")).toBeInTheDocument();
    expect(screen.getByText("Portfolio Composition")).toBeInTheDocument();
  });

  it("should have screen reader announcement", () => {
    render(<DashboardSkeleton />);
    expect(
      screen.getByText("Loading your portfolio dashboard...")
    ).toBeInTheDocument();
  });

  it("should have proper role and aria-label for accessibility", () => {
    render(<DashboardSkeleton />);
    const skeleton = screen.getByRole("status", {
      name: "Loading dashboard data",
    });
    expect(skeleton).toBeInTheDocument();
  });

  it("should render in grid layout", () => {
    const { container } = render(<DashboardSkeleton />);
    const grid = container.querySelector(".grid.grid-cols-1.md\\:grid-cols-2");
    expect(grid).toBeInTheDocument();
  });

  it("should have proper spacing", () => {
    const { container } = render(<DashboardSkeleton />);
    const wrapper = container.querySelector(".space-y-6");
    expect(wrapper).toBeInTheDocument();
  });

  it("should have data-testid for testing", () => {
    render(<DashboardSkeleton />);
    const skeleton = screen.getByTestId("dashboard-loading");
    expect(skeleton).toBeInTheDocument();
  });
});

// Content-aware pattern verification tests
describe("Content-Aware Pattern", () => {
  it("BalanceCardSkeleton should show real UI, skeleton for values only", () => {
    const { container } = render(<BalanceCardSkeleton />);

    // Real UI elements
    expect(screen.getByText("Net Worth")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /deposit/i, hidden: true })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /withdraw/i, hidden: true })).toBeInTheDocument();

    // Skeleton placeholders (animate-pulse class)
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("StrategyCardSkeleton should show real labels, skeleton for content", () => {
    const { container } = render(<StrategyCardSkeleton />);

    // Real UI elements
    expect(screen.getByText("Current Strategy")).toBeInTheDocument();

    // Skeleton placeholders
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("PortfolioCompositionSkeleton should show real structure, skeleton for data", () => {
    const { container } = render(<PortfolioCompositionSkeleton />);

    // Real UI elements
    expect(screen.getByText("Portfolio Composition")).toBeInTheDocument();
    expect(screen.getByText("Crypto")).toBeInTheDocument();
    expect(screen.getByText("Stablecoins")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /rebalance/i, hidden: true })).toBeInTheDocument();

    // Skeleton placeholders
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
