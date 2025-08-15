import { useState } from "react";

/**
 * Custom hook for managing wallet manager modal state
 * Performance optimized: removed unnecessary useCallback for simple state setters
 */
export function useWalletModal() {
  const [isOpen, setIsOpen] = useState(false);

  // Simple state setters don't need memoization - React guarantees stability
  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return {
    isOpen,
    openModal,
    closeModal,
  };
}
