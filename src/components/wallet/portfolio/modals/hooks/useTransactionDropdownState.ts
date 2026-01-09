"use client";

import {
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export interface TransactionDropdownState {
  dropdownRef: RefObject<HTMLDivElement | null>;
  isAssetDropdownOpen: boolean;
  isChainDropdownOpen: boolean;
  toggleAssetDropdown: () => void;
  toggleChainDropdown: () => void;
  closeDropdowns: () => void;
}

export function useTransactionDropdownState(): TransactionDropdownState {
  const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false);
  const [isChainDropdownOpen, setIsChainDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const closeDropdowns = useCallback(() => {
    setIsAssetDropdownOpen(false);
    setIsChainDropdownOpen(false);
  }, []);

  const toggleAssetDropdown = useCallback(() => {
    setIsAssetDropdownOpen(prev => !prev);
    setIsChainDropdownOpen(false);
  }, []);

  const toggleChainDropdown = useCallback(() => {
    setIsChainDropdownOpen(prev => !prev);
    setIsAssetDropdownOpen(false);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        closeDropdowns();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [closeDropdowns]);

  return {
    dropdownRef,
    isAssetDropdownOpen,
    isChainDropdownOpen,
    toggleAssetDropdown,
    toggleChainDropdown,
    closeDropdowns,
  };
}
