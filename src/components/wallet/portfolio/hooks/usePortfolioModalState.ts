"use client";

import { useCallback, useState } from "react";

import type { ModalType } from "@/types/portfolio";

/**
 * Custom hook for managing portfolio modal state.
 * Consolidates modal and settings panel state management.
 */
export function usePortfolioModalState() {
  const [activeModal, setActiveModal] = useState<ModalType | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const openModal = useCallback((type: ModalType | null) => {
    setActiveModal(type);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  const openSettings = useCallback(() => {
    setIsSettingsOpen(true);
  }, []);

  return {
    activeModal,
    isSettingsOpen,
    openModal,
    closeModal,
    openSettings,
    setIsSettingsOpen,
  };
}
