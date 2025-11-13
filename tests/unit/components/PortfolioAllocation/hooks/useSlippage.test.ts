import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useSlippage } from "@/components/PortfolioAllocation/hooks/useSlippage";
import { SLIPPAGE_CONFIG } from "@/constants/slippage";

describe("useSlippage", () => {
  let mockOnChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnChange = vi.fn();
    vi.clearAllMocks();
  });

  describe("Initialization", () => {
    it("should initialize with default value", () => {
      const { result } = renderHook(() => useSlippage(mockOnChange));

      expect(result.current.value).toBe(SLIPPAGE_CONFIG.DEFAULT);
      expect(result.current.customValue).toBe("");
      expect(result.current.isCustomValue).toBe(false);
    });

    it("should initialize with custom initial value", () => {
      const initialValue = 2.0;

      const { result } = renderHook(() =>
        useSlippage(mockOnChange, { initialValue })
      );

      expect(result.current.value).toBe(initialValue);
    });

    it("should initialize with default presets", () => {
      const { result } = renderHook(() => useSlippage(mockOnChange));

      expect(result.current.presets).toHaveLength(4);
      expect(result.current.presets[0].value).toBe(SLIPPAGE_CONFIG.PRESETS.LOW);
      expect(result.current.presets[1].value).toBe(
        SLIPPAGE_CONFIG.PRESETS.MEDIUM
      );
    });

    it("should initialize with custom presets", () => {
      const customPresets = [
        { label: "Custom 1%", value: 1.0 },
        { label: "Custom 2%", value: 2.0 },
      ];

      const { result } = renderHook(() =>
        useSlippage(mockOnChange, { presets: customPresets })
      );

      expect(result.current.presets).toEqual(customPresets);
    });
  });

  describe("Warning System", () => {
    it("should show no warning for low slippage", () => {
      const { result } = renderHook(() =>
        useSlippage(mockOnChange, { initialValue: 0.5 })
      );

      expect(result.current.warning.type).toBe("none");
      expect(result.current.isHighSlippage).toBe(false);
      expect(result.current.isVeryHighSlippage).toBe(false);
    });

    it("should show high slippage warning", () => {
      const { result } = renderHook(() =>
        useSlippage(mockOnChange, { initialValue: 7.0 })
      );

      expect(result.current.warning.type).toBe("high");
      expect(result.current.warning.title).toBe("High Slippage");
      expect(result.current.warning.color).toBe("yellow");
      expect(result.current.isHighSlippage).toBe(true);
      expect(result.current.isVeryHighSlippage).toBe(false);
    });

    it("should show very high slippage warning", () => {
      const { result } = renderHook(() =>
        useSlippage(mockOnChange, { initialValue: 15.0 })
      );

      expect(result.current.warning.type).toBe("veryHigh");
      expect(result.current.warning.title).toBe("Very High Slippage");
      expect(result.current.warning.color).toBe("red");
      expect(result.current.isHighSlippage).toBe(true);
      expect(result.current.isVeryHighSlippage).toBe(true);
    });

    it("should use custom high slippage threshold", () => {
      const { result } = renderHook(() =>
        useSlippage(mockOnChange, {
          initialValue: 3.0,
          highSlippageThreshold: 2.5,
        })
      );

      expect(result.current.isHighSlippage).toBe(true);
    });

    it("should use custom very high slippage threshold", () => {
      const { result } = renderHook(() =>
        useSlippage(mockOnChange, {
          initialValue: 8.0,
          veryHighSlippageThreshold: 7.0,
        })
      );

      expect(result.current.isVeryHighSlippage).toBe(true);
    });

    it("should update warning when value changes", () => {
      const { result } = renderHook(() => useSlippage(mockOnChange));

      expect(result.current.warning.type).toBe("none");

      act(() => {
        result.current.setValue(8.0);
      });

      expect(result.current.warning.type).toBe("high");
    });
  });

  describe("setValue Action", () => {
    it("should update value when setValue is called", () => {
      const { result } = renderHook(() => useSlippage(mockOnChange));

      act(() => {
        result.current.setValue(1.0);
      });

      expect(result.current.value).toBe(1.0);
    });

    it("should call onChange callback with new value", () => {
      const { result } = renderHook(() => useSlippage(mockOnChange));

      act(() => {
        result.current.setValue(2.5);
      });

      expect(mockOnChange).toHaveBeenCalledWith(2.5);
      expect(mockOnChange).toHaveBeenCalledTimes(1);
    });

    it("should clear custom value when setValue is called", () => {
      const { result } = renderHook(() => useSlippage(mockOnChange));

      act(() => {
        result.current.setCustomValue("3.5");
      });

      expect(result.current.customValue).toBe("3.5");

      act(() => {
        result.current.setValue(1.0);
      });

      expect(result.current.customValue).toBe("");
    });

    it("should update isCustomValue flag appropriately", () => {
      const { result } = renderHook(() => useSlippage(mockOnChange));

      // Set to preset value
      act(() => {
        result.current.setValue(SLIPPAGE_CONFIG.PRESETS.MEDIUM);
      });

      expect(result.current.isCustomValue).toBe(false);

      // Set to non-preset value
      act(() => {
        result.current.setValue(2.5);
      });

      expect(result.current.isCustomValue).toBe(true);
    });
  });

  describe("Custom Value Input", () => {
    it("should update customValue state", () => {
      const { result } = renderHook(() => useSlippage(mockOnChange));

      act(() => {
        result.current.setCustomValue("3.5");
      });

      expect(result.current.customValue).toBe("3.5");
    });

    it("should validate valid custom value", () => {
      const { result } = renderHook(() => useSlippage(mockOnChange));

      expect(result.current.isValidCustomValue("2.5")).toBe(true);
      expect(result.current.isValidCustomValue("0.1")).toBe(true);
      expect(result.current.isValidCustomValue("50")).toBe(true);
    });

    it("should invalidate values outside range", () => {
      const { result } = renderHook(() => useSlippage(mockOnChange));

      expect(result.current.isValidCustomValue("-1")).toBe(false);
      expect(result.current.isValidCustomValue("51")).toBe(false);
    });

    it("should invalidate non-numeric values", () => {
      const { result } = renderHook(() => useSlippage(mockOnChange));

      expect(result.current.isValidCustomValue("abc")).toBe(false);
      expect(result.current.isValidCustomValue("")).toBe(false);
    });

    it("should use custom min/max values for validation", () => {
      const { result } = renderHook(() =>
        useSlippage(mockOnChange, { minValue: 1, maxValue: 10 })
      );

      expect(result.current.isValidCustomValue("0.5")).toBe(false);
      expect(result.current.isValidCustomValue("1.0")).toBe(true);
      expect(result.current.isValidCustomValue("10.0")).toBe(true);
      expect(result.current.isValidCustomValue("11.0")).toBe(false);
    });

    it("should validate and parse custom value successfully", () => {
      const { result } = renderHook(() => useSlippage(mockOnChange));

      const parsed = result.current.validateAndParseCustomValue("3.5");
      expect(parsed).toBe(3.5);
    });

    it("should return null for invalid custom value", () => {
      const { result } = renderHook(() => useSlippage(mockOnChange));

      expect(result.current.validateAndParseCustomValue("abc")).toBeNull();
      expect(result.current.validateAndParseCustomValue("100")).toBeNull();
    });
  });

  describe("Custom Value Submission", () => {
    it("should submit valid custom value successfully", () => {
      const { result } = renderHook(() => useSlippage(mockOnChange));

      act(() => {
        result.current.setCustomValue("3.5");
      });

      let submitResult = false;
      act(() => {
        submitResult = result.current.handleCustomSubmit();
      });

      expect(submitResult).toBe(true);
      expect(result.current.value).toBe(3.5);
      expect(mockOnChange).toHaveBeenCalledWith(3.5);
    });

    it("should reject invalid custom value", () => {
      const { result } = renderHook(() => useSlippage(mockOnChange));

      act(() => {
        result.current.setCustomValue("invalid");
      });

      let submitResult = true;
      act(() => {
        submitResult = result.current.handleCustomSubmit();
      });

      expect(submitResult).toBe(false);
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it("should clear custom value after successful submission", () => {
      const { result } = renderHook(() => useSlippage(mockOnChange));

      act(() => {
        result.current.setCustomValue("2.5");
      });

      act(() => {
        result.current.handleCustomSubmit();
      });

      expect(result.current.customValue).toBe("");
    });

    it("should reject submission when custom input is disabled", () => {
      const { result } = renderHook(() =>
        useSlippage(mockOnChange, { allowCustomInput: false })
      );

      act(() => {
        result.current.setCustomValue("3.5");
      });

      let submitResult = true;
      act(() => {
        submitResult = result.current.handleCustomSubmit();
      });

      expect(submitResult).toBe(false);
    });

    it("should handle Enter key press for submission", () => {
      const { result } = renderHook(() => useSlippage(mockOnChange));

      act(() => {
        result.current.setCustomValue("2.5");
      });

      act(() => {
        result.current.handleCustomKeyPress({
          key: "Enter",
        } as React.KeyboardEvent);
      });

      expect(result.current.value).toBe(2.5);
      expect(mockOnChange).toHaveBeenCalledWith(2.5);
    });

    it("should ignore non-Enter key presses", () => {
      const { result } = renderHook(() => useSlippage(mockOnChange));

      act(() => {
        result.current.setCustomValue("2.5");
      });

      act(() => {
        result.current.handleCustomKeyPress({
          key: "Tab",
        } as React.KeyboardEvent);
      });

      expect(result.current.value).toBe(SLIPPAGE_CONFIG.DEFAULT);
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe("Preset Selection", () => {
    it("should set value to preset when clicked", () => {
      const { result } = renderHook(() => useSlippage(mockOnChange));

      act(() => {
        result.current.handlePresetClick(1.0);
      });

      expect(result.current.value).toBe(1.0);
      expect(mockOnChange).toHaveBeenCalledWith(1.0);
    });

    it("should clear custom value when preset is clicked", () => {
      const { result } = renderHook(() => useSlippage(mockOnChange));

      act(() => {
        result.current.setCustomValue("3.5");
        result.current.handlePresetClick(0.5);
      });

      expect(result.current.customValue).toBe("");
    });

    it("should update isCustomValue flag when preset is clicked", () => {
      const { result } = renderHook(() => useSlippage(mockOnChange));

      act(() => {
        result.current.setValue(2.5); // Custom value
      });

      expect(result.current.isCustomValue).toBe(true);

      act(() => {
        result.current.handlePresetClick(SLIPPAGE_CONFIG.PRESETS.MEDIUM);
      });

      expect(result.current.isCustomValue).toBe(false);
    });
  });

  describe("Formatting Functions", () => {
    it("should format values less than 1 with one decimal", () => {
      const { result } = renderHook(() => useSlippage(mockOnChange));

      expect(result.current.formatValue(0.5)).toBe("0.5");
      expect(result.current.formatValue(0.1)).toBe("0.1");
    });

    it("should format values greater than or equal to 1 with no decimals", () => {
      const { result } = renderHook(() => useSlippage(mockOnChange));

      expect(result.current.formatValue(1.0)).toBe("1");
      expect(result.current.formatValue(5.0)).toBe("5");
      expect(result.current.formatValue(10.5)).toBe("11");
    });

    it("should return correct slippage color for low values", () => {
      const { result } = renderHook(() => useSlippage(mockOnChange));

      expect(result.current.getSlippageColor(0.5)).toBe("text-green-400");
      expect(result.current.getSlippageColor(5.0)).toBe("text-green-400");
    });

    it("should return correct slippage color for medium values", () => {
      const { result } = renderHook(() => useSlippage(mockOnChange));

      expect(result.current.getSlippageColor(6.0)).toBe("text-yellow-400");
      expect(result.current.getSlippageColor(15.0)).toBe("text-yellow-400");
    });

    it("should return correct slippage color for high values", () => {
      const { result } = renderHook(() => useSlippage(mockOnChange));

      expect(result.current.getSlippageColor(16.0)).toBe("text-red-400");
      expect(result.current.getSlippageColor(50.0)).toBe("text-red-400");
    });

    it("should return correct slippage description for low values", () => {
      const { result } = renderHook(() => useSlippage(mockOnChange));

      expect(result.current.getSlippageDescription(0.5)).toBe("Conservative");
      expect(result.current.getSlippageDescription(5.0)).toBe("Conservative");
    });

    it("should return correct slippage description for medium values", () => {
      const { result } = renderHook(() => useSlippage(mockOnChange));

      expect(result.current.getSlippageDescription(6.0)).toBe("Moderate");
      expect(result.current.getSlippageDescription(15.0)).toBe("Moderate");
    });

    it("should return correct slippage description for high values", () => {
      const { result } = renderHook(() => useSlippage(mockOnChange));

      expect(result.current.getSlippageDescription(16.0)).toBe("Aggressive");
      expect(result.current.getSlippageDescription(50.0)).toBe("Aggressive");
    });
  });

  describe("External Value Updates", () => {
    it("should update value when initialValue prop changes", () => {
      const { result, rerender } = renderHook(
        ({ initialValue }) => useSlippage(mockOnChange, { initialValue }),
        {
          initialProps: { initialValue: 0.5 },
        }
      );

      expect(result.current.value).toBe(0.5);

      rerender({ initialValue: 2.0 });

      expect(result.current.value).toBe(2.0);
    });

    it("should trigger warning update when external value changes", () => {
      const { result, rerender } = renderHook(
        ({ initialValue }) => useSlippage(mockOnChange, { initialValue }),
        {
          initialProps: { initialValue: 0.5 },
        }
      );

      expect(result.current.warning.type).toBe("none");

      rerender({ initialValue: 8.0 });

      expect(result.current.warning.type).toBe("high");
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero value", () => {
      const { result } = renderHook(() =>
        useSlippage(mockOnChange, { initialValue: 0 })
      );

      expect(result.current.value).toBe(0);
      expect(result.current.warning.type).toBe("none");
    });

    it("should handle maximum value", () => {
      const { result } = renderHook(() =>
        useSlippage(mockOnChange, { initialValue: SLIPPAGE_CONFIG.MAX })
      );

      expect(result.current.value).toBe(SLIPPAGE_CONFIG.MAX);
    });

    it("should handle very small decimal values", () => {
      const { result } = renderHook(() => useSlippage(mockOnChange));

      act(() => {
        result.current.setCustomValue("0.01");
      });

      act(() => {
        result.current.handleCustomSubmit();
      });

      expect(result.current.value).toBe(0.01);
    });

    it("should handle boundary values for validation", () => {
      const { result } = renderHook(() => useSlippage(mockOnChange));

      expect(result.current.isValidCustomValue("0")).toBe(true);
      expect(result.current.isValidCustomValue("50")).toBe(true);
    });

    it("should handle empty string in custom value", () => {
      const { result } = renderHook(() => useSlippage(mockOnChange));

      expect(result.current.isValidCustomValue("")).toBe(false);
    });

    it("should handle whitespace in custom value", () => {
      const { result } = renderHook(() => useSlippage(mockOnChange));

      expect(result.current.isValidCustomValue("  ")).toBe(false);
    });
  });

  describe("Multiple Interactions", () => {
    it("should handle multiple preset changes", () => {
      const { result } = renderHook(() => useSlippage(mockOnChange));

      act(() => {
        result.current.handlePresetClick(0.1);
      });
      expect(result.current.value).toBe(0.1);

      act(() => {
        result.current.handlePresetClick(1.0);
      });
      expect(result.current.value).toBe(1.0);

      act(() => {
        result.current.handlePresetClick(3.0);
      });
      expect(result.current.value).toBe(3.0);

      expect(mockOnChange).toHaveBeenCalledTimes(3);
    });

    it("should handle switching between preset and custom values", () => {
      const { result } = renderHook(() => useSlippage(mockOnChange));

      act(() => {
        result.current.handlePresetClick(0.5);
      });
      expect(result.current.isCustomValue).toBe(false);

      act(() => {
        result.current.setCustomValue("2.5");
      });

      act(() => {
        result.current.handleCustomSubmit();
      });
      expect(result.current.isCustomValue).toBe(true);

      act(() => {
        result.current.handlePresetClick(1.0);
      });
      expect(result.current.isCustomValue).toBe(false);
    });

    it("should handle rapid custom value changes", () => {
      const { result } = renderHook(() => useSlippage(mockOnChange));

      act(() => {
        result.current.setCustomValue("1");
      });
      act(() => {
        result.current.setCustomValue("1.5");
      });
      act(() => {
        result.current.setCustomValue("2");
      });

      expect(result.current.customValue).toBe("2");

      act(() => {
        result.current.handleCustomSubmit();
      });

      expect(result.current.value).toBe(2);
    });
  });

  describe("Real-World Scenarios", () => {
    it("should handle typical user flow: preset -> custom -> preset", () => {
      const { result } = renderHook(() => useSlippage(mockOnChange));

      // Start with preset
      act(() => {
        result.current.handlePresetClick(0.5);
      });
      expect(result.current.value).toBe(0.5);
      expect(result.current.isCustomValue).toBe(false);

      // Switch to custom
      act(() => {
        result.current.setCustomValue("2.5");
      });

      act(() => {
        result.current.handleCustomSubmit();
      });
      expect(result.current.value).toBe(2.5);
      expect(result.current.isCustomValue).toBe(true);
      expect(result.current.warning.type).toBe("none");

      // Back to preset
      act(() => {
        result.current.handlePresetClick(1.0);
      });
      expect(result.current.value).toBe(1.0);
      expect(result.current.isCustomValue).toBe(false);
    });

    it("should handle high slippage warning flow", () => {
      const { result } = renderHook(() => useSlippage(mockOnChange));

      // Low slippage - no warning
      act(() => {
        result.current.setValue(0.5);
      });
      expect(result.current.warning.type).toBe("none");

      // High slippage - yellow warning
      act(() => {
        result.current.setValue(7.0);
      });
      expect(result.current.warning.type).toBe("high");
      expect(result.current.warning.color).toBe("yellow");

      // Very high slippage - red warning
      act(() => {
        result.current.setValue(15.0);
      });
      expect(result.current.warning.type).toBe("veryHigh");
      expect(result.current.warning.color).toBe("red");
    });

    it("should handle invalid custom input gracefully", () => {
      const { result } = renderHook(() => useSlippage(mockOnChange));

      const initialValue = result.current.value;

      act(() => {
        result.current.setCustomValue("invalid");
        result.current.handleCustomSubmit();
      });

      // Value should remain unchanged
      expect(result.current.value).toBe(initialValue);
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it("should handle boundary custom values correctly", () => {
      const { result } = renderHook(() => useSlippage(mockOnChange));

      // Minimum value
      act(() => {
        result.current.setCustomValue("0");
      });

      act(() => {
        result.current.handleCustomSubmit();
      });
      expect(result.current.value).toBe(0);

      // Maximum value
      act(() => {
        result.current.setCustomValue("50");
      });

      act(() => {
        result.current.handleCustomSubmit();
      });
      expect(result.current.value).toBe(50);
    });
  });

  describe("Callback Consistency", () => {
    it("should maintain stable function references across renders", () => {
      const { result, rerender } = renderHook(() => useSlippage(mockOnChange));

      const initialFunctions = {
        setValue: result.current.setValue,
        setCustomValue: result.current.setCustomValue,
        handlePresetClick: result.current.handlePresetClick,
        handleCustomSubmit: result.current.handleCustomSubmit,
        formatValue: result.current.formatValue,
      };

      rerender();

      expect(result.current.setValue).toBe(initialFunctions.setValue);
      expect(result.current.setCustomValue).toBe(
        initialFunctions.setCustomValue
      );
      expect(result.current.handlePresetClick).toBe(
        initialFunctions.handlePresetClick
      );
      expect(result.current.handleCustomSubmit).toBe(
        initialFunctions.handleCustomSubmit
      );
      expect(result.current.formatValue).toBe(initialFunctions.formatValue);
    });
  });
});
