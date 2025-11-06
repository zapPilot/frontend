import { validateWalletAddress } from "@/lib/walletUtils";

import type { NewWallet, ValidationResult } from "../types/wallet.types";

/**
 * Validate wallet address format
 */
export const validateAddress = (address: string): ValidationResult => {
  if (!address.trim()) {
    return {
      isValid: false,
      error: "Wallet address is required",
    };
  }

  if (!validateWalletAddress(address)) {
    return {
      isValid: false,
      error:
        "Invalid wallet address format. Must be a 42-character Ethereum address starting with 0x",
    };
  }

  return { isValid: true };
};

/**
 * Validate wallet label
 */
export const validateLabel = (label: string): ValidationResult => {
  if (!label.trim()) {
    return {
      isValid: false,
      error: "Wallet label is required",
    };
  }

  if (label.trim().length < 2) {
    return {
      isValid: false,
      error: "Wallet label must be at least 2 characters long",
    };
  }

  return { isValid: true };
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): ValidationResult => {
  if (!email.trim()) {
    return {
      isValid: false,
      error: "Email address is required",
    };
  }

  // More specific email regex to prevent catastrophic backtracking
  const emailRegex = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      error: "Please enter a valid email address",
    };
  }

  return { isValid: true };
};

/**
 * Validate new wallet form data
 */
export const validateNewWallet = (wallet: NewWallet): ValidationResult => {
  const labelValidation = validateLabel(wallet.label);
  if (!labelValidation.isValid) {
    return labelValidation;
  }

  const addressValidation = validateAddress(wallet.address);
  if (!addressValidation.isValid) {
    return addressValidation;
  }

  return { isValid: true };
};
