import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  SubmittingState,
  TransactionActionButton,
  TransactionFormActionsWithForm,
  TransactionModalHeader,
} from "@/components/wallet/portfolio/modals/components/TransactionModalParts";

// Mock GradientButton
vi.mock("@/components/ui/GradientButton", () => ({
  GradientButton: ({ children, onClick, disabled, className }: any) => (
    <button onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  ),
}));

// Mock IntentVisualizer using absolute path to be safe
vi.mock(
  "@/components/wallet/portfolio/modals/visualizers/IntentVisualizer",
  () => ({
    IntentVisualizer: () => (
      <div data-testid="intent-visualizer">Visualizer</div>
    ),
  })
);

describe("TransactionModalParts", () => {
  describe("TransactionModalHeader", () => {
    it("renders title and close button", () => {
      const onClose = vi.fn();
      render(
        <TransactionModalHeader
          title="Test Title"
          indicatorClassName="bg-red-500"
          isSubmitting={false}
          onClose={onClose}
        />
      );

      expect(screen.getByText("Test Title")).toBeInTheDocument();
      const closeBtn = screen.getByLabelText("Close");
      expect(closeBtn).toBeInTheDocument();
      fireEvent.click(closeBtn);
      expect(onClose).toHaveBeenCalled();
    });

    it("hides close button when submitting", () => {
      render(
        <TransactionModalHeader
          title="Test"
          indicatorClassName="bg-red"
          isSubmitting={true}
          onClose={vi.fn()}
        />
      );
      expect(screen.queryByLabelText("Close")).not.toBeInTheDocument();
    });
  });

  describe("SubmittingState", () => {
    it("renders visualizer always", () => {
      render(<SubmittingState isSuccess={false} />);
      expect(screen.getByTestId("intent-visualizer")).toBeInTheDocument();
    });

    it("renders success banner when success", () => {
      render(
        <SubmittingState
          isSuccess={true}
          successMessage="Success!"
          successTone="green"
        />
      );
      expect(screen.getByText("Success!")).toBeInTheDocument();
    });
  });

  describe("TransactionActionButton", () => {
    it("renders label and handles click", () => {
      const onClick = vi.fn();
      render(
        <TransactionActionButton
          gradient="bg-blue"
          disabled={false}
          label="Go"
          onClick={onClick}
        />
      );

      const btn = screen.getByText("Go");
      fireEvent.click(btn);
      expect(onClick).toHaveBeenCalled();
    });
  });

  describe("TransactionFormActionsWithForm", () => {
    it("renders amount input and quick pills and handles interaction", () => {
      const mockSetValue = vi.fn();
      const mockForm = {
        setValue: mockSetValue,
      } as any;

      const onQuickSelect = vi.fn();
      const onAction = vi.fn();

      render(
        <TransactionFormActionsWithForm
          form={mockForm}
          amount="10"
          onQuickSelect={onQuickSelect}
          onAction={onAction}
          actionLabel="Submit"
          actionDisabled={false}
          actionGradient="bg-test"
          usdPrice={2}
        />
      );

      // Check amount value
      const input = screen.getByDisplayValue("10");
      expect(input).toBeInTheDocument();

      // Check pills
      expect(screen.getByText("25%")).toBeInTheDocument();

      // Interaction: change amount
      fireEvent.change(input, { target: { value: "20" } });
      // Should call form.setValue("amount", "20", { shouldValidate: true })
      expect(mockSetValue).toHaveBeenCalledWith("amount", "20", {
        shouldValidate: true,
      });

      // Interaction: quick select
      fireEvent.click(screen.getByText("MAX"));
      expect(onQuickSelect).toHaveBeenCalledWith(1);

      // Interaction: action button
      fireEvent.click(screen.getByText("Submit"));
      expect(onAction).toHaveBeenCalled();
    });
  });
});
