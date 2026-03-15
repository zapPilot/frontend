"use client";

import { type ReactElement, useCallback, useState } from "react";

import { Spinner } from "@/components/ui";
import { useStrategyAdminConfigs } from "@/hooks/queries/strategyAdmin";
import type { SavedStrategyConfig } from "@/types/strategyAdmin";

import { ConfigEditorView } from "./ConfigEditorView";
import { ConfigListView } from "./ConfigListView";

type ViewMode = "list" | "editor";
type EditorMode = "create" | "edit";

/**
 * Top-level container for the strategy config manager sub-tab.
 *
 * Owns the list/editor view state and orchestrates navigation between them.
 *
 * @returns Config manager view element
 */
export function ConfigManagerView(): ReactElement {
  const { data: configs, isLoading, error } = useStrategyAdminConfigs();

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [editorMode, setEditorMode] = useState<EditorMode>("create");
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
  const [duplicateFrom, setDuplicateFrom] =
    useState<SavedStrategyConfig | null>(null);

  const handleEdit = useCallback((configId: string) => {
    setSelectedConfigId(configId);
    setEditorMode("edit");
    setDuplicateFrom(null);
    setViewMode("editor");
  }, []);

  const handleCreate = useCallback(() => {
    setSelectedConfigId(null);
    setEditorMode("create");
    setDuplicateFrom(null);
    setViewMode("editor");
  }, []);

  const handleDuplicate = useCallback((config: SavedStrategyConfig) => {
    setSelectedConfigId(null);
    setEditorMode("create");
    setDuplicateFrom(config);
    setViewMode("editor");
  }, []);

  const handleBackToList = useCallback(() => {
    setViewMode("list");
    setSelectedConfigId(null);
    setDuplicateFrom(null);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-8 text-center">
        <p className="text-sm text-red-400">
          Failed to load configurations.{" "}
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
    );
  }

  if (viewMode === "editor") {
    return (
      <ConfigEditorView
        configId={selectedConfigId}
        mode={editorMode}
        duplicateFrom={duplicateFrom}
        onCancel={handleBackToList}
        onSaved={handleBackToList}
        onDuplicate={handleDuplicate}
      />
    );
  }

  return (
    <ConfigListView
      configs={configs ?? []}
      onEdit={handleEdit}
      onDuplicate={handleDuplicate}
      onCreate={handleCreate}
    />
  );
}
