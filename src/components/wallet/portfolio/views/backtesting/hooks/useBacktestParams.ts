"use client";

import type { AllocationConfig, BacktestRequest } from "@/types/backtesting";
import { useCallback, useState } from "react";

import { DEFAULT_REQUEST } from "../constants";

export interface UseBacktestParamsReturn {
  params: BacktestRequest;
  updateParam: <K extends keyof BacktestRequest>(
    key: K,
    value: BacktestRequest[K]
  ) => void;
  resetParams: () => void;
  toggleAllocationConfig: (config: AllocationConfig) => void;
  showCustomBuilder: boolean;
  setShowCustomBuilder: (show: boolean) => void;
}

export function useBacktestParams(): UseBacktestParamsReturn {
  const [params, setParams] = useState<BacktestRequest>(DEFAULT_REQUEST);
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);

  const updateParam = useCallback(
    <K extends keyof BacktestRequest>(
      key: K,
      value: BacktestRequest[K]
    ) => {
      setParams(prev => ({ ...prev, [key]: value }));
    },
    []
  );

  const resetParams = useCallback(() => {
    setParams(DEFAULT_REQUEST);
  }, []);

  const toggleAllocationConfig = useCallback((config: AllocationConfig) => {
    setParams(prev => {
      const current = prev.allocation_configs ?? [];
      const exists = current.some(c => c.id === config.id);
      const updated = exists
        ? current.filter(c => c.id !== config.id)
        : [...current, config];
      const { allocation_configs: _ac, ...rest } = prev;
      return updated.length > 0
        ? ({ ...rest, allocation_configs: updated } as BacktestRequest)
        : (rest as BacktestRequest);
    });
  }, []);

  return {
    params,
    updateParam,
    resetParams,
    toggleAllocationConfig,
    showCustomBuilder,
    setShowCustomBuilder,
  };
}
