"use client";

import { AlertTriangle, ArrowLeft, Copy, Save } from "lucide-react";
import {
  type Dispatch,
  type ReactElement,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Spinner } from "@/components/ui";
import { STRATEGY_IDS } from "@/config/strategyFamilies";
import {
  useCreateStrategyConfig,
  useUpdateStrategyConfig,
} from "@/hooks/mutations/useStrategyAdminMutations";
import { useStrategyAdminConfig } from "@/hooks/queries/strategyAdmin";
import { useToast } from "@/providers/ToastProvider";
import type { SavedStrategyConfig, StrategyComposition } from "@/types";

interface ConfigEditorViewProps {
  configId: string | null;
  mode: "create" | "edit";
  duplicateFrom: SavedStrategyConfig | null;
  onCancel: () => void;
  onSaved: () => void;
  onDuplicate: (config: SavedStrategyConfig) => void;
}

const CONFIG_ID_PATTERN = /^[a-z0-9_]+$/;
const JSON_TABS = ["params", "composition"] as const;
type JsonTab = (typeof JSON_TABS)[number];
type ConfigEditorMode = ConfigEditorViewProps["mode"];

interface ParsedJsonResult<T> {
  parsed: T | null;
  valid: boolean;
}

interface ConfigEditorFormState {
  configIdInput: string;
  displayName: string;
  description: string;
  strategyId: string;
  primaryAsset: string;
  supportsDailySuggestion: boolean;
  paramsJson: string;
  compositionJson: string;
}

interface ConfigFieldsPayload {
  composition: StrategyComposition;
  description: string | null;
  display_name: string;
  params: Record<string, unknown>;
  primary_asset: string;
  strategy_id: string;
  supports_daily_suggestion: boolean;
}

interface JsonEditorPanelProps {
  disabled: boolean;
  onChange: (value: string) => void;
  rows: number;
  valid: boolean;
  value: string;
}

const INITIAL_FORM_STATE: ConfigEditorFormState = {
  configIdInput: "",
  displayName: "",
  description: "",
  strategyId: "",
  primaryAsset: "",
  supportsDailySuggestion: false,
  paramsJson: "{}",
  compositionJson: "{}",
};

function tryParseJson<T>(value: string): ParsedJsonResult<T> {
  try {
    return { valid: true, parsed: JSON.parse(value) as T };
  } catch {
    return { valid: false, parsed: null };
  }
}

function getSeedConfig(
  mode: ConfigEditorMode,
  existingConfig: SavedStrategyConfig | null | undefined,
  duplicateFrom: SavedStrategyConfig | null
): SavedStrategyConfig | null {
  return mode === "edit" ? (existingConfig ?? null) : duplicateFrom;
}

function getSeededFormState(
  mode: ConfigEditorMode,
  seedConfig: SavedStrategyConfig | null
): ConfigEditorFormState {
  if (!seedConfig) {
    return INITIAL_FORM_STATE;
  }

  return {
    configIdInput: mode === "edit" ? seedConfig.config_id : "",
    displayName:
      mode === "edit"
        ? seedConfig.display_name
        : `${seedConfig.display_name} (copy)`,
    description: seedConfig.description ?? "",
    strategyId: seedConfig.strategy_id,
    primaryAsset: seedConfig.primary_asset,
    supportsDailySuggestion: seedConfig.supports_daily_suggestion,
    paramsJson: JSON.stringify(seedConfig.params, null, 2),
    compositionJson: JSON.stringify(seedConfig.composition, null, 2),
  };
}

function getEditorTitle(mode: ConfigEditorMode): string {
  return mode === "create" ? "Create Configuration" : "Edit Configuration";
}

function getMutationErrorTitle(mode: ConfigEditorMode): string {
  return mode === "create" ? "Create failed" : "Update failed";
}

function buildFieldsPayload(
  formState: ConfigEditorFormState,
  params: Record<string, unknown>,
  composition: StrategyComposition
): ConfigFieldsPayload {
  return {
    display_name: formState.displayName.trim(),
    description: formState.description.trim() || null,
    strategy_id: formState.strategyId,
    primary_asset: formState.primaryAsset,
    supports_daily_suggestion: formState.supportsDailySuggestion,
    params,
    composition,
  };
}

