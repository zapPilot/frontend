import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AsyncActionButton } from "../../../../src/components/ui/AsyncActionButton";

describe("AsyncActionButton", () => {
  describe("Snapshot Tests - UI Design Freeze", () => {
    it("should match snapshot in normal state", () => {
      const { container } = render(
        <AsyncActionButton onAction={async () => undefined}>
          Submit
        </AsyncActionButton>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it("should match snapshot in loading state", () => {
      const { container } = render(
        <AsyncActionButton onAction={async () => undefined} isLoading>
          Submit
        </AsyncActionButton>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe("Behavior Tests", () => {
    it("should render children correctly", () => {
      render(
        <AsyncActionButton onAction={async () => undefined}>
          Click Me
        </AsyncActionButton>
      );
      expect(screen.getByText("Click Me")).toBeInTheDocument();
    });

    it("should show 'Loading...' when isLoading is true", () => {
      render(
        <AsyncActionButton onAction={async () => undefined} isLoading>
          Submit
        </AsyncActionButton>
      );
      expect(screen.getByText("Loading...")).toBeInTheDocument();
      expect(screen.queryByText("Submit")).not.toBeInTheDocument();
    });

    it("should call onAction when clicked", async () => {
      const mockAction = vi.fn().mockResolvedValue(undefined);
      render(
        <AsyncActionButton onAction={mockAction}>Click Me</AsyncActionButton>
      );

      fireEvent.click(screen.getByText("Click Me"));

      await waitFor(() => {
        expect(mockAction).toHaveBeenCalledTimes(1);
      });
    });

    it("should be disabled when isLoading is true", () => {
      render(
        <AsyncActionButton onAction={async () => undefined} isLoading>
          Submit
        </AsyncActionButton>
      );
      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("should be disabled when disabled prop is true", () => {
      render(
        <AsyncActionButton onAction={async () => undefined} disabled>
          Submit
        </AsyncActionButton>
      );
      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("should apply custom className", () => {
      render(
        <AsyncActionButton
          onAction={async () => undefined}
          className="custom-btn"
        >
          Submit
        </AsyncActionButton>
      );
      expect(screen.getByRole("button")).toHaveClass("custom-btn");
    });

    it("should pass through other button attributes", () => {
      render(
        <AsyncActionButton
          onAction={async () => undefined}
          type="submit"
          data-testid="async-btn"
        >
          Submit
        </AsyncActionButton>
      );
      const button = screen.getByTestId("async-btn");
      expect(button).toHaveAttribute("type", "submit");
    });
  });
});
