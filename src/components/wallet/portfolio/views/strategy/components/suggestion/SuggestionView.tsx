"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { useMemo } from "react";

import { BaseCard } from "@/components/ui/BaseCard";
import { EmptyStateCard } from "@/components/ui/EmptyStateCard";
import { ErrorStateCard } from "@/components/ui/ErrorStateCard";
import { Spinner } from "@/components/ui/LoadingSystem";
import { useEmailSubscription } from "@/components/WalletManager/hooks/useEmailSubscription";

import { useDailySuggestion } from "../../hooks/useDailySuggestion";
import { useStrategyConfigs } from "../../hooks/useStrategyConfigs";
import { AllocationComparison } from "./AllocationComparison";
import { NotificationChannels } from "./NotificationChannels";
import { RegimeIndicator } from "./RegimeIndicator";
import { TradeSuggestionsCard } from "./TradeSuggestionsCard";

interface SuggestionViewProps {
  userId: string | undefined;
}

export function SuggestionView({ userId }: SuggestionViewProps) {
  const { data: configsResponse } = useStrategyConfigs(!!userId);
  const emailSubscription = useEmailSubscription({
    realUserId: userId || "",
    viewingUserId: userId || "",
    isOpen: true,
    onEmailSubscribed: undefined,
  });

  // We automatically select the "simple_regime" strategy as the default
  // No UI selector needed as per requirements
  const defaultPresetId = useMemo(() => {
    const presets = configsResponse?.presets ?? [];
    const regimePreset = presets.find(p => p.strategy_id === "simple_regime");
    return regimePreset?.config_id ?? presets[0]?.config_id;
  }, [configsResponse]);

  // Use the default preset ID for fetching suggestions
  const suggestionParams = defaultPresetId
    ? { config_id: defaultPresetId }
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-96">
        <BaseCard
          variant="glass"
          className="col-span-1 md:col-span-2 flex flex-col items-center justify-center"
        >
          <Spinner size="lg" color="primary" className="mb-4" />
          <p className="text-gray-400 font-medium">
            Analyzing market regime...
          </p>
        </BaseCard>
      </div>
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
      {/* Header Section */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Today&apos;s Strategy
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-gray-400">
              Analysis based on {data.total_portfolio_history_days}-day history
            </span>
            {isRefetching && (
              <span className="text-xs text-blue-400 animate-pulse font-medium">
                Updating...
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="p-2.5 rounded-lg bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700 transition-all disabled:opacity-50 ring-1 ring-white/5"
          title="Refresh analysis"
        >
          <RefreshCw
            className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Context (Regime) - 4 cols */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 h-full flex flex-col">
            <RegimeIndicator regime={data.regime} />
          </div>
        </div>

        {/* Right Column: Action (Trades) - 8 cols */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 h-full">
            <TradeSuggestionsCard
              trades={data.trade_suggestions ?? []}
              pacing={data.pacing ?? null}
              patternReason={data.pattern_reason}
            />
          </div>
        </div>

        {/* Bottom Row: Allocation Detail - Full Width */}
        <div className="lg:col-span-12">
          <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-2xl p-8">
            <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-6">
              Allocation Targets
            </div>
            <AllocationComparison
              current={data.current_allocation}
              target={data.target_allocation}
              targetName={data.target_name}
            />
          </div>
        </div>

        {/* Notifications - Full Width */}
        <div className="lg:col-span-12">
          <NotificationChannels
            emailSubscriptionProps={{
              email: emailSubscription.email,
              subscribedEmail: emailSubscription.subscribedEmail,
              isEditingSubscription: emailSubscription.isEditingSubscription,
              subscriptionOperation: {
                isLoading: emailSubscription.subscriptionOperation.isLoading,
                error: emailSubscription.subscriptionOperation.error
                  ? new Error(emailSubscription.subscriptionOperation.error)
                  : null,
              },
              onEmailChange: e => emailSubscription.setEmail(e.target.value),
              onSubscribe: emailSubscription.handleSubscribe,
              onUnsubscribe: emailSubscription.handleUnsubscribe,
              onStartEditing: emailSubscription.startEditingSubscription,
              onCancelEditing: emailSubscription.cancelEditingSubscription,
            }}
          />
        </div>
      </div>
    </div>
  );
}