function getActiveJsonEditorState(
  activeJsonTab: JsonTab,
  formState: ConfigEditorFormState,
  paramsValidation: ParsedJsonResult<Record<string, unknown>>,
  compositionValidation: ParsedJsonResult<StrategyComposition>,
  setFormState: Dispatch<SetStateAction<ConfigEditorFormState>>
): JsonEditorPanelProps {
  if (activeJsonTab === "params") {
    return {
      value: formState.paramsJson,
      onChange: value =>
        setFormState(previous => ({ ...previous, paramsJson: value })),
      valid: paramsValidation.valid,
      rows: 12,
      disabled: false,
    };
  }

  return {
    value: formState.compositionJson,
    onChange: value =>
      setFormState(previous => ({ ...previous, compositionJson: value })),
    valid: compositionValidation.valid,
    rows: 16,
    disabled: false,
  };
}

/**
 * Create/edit form for strategy configurations.
 *
 * @param props - Editor props including mode, configId, and handlers
 * @returns Editor form element
 */
export function ConfigEditorView({
  configId,
  mode,
  duplicateFrom,
  onCancel,
  onSaved,
  onDuplicate,
}: ConfigEditorViewProps): ReactElement {
  const { showToast } = useToast();
  const { data: existingConfig, isLoading } = useStrategyAdminConfig(
    mode === "edit" ? configId : null
  );

  const createMutation = useCreateStrategyConfig();
  const updateMutation = useUpdateStrategyConfig();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const [formState, setFormState] =
    useState<ConfigEditorFormState>(INITIAL_FORM_STATE);
  const [activeJsonTab, setActiveJsonTab] = useState<JsonTab>("params");

  const seedConfig = useMemo(
    () => getSeedConfig(mode, existingConfig, duplicateFrom),
    [duplicateFrom, existingConfig, mode]
  );

  useEffect(() => {
    setFormState(getSeededFormState(mode, seedConfig));
  }, [seedConfig, mode]);

  const isBenchmark = mode === "edit" && existingConfig?.is_benchmark === true;

  const paramsValidation = useMemo(
    () => tryParseJson<Record<string, unknown>>(formState.paramsJson),
    [formState.paramsJson]
  );
  const compositionValidation = useMemo(
    () => tryParseJson<StrategyComposition>(formState.compositionJson),
    [formState.compositionJson]
  );

  const configIdValid =
    mode === "edit" || CONFIG_ID_PATTERN.test(formState.configIdInput);
  const formValid =
    configIdValid &&
    formState.displayName.trim().length > 0 &&
    formState.strategyId.trim().length > 0 &&
    formState.primaryAsset.trim().length > 0 &&
    paramsValidation.valid &&
    compositionValidation.valid;
  const activeJsonEditor = getActiveJsonEditorState(
    activeJsonTab,
    formState,
    paramsValidation,
    compositionValidation,
    setFormState
  );

  const handleSave = useCallback(async () => {
    if (!formValid || isBenchmark) return;

    if (!paramsValidation.parsed || !compositionValidation.parsed) {
      return;
    }

    const sharedFields = buildFieldsPayload(
      formState,
      paramsValidation.parsed,
      compositionValidation.parsed
    );

    try {
      if (mode === "create") {
        await createMutation.mutateAsync({
          config_id: formState.configIdInput,
          ...sharedFields,
        });
        showToast({
          type: "success",
          title: "Configuration created",
          message: `"${sharedFields.display_name}" has been created.`,
        });
      } else {
        await updateMutation.mutateAsync({
          configId: formState.configIdInput,
          body: sharedFields,
        });
        showToast({
          type: "success",
          title: "Configuration updated",
          message: `"${sharedFields.display_name}" has been saved.`,
        });
      }
      onSaved();
    } catch (err) {
      showToast({
        type: "error",
        title: getMutationErrorTitle(mode),
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }, [
    formValid,
    isBenchmark,
    formState,
    mode,
    paramsValidation.parsed,
    compositionValidation.parsed,
    createMutation,
    updateMutation,
    showToast,
    onSaved,
  ]);

  if (mode === "edit" && isLoading) {
    return (
      <div className="flex min-h-[20rem] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h3 className="text-lg font-semibold text-white">
            {getEditorTitle(mode)}
          </h3>
          {mode === "edit" && (
            <span className="rounded-full bg-gray-800 px-3 py-1 font-mono text-xs text-gray-400">
              {formState.configIdInput}
            </span>
          )}
        </div>
        {mode === "edit" && !isBenchmark && existingConfig && (
          <button
            onClick={() => onDuplicate(existingConfig)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
          >
            <Copy className="h-4 w-4" />
            Duplicate
          </button>
        )}
      </div>

      {/* Benchmark Banner */}
      {isBenchmark && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
          <p className="text-sm text-amber-300">
            This is a benchmark configuration and cannot be modified. Duplicate
            it to create an editable copy.
          </p>
        </div>
      )}

      {/* Structured Fields */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-6 space-y-5">
        {/* Config ID */}
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">
            Config ID
          </label>
          {mode === "create" ? (
            <div>
              <input
                type="text"
                value={formState.configIdInput}
                onChange={event =>
                  setFormState(previous => ({
                    ...previous,
                    configIdInput: event.target.value,
                  }))
                }
                placeholder="my_strategy_config"
                className={`w-full rounded-lg border bg-gray-800/50 px-3 py-2 font-mono text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 ${
                  formState.configIdInput && !configIdValid
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-700 focus:ring-purple-500"
                }`}
                disabled={isBenchmark}
              />
              {formState.configIdInput && !configIdValid && (
                <p className="mt-1 text-xs text-red-400">
                  Only lowercase letters, digits, and underscores allowed
                </p>
              )}
            </div>
          ) : (
            <span className="inline-block rounded-full bg-gray-800 px-3 py-1.5 font-mono text-sm text-gray-300">
              {formState.configIdInput}
            </span>
          )}
        </div>

        {/* Display Name */}
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">
            Display Name *
          </label>
          <input
            type="text"
            value={formState.displayName}
            onChange={event =>
              setFormState(previous => ({
                ...previous,
                displayName: event.target.value,
              }))
            }
            placeholder="My Strategy Config"
            className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
            disabled={isBenchmark}
          />
        </div>

        {/* Description */}
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">
            Description
          </label>
          <textarea
            value={formState.description}
            onChange={event =>
              setFormState(previous => ({
                ...previous,
                description: event.target.value,
              }))
            }
            placeholder="Optional description..."
            rows={2}
            className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
            disabled={isBenchmark}
          />
        </div>

        {/* Strategy ID + Primary Asset row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">
              Strategy ID *
            </label>
            <select
              value={formState.strategyId}
              onChange={event =>
                setFormState(previous => ({
                  ...previous,
                  strategyId: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
              disabled={isBenchmark}
            >
              <option value="">Select strategy...</option>
              {Object.entries(STRATEGY_IDS).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">
              Primary Asset *
            </label>
            <input
              type="text"
              value={formState.primaryAsset}
              onChange={event =>
                setFormState(previous => ({
                  ...previous,
                  primaryAsset: event.target.value,
                }))
              }
              placeholder="BTC"
              className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
              disabled={isBenchmark}
            />
          </div>
        </div>

        {/* Daily Suggestion Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">
              Supports Daily Suggestion
            </p>
            <p className="text-xs text-gray-500">
              Enable to allow this config as a daily suggestion preset
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={formState.supportsDailySuggestion}
            onClick={() =>
              setFormState(previous => ({
                ...previous,
                supportsDailySuggestion: !previous.supportsDailySuggestion,
              }))
            }
            disabled={isBenchmark}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed ${
              formState.supportsDailySuggestion
                ? "bg-purple-600"
                : "bg-gray-700"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                formState.supportsDailySuggestion
                  ? "translate-x-5"
                  : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* JSON Editors */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/40">
        {/* Tab bar */}
        <div className="flex border-b border-gray-800">
          {JSON_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveJsonTab(tab)}
              className={`px-4 py-3 text-sm font-medium capitalize transition-colors ${
                activeJsonTab === tab
                  ? "border-b-2 border-purple-500 text-white"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Editor area */}
        <div className="p-4">
          <JsonEditorPanel {...activeJsonEditor} disabled={isBenchmark} />
        </div>
      </div>

      {/* Actions */}
      {!isBenchmark && (
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="rounded-lg border border-gray-600 px-5 py-2.5 text-sm text-gray-300 hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!formValid || isSaving}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      )}
    </div>
  );
}

function JsonEditorPanel({
  value,
  onChange,
  valid,
  rows,
  disabled,
}: JsonEditorPanelProps): ReactElement {
  return (
    <div>
      <textarea
        value={value}
        onChange={event => onChange(event.target.value)}
        rows={rows}
        spellCheck={false}
        className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 font-mono text-sm text-green-400 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-y"
        disabled={disabled}
      />
      {value.trim() && (
        <p
          className={`mt-1.5 text-xs ${valid ? "text-green-500" : "text-red-400"}`}
        >
          {valid
            ? "Valid JSON"
            : "Invalid JSON — fix syntax errors before saving"}
        </p>
      )}
    </div>
  );
}
