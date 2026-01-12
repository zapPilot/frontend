
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HealthRiskTooltip } from "@/components/wallet/portfolio/components/shared/HealthRiskTooltip";
import { RiskLevel } from "@/constants/riskThresholds";
import type { RiskMetrics } from "@/services/analyticsService";

describe("HealthRiskTooltip", () => {
    const mockRiskMetrics: RiskMetrics = {
        health_rate: 1.5,
        leverage_ratio: 2.0,
        collateral_value_usd: 10000,
        debt_value_usd: 5000,
        liquidation_threshold: 1.2,
        protocol_source: "Aave",
        position_count: 1,
        // Add other required properties if any, based on type definition
    } as RiskMetrics;

    it("renders correctly with safe risk level", () => {
        render(
            <HealthRiskTooltip
                riskMetrics={mockRiskMetrics}
                riskLevel={RiskLevel.SAFE}
                isOwnBundle={true}
            />
        );
        expect(screen.getByText("Position Health")).toBeInTheDocument();
        expect(screen.getByText(/Safe/i)).toBeInTheDocument(); 
        expect(screen.getByText("Liquidation Buffer")).toBeInTheDocument();
    });

    it("renders correctly with critical risk level", () => {
         const criticalMetrics = { ...mockRiskMetrics, health_rate: 1.05, liquidation_threshold: 1.0 };
        render(
            <HealthRiskTooltip
                riskMetrics={criticalMetrics}
                riskLevel={RiskLevel.CRITICAL}
                isOwnBundle={true}
            />
        );
        expect(screen.getByText(/Critical/i)).toBeInTheDocument();
        expect(screen.getByText("Liquidation risk high. Add collateral or repay debt immediately.")).toBeInTheDocument();
    });

    it("shows visitor mode message when isOwnBundle is false", () => {
        render(
            <HealthRiskTooltip
                riskMetrics={mockRiskMetrics}
                riskLevel={RiskLevel.SAFE}
                isOwnBundle={false}
            />
        );
        expect(screen.getByText("Switch to your bundle to manage positions")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /View Detailed Breakdown/i })).not.toBeInTheDocument();
    });

    it("calls onViewDetails when button is clicked", () => {
        const mockOnViewDetails = vi.fn();
        render(
            <HealthRiskTooltip
                riskMetrics={mockRiskMetrics}
                riskLevel={RiskLevel.MODERATE}
                isOwnBundle={true}
                onViewDetails={mockOnViewDetails}
            />
        );
        
        const button = screen.getByRole("button", { name: /View Detailed Breakdown/i });
        fireEvent.click(button);
        expect(mockOnViewDetails).toHaveBeenCalledTimes(1);
    });

    it("displays multiple positions note when position_count > 1", () => {
        const multiPosMetrics = { ...mockRiskMetrics, position_count: 3 };
        render(
             <HealthRiskTooltip
                riskMetrics={multiPosMetrics}
                riskLevel={RiskLevel.MODERATE}
                isOwnBundle={true}
            />
        );
        expect(screen.getByText("Showing your riskiest position")).toBeInTheDocument();
        expect(screen.getByText(/3 positions/)).toBeInTheDocument();
    });
});
