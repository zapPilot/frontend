import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BacktestingView } from "@/components/wallet/portfolio/views/BacktestingView";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock lucide-react
vi.mock("lucide-react", () => ({
  Activity: () => <div data-testid="activity-icon" />,
  AlertTriangle: () => <div data-testid="alert-icon" />,
  Play: () => <div data-testid="play-icon" />,
  RefreshCw: () => <div data-testid="refresh-icon" />,
  RotateCcw: () => <div data-testid="reset-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  Shield: () => <div data-testid="shield-icon" />,
  TrendingUp: () => <div data-testid="trending-icon" />,
  Zap: () => <div data-testid="zap-icon" />,
}));

describe("BacktestingView", () => {
  it("renders configuration panel correctly", () => {
    render(<BacktestingView />);

    expect(screen.getByText("Strategy Simulator")).toBeInTheDocument();
    expect(screen.getByText("Configuration")).toBeInTheDocument();
    expect(screen.getByText("Strategy Profile")).toBeInTheDocument();
    expect(screen.getByText("Time Period")).toBeInTheDocument();
  });

  it("changes strategy profile when buttons are clicked", () => {
    render(<BacktestingView />);

    // Initial state is aggressive
    const aggressiveBtn = screen.getByText("Aggressive").closest("button");
    const conservativeBtn = screen.getByText("Conservative").closest("button");

    // Check styled as active (aggressive default)
    expect(aggressiveBtn?.className).toContain("bg-gray-800");

    // Click conservative
    fireEvent.click(conservativeBtn!);

    // Check styled as active (conservative)
    expect(conservativeBtn?.className).toContain("bg-gray-800");
  });

  it("updates DCA frequency when clicked", () => {
    render(<BacktestingView />);

    // Initial default is Weekly
    const weeklyBtn = screen.getByText("Weekly", { selector: "button" });
    expect(weeklyBtn?.className).toContain("bg-gray-700");

    // Click Daily
    const dailyBtn = screen.getByText("Daily", { selector: "button" });
    fireEvent.click(dailyBtn!);

    expect(dailyBtn?.className).toContain("bg-gray-700");
  });

  it("toggles leverage option when aggressive strategy is selected", () => {
    render(<BacktestingView />);

    // Should be visible by default (Aggressive)
    expect(screen.getByText("Enable Smart Leverage")).toBeInTheDocument();

    // Switch to Conservative
    fireEvent.click(screen.getByText("Conservative"));

    // Should disappear (mocked AnimatePresence might just remove it)
    expect(screen.queryByText("Enable Smart Leverage")).not.toBeInTheDocument();
  });
});
