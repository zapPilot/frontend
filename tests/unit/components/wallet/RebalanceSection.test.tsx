import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RebalanceSection } from "../../../../src/components/wallet/RebalanceSection";
import type { PortfolioAllocationSplit } from "../../../../src/types/portfolio";

describe("RebalanceSection", () => {
  const mockAllocation: PortfolioAllocationSplit = {
    stable: 60,
    crypto: 40,
    target: 50,
  };

  describe("Skeleton Loading States", () => {
    it("should render skeleton when isLoading is true", () => {
      render(<RebalanceSection allocation={mockAllocation} isLoading={true} />);

      // Should render multiple skeleton components
      const skeletons = screen.getAllByTestId("loading-skeleton");
      expect(skeletons.length).toBeGreaterThan(0);
      // Should not render actual content
      expect(screen.queryByText("Current Allocation")).not.toBeInTheDocument();
    });

    it("should not render skeleton when isLoading is false", () => {
      render(
        <RebalanceSection allocation={mockAllocation} isLoading={false} />
      );

      // Should NOT render skeleton
      expect(screen.queryByTestId("loading-skeleton")).not.toBeInTheDocument();
      // Should render actual content
      expect(screen.getByText("Current Allocation")).toBeInTheDocument();
    });

    it("should render skeleton when isLoading is true even if allocation is provided", () => {
      render(<RebalanceSection allocation={mockAllocation} isLoading={true} />);

      // Skeleton should take precedence
      const skeletons = screen.getAllByTestId("loading-skeleton");
      expect(skeletons.length).toBeGreaterThan(0);
      expect(screen.queryByText("Current Allocation")).not.toBeInTheDocument();
    });

    it("should render content when isLoading is undefined (defaults to false)", () => {
      render(<RebalanceSection allocation={mockAllocation} />);

      // isLoading defaults to false, should render content
      expect(screen.queryByTestId("loading-skeleton")).not.toBeInTheDocument();
      expect(screen.getByText("Current Allocation")).toBeInTheDocument();
    });
  });

  describe("Allocation Display", () => {
    it("should display allocation percentages correctly", () => {
      render(
        <RebalanceSection allocation={mockAllocation} isLoading={false} />
      );

      expect(screen.getByText(/60%/)).toBeInTheDocument(); // Stable
      expect(screen.getByText(/40%/)).toBeInTheDocument(); // Crypto
    });

    it("should display target percentage", () => {
      render(
        <RebalanceSection allocation={mockAllocation} isLoading={false} />
      );

      expect(screen.getByText(/Target: 50%/)).toBeInTheDocument();
    });

    it("should render optimize button when not loading", () => {
      render(
        <RebalanceSection allocation={mockAllocation} isLoading={false} />
      );

      expect(screen.getByText("Optimize")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle null allocation gracefully when not loading", () => {
      render(<RebalanceSection allocation={null} isLoading={false} />);

      // Should still render without crashing
      expect(screen.getByText("Current Allocation")).toBeInTheDocument();
    });

    it("should handle undefined allocation gracefully when not loading", () => {
      render(<RebalanceSection allocation={undefined} isLoading={false} />);

      // Should still render without crashing
      expect(screen.getByText("Current Allocation")).toBeInTheDocument();
    });
  });
});
