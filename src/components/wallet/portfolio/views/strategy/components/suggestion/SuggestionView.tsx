"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";

import { BaseCard } from "@/components/ui/BaseCard";
import { EmptyStateCard } from "@/components/ui/EmptyStateCard";
import { ErrorStateCard } from "@/components/ui/ErrorStateCard";
import { Spinner } from "@/components/ui/LoadingSystem";

import { useDailySuggestion } from "../../hooks/useDailySuggestion";
import { useStrategyConfigs } from "../../hooks/useStrategyConfigs";
import { TelegramNotificationCard } from "../TelegramNotificationCard";
import { AllocationComparison } from "./AllocationComparison";
import { RegimeIndicator } from "./RegimeIndicator";
import { StrategyPresetSelector } from "./StrategyPresetSelector";
import { TradeSuggestionsCard } from "./TradeSuggestionsCard";

interface SuggestionViewProps {
  userId: string | undefined;
}

export function SuggestionView({ userId }: SuggestionViewProps) {
  const { data: configsResponse } = useStrategyConfigs(!!userId);

  const suggestionPresets = useMemo(
    () =>
      (configsResponse?.presets ?? []).filter(
        p => p.strategy_id === "simple_regime"
      ),
    [configsResponse]
  );

  const defaultPresetId = useMemo(
    () =>
      suggestionPresets.find(p => p.is_default)?.config_id ??
      suggestionPresets[0]?.config_id,
    [suggestionPresets]
  );

  // Undefined means "use backend default preset" (omit config_id query param).
  const [selectedConfigId, setSelectedConfigId] = useState<
    string | undefined
  >();

  const effectiveConfigId = selectedConfigId ?? defaultPresetId;
  const suggestionParams = selectedConfigId
    ? { config_id: selectedConfigId }
    : {};

  const { data, isLoading, error, refetch, isRefetching } = useDailySuggestion(
    userId,
    suggestionParams
  );

  if (!userId) {
    return (
      <EmptyStateCard
        icon={AlertCircle}
        message="Connect wallet to view suggestions"
      />
    );
  }

  if (isLoading) {
    return (
      <BaseCard variant="glass" className="p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <Spinner size="lg" color="primary" className="mb-3" />
          <p className="text-gray-400">Loading strategy suggestion...</p>
        </div>
      </BaseCard>
    );
  }

  if (error) {
    return (
      <ErrorStateCard
        message="Failed to load suggestion"
        details={error.message || "An unexpected error occurred"}
        onRetry={() => refetch()}
        isRetrying={isRefetching}
      />
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">
            Today&apos;s Suggestion
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Based on your {data.total_portfolio_history_days}-day portfolio
            history
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          title="Refresh suggestion"
        >
          <RefreshCw
            className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* Preset selector */}
      {effectiveConfigId && suggestionPresets.length > 0 ? (
        <BaseCard variant="glass" className="p-4">
          <StrategyPresetSelector
            presets={suggestionPresets}
            selectedConfigId={effectiveConfigId}
            onSelect={nextId => {
              if (defaultPresetId && nextId === defaultPresetId) {
                setSelectedConfigId(undefined);
              } else {
                setSelectedConfigId(nextId);
              }
            }}
          />
        </BaseCard>
      ) : null}

      {/* Regime indicator */}
      <BaseCard variant="glass" className="p-4">
        <RegimeIndicator regime={data.regime} />
      </BaseCard>
      {/* Trade suggestions with USD amounts (primary action card) */}
      <BaseCard variant="glass" className="p-6">
        <TradeSuggestionsCard
          trades={data.trade_suggestions ?? []}
          pacing={data.pacing ?? null}
          totalValue={data.total_value_usd}
        />
      </BaseCard>
      {/* Allocation comparison */}
      <BaseCard variant="glass" className="p-6">
        <AllocationComparison
          current={data.current_allocation}
          target={data.target_allocation}
          targetName={data.target_name}
        />
      </BaseCard>

      {/* Telegram notifications */}
      <TelegramNotificationCard userId={userId} />
    </div>
  );
}
