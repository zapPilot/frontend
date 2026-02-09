import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AlertCircle } from "lucide-react";
import { describe, expect, it, vi } from "vitest";

import { EmptyStateCard } from "@/components/ui/EmptyStateCard";
import { ErrorStateCard } from "@/components/ui/ErrorStateCard";

describe("EmptyStateCard", () => {
  it("renders icon and message", () => {
    render(<EmptyStateCard icon={AlertCircle} message="No data available" />);
    expect(screen.getByText("No data available")).toBeInTheDocument();
  });

  it("renders optional description", () => {
    render(
      <EmptyStateCard
        icon={AlertCircle}
        message="Empty"
        description="Try again later"
      />
    );
    expect(screen.getByText("Try again later")).toBeInTheDocument();
  });

  it("does not render description when not provided", () => {
    render(<EmptyStateCard icon={AlertCircle} message="Empty" />);
    expect(screen.queryByText("Try again later")).not.toBeInTheDocument();
  });

  it("applies custom iconClassName", () => {
    const { container } = render(
      <EmptyStateCard
        icon={AlertCircle}
        message="Test"
        iconClassName="text-blue-500"
      />
    );
    const svg = container.querySelector("svg");
    expect(svg?.className.baseVal || svg?.getAttribute("class")).toContain(
      "text-blue-500"
    );
  });
});

describe("ErrorStateCard", () => {
  it("renders error message", () => {
    render(<ErrorStateCard message="Something went wrong" />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("renders optional details", () => {
    render(<ErrorStateCard message="Error" details="Connection timed out" />);
    expect(screen.getByText("Connection timed out")).toBeInTheDocument();
  });

  it("does not render details when not provided", () => {
    render(<ErrorStateCard message="Error" />);
    expect(screen.queryByText("Connection timed out")).not.toBeInTheDocument();
  });

  it("renders retry button when onRetry is provided", () => {
    const onRetry = vi.fn();
    render(<ErrorStateCard message="Error" onRetry={onRetry} />);
    expect(screen.getByText("Retry")).toBeInTheDocument();
  });

  it("does not render retry button when onRetry is not provided", () => {
    render(<ErrorStateCard message="Error" />);
    expect(screen.queryByText("Retry")).not.toBeInTheDocument();
  });

  it("calls onRetry when retry button is clicked", async () => {
    const onRetry = vi.fn();
    render(<ErrorStateCard message="Error" onRetry={onRetry} />);

    await userEvent.click(screen.getByText("Retry"));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("disables retry button when isRetrying", () => {
    const onRetry = vi.fn();
    render(
      <ErrorStateCard message="Error" onRetry={onRetry} isRetrying={true} />
    );

    const button = screen.getByText("Retry").closest("button");
    expect(button).toBeDisabled();
  });
});
