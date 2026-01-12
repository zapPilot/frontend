import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HealthWarningBanner } from "@/components/wallet/portfolio/components/shared/HealthWarningBanner";
import type { RiskMetrics } from "@/services/analyticsService";

describe("HealthWarningBanner", () => {
  const mockRiskMetrics: RiskMetrics = {
    health_rate: 1.1, // Risky level
    leverage_ratio: 2.0,
    collateral_value_usd: 10000,
    debt_value_usd: 5000,
    liquidation_threshold: 1.2,
    protocol_source: "Aave",
    position_count: 1,
  } as RiskMetrics;

  const originalInnerWidth = window.innerWidth;

  beforeEach(() => {
    // Default to mobile width
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 400,
    });
    window.dispatchEvent(new Event("resize"));
  });

  afterEach(() => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    window.dispatchEvent(new Event("resize"));
  });

  it("renders on mobile when health is risky", () => {
    render(<HealthWarningBanner riskMetrics={mockRiskMetrics} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Liquidation Risk")).toBeInTheDocument();
    expect(screen.getByText(/Health factor at 1.10/)).toBeInTheDocument();
  });

  it("does not render on desktop", () => {
    Object.defineProperty(window, "innerWidth", { value: 1024 });
    window.dispatchEvent(new Event("resize"));

    render(<HealthWarningBanner riskMetrics={mockRiskMetrics} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("does not render when health is safe", () => {
    const safeMetrics = { ...mockRiskMetrics, health_rate: 2.0 };
    render(<HealthWarningBanner riskMetrics={safeMetrics} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows view details button when handler is provided", () => {
    const mockOnViewDetails = vi.fn();
    render(
      <HealthWarningBanner
        riskMetrics={mockRiskMetrics}
        onViewDetails={mockOnViewDetails}
      />
    );

    const button = screen.getByRole("button", { name: /View Details/i });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(mockOnViewDetails).toHaveBeenCalledTimes(1);
  });

  it("does not show view details button when handler is not provided", () => {
    render(<HealthWarningBanner riskMetrics={mockRiskMetrics} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
