/**
 * Unit tests for modalHelpers
 */
import { describe, expect, it, vi } from "vitest";

import {
  applyPercentageToAmount,
  buildFormActionsProps,
} from "@/components/wallet/portfolio/modals/utils/modalHelpers";

describe("modalHelpers", () => {
  describe("applyPercentageToAmount", () => {
    it("should set amount to percentage of maxAmount", () => {
      const mockSetValue = vi.fn();
      const mockForm = {
        setValue: mockSetValue,
      } as any;

      applyPercentageToAmount(mockForm, 0.5, 100);

      expect(mockSetValue).toHaveBeenCalledWith("amount", "50.0000", {
        shouldValidate: true,
      });
    });

    it("should handle 100% correctly", () => {
      const mockSetValue = vi.fn();
      const mockForm = { setValue: mockSetValue } as any;

      applyPercentageToAmount(mockForm, 1, 500);

      expect(mockSetValue).toHaveBeenCalledWith("amount", "500.0000", {
        shouldValidate: true,
      });
    });

    it("should handle 25% correctly", () => {
      const mockSetValue = vi.fn();
      const mockForm = { setValue: mockSetValue } as any;

      applyPercentageToAmount(mockForm, 0.25, 200);

      expect(mockSetValue).toHaveBeenCalledWith("amount", "50.0000", {
        shouldValidate: true,
      });
    });

    it("should not set value when maxAmount is 0", () => {
      const mockSetValue = vi.fn();
      const mockForm = { setValue: mockSetValue } as any;

      applyPercentageToAmount(mockForm, 0.5, 0);

      expect(mockSetValue).not.toHaveBeenCalled();
    });

    it("should not set value when maxAmount is negative", () => {
      const mockSetValue = vi.fn();
      const mockForm = { setValue: mockSetValue } as any;

      applyPercentageToAmount(mockForm, 0.5, -100);

      expect(mockSetValue).not.toHaveBeenCalled();
    });
  });

  describe("buildFormActionsProps", () => {
    it("should build props object with all required fields", () => {
      const mockForm = { control: {} } as any;
      const mockOnQuickSelect = vi.fn();
      const mockOnAction = vi.fn();

      const result = buildFormActionsProps(
        mockForm,
        "100",
        50.5,
        mockOnQuickSelect,
        "Deposit",
        false,
        "bg-gradient-btn",
        mockOnAction
      );

      expect(result).toEqual({
        form: mockForm,
        amount: "100",
        usdPrice: 50.5,
        onQuickSelect: mockOnQuickSelect,
        actionLabel: "Deposit",
        actionDisabled: false,
        actionGradient: "bg-gradient-btn",
        onAction: mockOnAction,
      });
    });

    it("should include amountClassName when provided", () => {
      const mockForm = { control: {} } as any;
      const mockOnQuickSelect = vi.fn();
      const mockOnAction = vi.fn();

      const result = buildFormActionsProps(
        mockForm,
        "50",
        25,
        mockOnQuickSelect,
        "Withdraw",
        true,
        "bg-red",
        mockOnAction,
        "custom-class"
      );

      expect(result.amountClassName).toBe("custom-class");
    });

    it("should not include amountClassName when not provided", () => {
      const mockForm = { control: {} } as any;
      const mockOnQuickSelect = vi.fn();
      const mockOnAction = vi.fn();

      const result = buildFormActionsProps(
        mockForm,
        "0",
        undefined,
        mockOnQuickSelect,
        "Submit",
        false,
        "bg-blue",
        mockOnAction
      );

      expect("amountClassName" in result).toBe(false);
    });

    it("should handle undefined usdPrice", () => {
      const mockForm = { control: {} } as any;
      const mockOnQuickSelect = vi.fn();
      const mockOnAction = vi.fn();

      const result = buildFormActionsProps(
        mockForm,
        "100",
        undefined,
        mockOnQuickSelect,
        "Action",
        false,
        "gradient",
        mockOnAction
      );

      expect(result.usdPrice).toBeUndefined();
    });
  });
});
