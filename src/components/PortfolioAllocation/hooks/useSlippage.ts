import { useState, useCallback, useMemo, useEffect } from "react";

export interface SlippagePreset {
  label: string;
  value: number;
  isDefault?: boolean;
  description?: string;
}

export interface SlippageWarning {
  type: "high" | "veryHigh" | "none";
  title: string;
  message: string;
  color: "yellow" | "red" | "none";
}

export interface UseSlippageOptions {
  initialValue?: number;
  presets?: SlippagePreset[];
  highSlippageThreshold?: number;
  veryHighSlippageThreshold?: number;
  minValue?: number;
  maxValue?: number;
  allowCustomInput?: boolean;
}

export interface UseSlippageReturn {
  // Current state
  value: number;
  customValue: string;
  isCustomValue: boolean;

  // Warning system
  warning: SlippageWarning;
  isHighSlippage: boolean;
  isVeryHighSlippage: boolean;

  // Actions
  setValue: (value: number) => void;
  setCustomValue: (value: string) => void;
  handlePresetClick: (presetValue: number) => void;
  handleCustomSubmit: () => boolean;
  handleCustomKeyPress: (e: React.KeyboardEvent) => void;

  // Validation
  isValidCustomValue: (value: string) => boolean;
  validateAndParseCustomValue: (value: string) => number | null;

  // Configuration
  presets: SlippagePreset[];

  // Formatting
  formatValue: (value: number) => string;
  getSlippageColor: (value: number) => string;
  getSlippageDescription: (value: number) => string;
}

const DEFAULT_PRESETS: SlippagePreset[] = [
  { label: "0.1%", value: 0.1 },
  { label: "0.5%", value: 0.5, isDefault: true },
  { label: "1%", value: 1.0 },
  { label: "3%", value: 3.0 },
];

export const useSlippage = (
  onChange: (value: number) => void,
  options: UseSlippageOptions = {}
): UseSlippageReturn => {
  const {
    initialValue = 0.5,
    presets = DEFAULT_PRESETS,
    highSlippageThreshold = 5,
    veryHighSlippageThreshold = 10,
    minValue = 0,
    maxValue = 50,
    allowCustomInput = true,
  } = options;

  const [value, setValue] = useState(initialValue);
  const [customValue, setCustomValue] = useState("");

  // Update internal value when initialValue changes (for external updates)
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  // Memoized computed values
  const isCustomValue = useMemo(
    () => !presets.some(preset => preset.value === value),
    [value, presets]
  );

  const isHighSlippage = useMemo(
    () => value > highSlippageThreshold,
    [value, highSlippageThreshold]
  );

  const isVeryHighSlippage = useMemo(
    () => value > veryHighSlippageThreshold,
    [value, veryHighSlippageThreshold]
  );

  const warning = useMemo((): SlippageWarning => {
    if (isVeryHighSlippage) {
      return {
        type: "veryHigh",
        title: "Very High Slippage",
        message:
          "Your transaction may be frontrun or result in significant losses",
        color: "red",
      };
    }
    if (isHighSlippage) {
      return {
        type: "high",
        title: "High Slippage",
        message: "You may receive less than expected due to price movement",
        color: "yellow",
      };
    }
    return {
      type: "none",
      title: "",
      message: "",
      color: "none",
    };
  }, [isHighSlippage, isVeryHighSlippage]);

  // Validation functions
  const isValidCustomValue = useCallback(
    (value: string): boolean => {
      const numValue = parseFloat(value);
      return !isNaN(numValue) && numValue >= minValue && numValue <= maxValue;
    },
    [minValue, maxValue]
  );

  const validateAndParseCustomValue = useCallback(
    (value: string): number | null => {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < minValue || numValue > maxValue) {
        return null;
      }
      return numValue;
    },
    [minValue, maxValue]
  );

  // Action handlers
  const handleSetValue = useCallback(
    (newValue: number) => {
      setValue(newValue);
      onChange(newValue);
      setCustomValue("");
    },
    [onChange]
  );

  const handlePresetClick = useCallback(
    (presetValue: number) => {
      handleSetValue(presetValue);
    },
    [handleSetValue]
  );

  const handleCustomSubmit = useCallback((): boolean => {
    if (!allowCustomInput) return false;

    const numValue = validateAndParseCustomValue(customValue);
    if (numValue !== null) {
      handleSetValue(numValue);
      return true;
    }
    return false;
  }, [
    customValue,
    validateAndParseCustomValue,
    handleSetValue,
    allowCustomInput,
  ]);

  const handleCustomKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleCustomSubmit();
      }
    },
    [handleCustomSubmit]
  );

  // Formatting functions
  const formatValue = useCallback((value: number): string => {
    return value.toFixed(value < 1 ? 1 : 0);
  }, []);

  const getSlippageColor = useCallback((value: number): string => {
    if (value <= 5) return "text-green-400";
    if (value <= 15) return "text-yellow-400";
    return "text-red-400";
  }, []);

  const getSlippageDescription = useCallback((value: number): string => {
    if (value <= 5) return "Conservative";
    if (value <= 15) return "Moderate";
    return "Aggressive";
  }, []);

  return {
    // Current state
    value,
    customValue,
    isCustomValue,

    // Warning system
    warning,
    isHighSlippage,
    isVeryHighSlippage,

    // Actions
    setValue: handleSetValue,
    setCustomValue,
    handlePresetClick,
    handleCustomSubmit,
    handleCustomKeyPress,

    // Validation
    isValidCustomValue,
    validateAndParseCustomValue,

    // Configuration
    presets,

    // Formatting
    formatValue,
    getSlippageColor,
    getSlippageDescription,
  };
};
