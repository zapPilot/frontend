/**
 * Unit tests for TooltipRow component
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TooltipRow } from "@/components/charts/tooltipContent/TooltipRow";

describe("TooltipRow", () => {
  describe("Basic rendering", () => {
    it("should render label and value", () => {
      render(<TooltipRow label="Balance" value="$1,000" />);

      expect(screen.getByText("Balance")).toBeInTheDocument();
      expect(screen.getByText("$1,000")).toBeInTheDocument();
    });

    it("should apply default color classes", () => {
      render(<TooltipRow label="Test" value="100" />);

      const label = screen.getByText("Test");
      const value = screen.getByText("100");

      expect(label).toHaveClass("text-gray-400");
      expect(value).toHaveClass("text-white");
    });

    it("should apply custom color classes", () => {
      render(
        <TooltipRow
          label="Custom"
          value="500"
          labelColor="text-blue-400"
          valueColor="text-green-400"
        />
      );

      const label = screen.getByText("Custom");
      const value = screen.getByText("500");

      expect(label).toHaveClass("text-blue-400");
      expect(value).toHaveClass("text-green-400");
    });
  });

  describe("Value formatting", () => {
    it("should display N/A for undefined value", () => {
      render(<TooltipRow label="Missing" value={undefined} />);

      expect(screen.getByText("N/A")).toBeInTheDocument();
    });

    it("should format currency values", () => {
      render(<TooltipRow label="Balance" value={1234} format="currency" />);

      expect(screen.getByText("$1,234")).toBeInTheDocument();
    });

    it("should format currencyPrecise values", () => {
      render(
        <TooltipRow label="Amount" value={1234.56} format="currencyPrecise" />
      );

      expect(screen.getByText("$1,234.56")).toBeInTheDocument();
    });

    it("should format percent values", () => {
      render(<TooltipRow label="Change" value={25} format="percent" />);

      expect(screen.getByText("25.0%")).toBeInTheDocument();
    });

    it("should format percent with custom precision", () => {
      render(
        <TooltipRow label="APR" value={12.345} format="percent" precision={2} />
      );

      expect(screen.getByText("12.35%")).toBeInTheDocument();
    });

    it("should display text values as-is for format=text", () => {
      render(<TooltipRow label="Status" value={42} format="text" />);

      expect(screen.getByText("42")).toBeInTheDocument();
    });

    it("should display string values as-is", () => {
      render(<TooltipRow label="Name" value="Test Value" />);

      expect(screen.getByText("Test Value")).toBeInTheDocument();
    });
  });

  describe("Prefix", () => {
    it("should display prefix before value", () => {
      render(<TooltipRow label="Change" value={5} prefix="+" />);

      // The prefix and value should be combined in the same span
      const valueSpan = screen.getByText(/\+5/);
      expect(valueSpan).toBeInTheDocument();
    });

    it("should work with currency format and prefix", () => {
      render(
        <TooltipRow label="Profit" value={100} format="currency" prefix="↑ " />
      );

      expect(screen.getByText(/↑ \$100/)).toBeInTheDocument();
    });
  });
});
