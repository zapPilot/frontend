import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LoadingSpinner } from "../../../../src/components/ui";

describe("LoadingSpinner", () => {
  describe("Basic Rendering", () => {
    it("should render with default props", () => {
      render(<LoadingSpinner />);

      const spinner = screen.getByRole("status");
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveAttribute("aria-label", "Loading");
    });

    it("should render with custom aria-label", () => {
      render(<LoadingSpinner aria-label="Loading data" />);

      const spinner = screen.getByRole("status");
      expect(spinner).toHaveAttribute("aria-label", "Loading data");
    });

    it("should apply custom className", () => {
      render(<LoadingSpinner className="custom-class" />);

      const spinner = screen.getByRole("status");
      expect(spinner).toHaveClass("custom-class");
    });
  });

  describe("Size Variants", () => {
    it("should render xs size", () => {
      render(<LoadingSpinner size="xs" />);

      const spinner = screen.getByRole("status");
      expect(spinner).toHaveClass("w-3", "h-3");
    });

    it("should render sm size", () => {
      render(<LoadingSpinner size="sm" />);

      const spinner = screen.getByRole("status");
      expect(spinner).toHaveClass("w-4", "h-4");
    });

    it("should render md size (default)", () => {
      render(<LoadingSpinner size="md" />);

      const spinner = screen.getByRole("status");
      expect(spinner).toHaveClass("w-6", "h-6");
    });

    it("should render lg size", () => {
      render(<LoadingSpinner size="lg" />);

      const spinner = screen.getByRole("status");
      expect(spinner).toHaveClass("w-8", "h-8");
    });

    it("should render xl size", () => {
      render(<LoadingSpinner size="xl" />);

      const spinner = screen.getByRole("status");
      expect(spinner).toHaveClass("w-12", "h-12");
    });
  });

  describe("Color Variants", () => {
    it("should render with primary color (default)", () => {
      render(<LoadingSpinner color="primary" />);

      const svg = screen.getByRole("status").querySelector("svg");
      expect(svg).toHaveClass("text-blue-600");
    });

    it("should render with secondary color", () => {
      render(<LoadingSpinner color="secondary" />);

      const svg = screen.getByRole("status").querySelector("svg");
      expect(svg).toHaveClass("text-gray-600");
    });

    it("should render with white color", () => {
      render(<LoadingSpinner color="white" />);

      const svg = screen.getByRole("status").querySelector("svg");
      expect(svg).toHaveClass("text-white");
    });

    it("should render with success color", () => {
      render(<LoadingSpinner color="success" />);

      const svg = screen.getByRole("status").querySelector("svg");
      expect(svg).toHaveClass("text-green-600");
    });

    it("should render with warning color", () => {
      render(<LoadingSpinner color="warning" />);

      const svg = screen.getByRole("status").querySelector("svg");
      expect(svg).toHaveClass("text-yellow-600");
    });
  });

  describe("Animation", () => {
    it("should have spinning animation class", () => {
      render(<LoadingSpinner />);

      const svg = screen.getByRole("status").querySelector("svg");
      expect(svg).toHaveClass("animate-spin");
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA attributes", () => {
      render(<LoadingSpinner />);

      const spinner = screen.getByRole("status");
      expect(spinner).toHaveAttribute("aria-label", "Loading");
    });

    it("should be hidden from screen readers when decorative", () => {
      render(<LoadingSpinner aria-hidden="true" />);

      // When aria-hidden="true", the component correctly removes the role attribute
      const spinner = document.querySelector('[aria-hidden="true"]');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveAttribute("aria-hidden", "true");
      expect(spinner).not.toHaveAttribute("role");
    });
  });

  describe("SVG Structure", () => {
    it("should contain proper SVG structure", () => {
      render(<LoadingSpinner />);

      const svg = screen.getByRole("status").querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute("viewBox", "0 0 24 24");

      const circles = svg?.querySelectorAll("circle");
      expect(circles).toHaveLength(2);
    });

    it("should have fill set to none", () => {
      render(<LoadingSpinner />);

      const svg = screen.getByRole("status").querySelector("svg");
      expect(svg).toHaveAttribute("fill", "none");
    });
  });

  describe("Combined Props", () => {
    it("should work with multiple props combined", () => {
      render(
        <LoadingSpinner
          size="lg"
          color="success"
          className="custom-spinner"
          aria-label="Loading portfolio data"
        />
      );

      const spinner = screen.getByRole("status");
      expect(spinner).toHaveClass("custom-spinner", "w-8", "h-8");
      expect(spinner).toHaveAttribute("aria-label", "Loading portfolio data");

      const svg = spinner.querySelector("svg");
      expect(svg).toHaveClass("text-green-600", "animate-spin");
    });
  });
});
