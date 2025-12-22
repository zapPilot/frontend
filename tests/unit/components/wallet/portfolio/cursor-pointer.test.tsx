/**
 * Cursor Pointer Tests
 *
 * Ensures all interactive elements have cursor-pointer styling for UX consistency.
 * These tests verify that clickable elements display proper cursor feedback.
 *
 * Related commit: c94492d169117fe31ff37f876814ffd99606cd0d
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: vi.fn(({ children, ...props }) => <div {...props}>{children}</div>),
  },
  AnimatePresence: vi.fn(({ children }) => <>{children}</>),
}));

// Mock next/image
vi.mock("next/image", () => ({
  default: vi.fn(({ alt, ...props }) => <img alt={alt} {...props} />),
}));

// Mock lucide-react icons - use importOriginal to preserve all exports
vi.mock("lucide-react", async importOriginal => {
  const actual = await importOriginal<typeof import("lucide-react")>();
  return {
    ...actual,
    // Override specific icons for simpler rendering in tests if needed
  };
});

describe("Cursor Pointer Styling", () => {
  describe("WalletNavigation", () => {
    it("tab buttons have cursor-pointer class", async () => {
      const { WalletNavigation } = await import(
        "@/components/wallet/portfolio/components/WalletNavigation"
      );

      render(
        <WalletNavigation
          activeTab="dashboard"
          setActiveTab={vi.fn()}
          onOpenSettings={vi.fn()}
        />
      );

      const dashboardTab = screen.getByTestId("v22-tab-dashboard");
      const analyticsTab = screen.getByTestId("v22-tab-analytics");

      expect(dashboardTab.className).toContain("cursor-pointer");
      expect(analyticsTab.className).toContain("cursor-pointer");
    });

    it("all navigation tabs include cursor-pointer in base styles", async () => {
      // Directly import and verify the STYLES constant includes cursor-pointer
      const module = await import(
        "@/components/wallet/portfolio/components/WalletNavigation"
      );

      // Access internal STYLES through the component rendering
      const { WalletNavigation } = module;
      render(
        <WalletNavigation
          activeTab="dashboard"
          setActiveTab={vi.fn()}
          onOpenSettings={vi.fn()}
        />
      );

      // Query all tab buttons
      const tabs = screen.getAllByRole("button");
      for (const tab of tabs) {
        // Navigation tabs should have cursor-pointer
        if (tab.getAttribute("data-testid")?.startsWith("v22-tab-")) {
          expect(tab.className).toContain("cursor-pointer");
        }
      }
    });
  });

  describe("AnalyticsHeader", () => {
    it("export button has cursor-pointer when enabled", async () => {
      const { AnalyticsHeader } = await import(
        "@/components/wallet/portfolio/views/AnalyticsView/components/AnalyticsHeader"
      );

      render(<AnalyticsHeader onExport={vi.fn()} isExporting={false} />);

      const exportButton = screen.getByRole("button", {
        name: /export report/i,
      });
      expect(exportButton.className).toContain("cursor-pointer");
    });

    it("export button has cursor-not-allowed when exporting", async () => {
      const { AnalyticsHeader } = await import(
        "@/components/wallet/portfolio/views/AnalyticsView/components/AnalyticsHeader"
      );

      render(<AnalyticsHeader onExport={vi.fn()} isExporting={true} />);

      const exportButton = screen.getByRole("button", {
        name: /exporting/i,
      });
      expect(exportButton.className).toContain("disabled:cursor-not-allowed");
    });
  });

  describe("ChartSection", () => {
    const mockAnalyticsData = {
      performanceChart: {
        points: [],
        startDate: "2025-01-01",
        endDate: "2025-12-01",
      },
      drawdownChart: {
        points: [],
        maxDrawdown: -0.1,
      },
    };

    const mockPeriod = { key: "1M", label: "1M", days: 30 };

    it("chart type tabs have cursor-pointer when not loading", async () => {
      const { ChartSection } = await import(
        "@/components/wallet/portfolio/views/AnalyticsView/components/ChartSection"
      );

      render(
        <ChartSection
          data={mockAnalyticsData as never}
          selectedPeriod={mockPeriod as never}
          activeChartTab="performance"
          onPeriodChange={vi.fn()}
          onChartTabChange={vi.fn()}
          isLoading={false}
        />
      );

      const buttons = screen.getAllByRole("button");
      // First two buttons are chart type tabs (Performance, Drawdown)
      const chartTabs = buttons.slice(0, 2);

      for (const tab of chartTabs) {
        expect(tab.className).toContain("cursor-pointer");
        expect(tab.className).not.toContain("cursor-not-allowed");
      }
    });

    it("period selector buttons have cursor-pointer when not loading", async () => {
      const { ChartSection } = await import(
        "@/components/wallet/portfolio/views/AnalyticsView/components/ChartSection"
      );

      render(
        <ChartSection
          data={mockAnalyticsData as never}
          selectedPeriod={mockPeriod as never}
          activeChartTab="performance"
          onPeriodChange={vi.fn()}
          onChartTabChange={vi.fn()}
          isLoading={false}
        />
      );

      // Period buttons: 1M, 3M, 6M, 1Y, ALL
      const periodButton = screen.getByRole("button", { name: "1M" });
      expect(periodButton.className).toContain("cursor-pointer");
    });

    it("buttons have cursor-not-allowed when loading", async () => {
      const { ChartSection } = await import(
        "@/components/wallet/portfolio/views/AnalyticsView/components/ChartSection"
      );

      render(
        <ChartSection
          data={mockAnalyticsData as never}
          selectedPeriod={mockPeriod as never}
          activeChartTab="performance"
          onPeriodChange={vi.fn()}
          onChartTabChange={vi.fn()}
          isLoading={true}
        />
      );

      const buttons = screen.getAllByRole("button");
      for (const button of buttons) {
        expect(button.className).toContain("cursor-not-allowed");
      }
    });
  });

  describe("StrategyCard", () => {
    const mockData = {
      currentRegime: "n",
      sentimentValue: 50,
      strategyDirection: "default",
    };

    const mockRegime = {
      id: "n",
      label: "Neutral",
      fillColor: "#888888",
      strategies: {
        default: {
          philosophy: "Test philosophy",
        },
      },
    };

    it("card container has cursor-pointer class", async () => {
      const { StrategyCard } = await import(
        "@/components/wallet/portfolio/components/StrategyCard"
      );

      render(
        <StrategyCard
          data={mockData as never}
          currentRegime={mockRegime as never}
        />
      );

      const card = screen.getByTestId("strategy-card");
      expect(card.className).toContain("cursor-pointer");
    });
  });
});
