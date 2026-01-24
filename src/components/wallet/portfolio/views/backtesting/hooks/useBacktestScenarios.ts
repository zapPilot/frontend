"use client";

import { useCallback, useState } from "react";
import { runBacktest } from "@/services/backtestingService";
import type {
  BacktestRequest,
  BacktestResponse,
} from "@/types/backtesting";

export interface Scenario {
  id: string;
  label: string;
  request: BacktestRequest;
}

export type RunStatus = "idle" | "running" | "done";

function nextScenarioId(): string {
  return `scenario_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export interface UseBacktestScenariosReturn {
  scenarios: Scenario[];
  results: Map<string, BacktestResponse>;
  runStatus: RunStatus;
  addScenario: (request: BacktestRequest, label?: string) => void;
  removeScenario: (id: string) => void;
  updateScenario: (
    id: string,
    patch: Partial<Pick<Scenario, "label" | "request">>
  ) => void;
  clearResults: () => void;
  runAll: () => Promise<void>;
}

export function useBacktestScenarios(): UseBacktestScenariosReturn {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [results, setResults] = useState<Map<string, BacktestResponse>>(
    () => new Map()
  );
  const [runStatus, setRunStatus] = useState<RunStatus>("idle");

  const addScenario = useCallback(
    (request: BacktestRequest, label?: string) => {
      const id = nextScenarioId();
      const l =
        label ??
        `${request.token_symbol} ${request.days ?? "?"}d`;
      setScenarios(prev => [...prev, { id, label: l, request }]);
    },
    []
  );

  const removeScenario = useCallback((id: string) => {
    setScenarios(prev => prev.filter(s => s.id !== id));
    setResults(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const updateScenario = useCallback(
    (
      id: string,
      patch: Partial<Pick<Scenario, "label" | "request">>
    ) => {
      setScenarios(prev =>
        prev.map(s => (s.id === id ? { ...s, ...patch } : s))
      );
    },
    []
  );

  const clearResults = useCallback(() => {
    setResults(new Map());
    setRunStatus("idle");
  }, []);

  const runAll = useCallback(async () => {
    if (scenarios.length === 0) return;
    setRunStatus("running");
    const next = new Map<string, BacktestResponse>();

    for (const scenario of scenarios) {
      try {
        const response = await runBacktest(scenario.request);
        next.set(scenario.id, response);
      } catch {
        // Skip failed scenario; keep previous result if any
      }
    }

    setResults(next);
    setRunStatus("done");
  }, [scenarios]);

  return {
    scenarios,
    results,
    runStatus,
    addScenario,
    removeScenario,
    updateScenario,
    clearResults,
    runAll,
  };
}
