import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { GlassCard } from "../../../../src/components/ui/GlassCard";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: vi.fn(({ children, ...props }) => <div {...props}>{children}</div>),
  },
}));

describe("GlassCard", () => {
  it("should render children correctly", () => {
    render(
      <GlassCard>
        <div>Test Content</div>
      </GlassCard>
    );

    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("should apply default classes", () => {
    render(
      <GlassCard testId="glass-card">
        <div>Test Content</div>
      </GlassCard>
    );

    const card = screen.getByTestId("glass-card");
    expect(card).toHaveClass(
      "glass-morphism",
      "rounded-3xl",
      "p-6",
      "border",
      "border-gray-800"
    );
  });

  it("should apply custom className", () => {
    render(
      <GlassCard className="custom-class" testId="glass-card">
        <div>Test Content</div>
      </GlassCard>
    );

    const card = screen.getByTestId("glass-card");
    expect(card).toHaveClass("custom-class");
  });

  it("should render with animation by default", () => {
    render(
      <GlassCard testId="glass-card">
        <div>Test Content</div>
      </GlassCard>
    );

    expect(screen.getByTestId("glass-card")).toBeInTheDocument();
  });

  it("should render without animation when animate=false", () => {
    render(
      <GlassCard animate={false} testId="glass-card">
        <div>Test Content</div>
      </GlassCard>
    );

    expect(screen.getByTestId("glass-card")).toBeInTheDocument();
  });

  it("should set testId when provided", () => {
    render(
      <GlassCard testId="custom-test-id">
        <div>Test Content</div>
      </GlassCard>
    );

    expect(screen.getByTestId("custom-test-id")).toBeInTheDocument();
  });
});
