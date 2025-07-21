/**
 * App Configuration
 *
 * Application-level constants including app metadata,
 * environment configuration, and global settings.
 */

// Application Metadata
export const APP_CONFIG = {
  name: "Zap Pilot",
  description: "Intent-based DeFi execution engine",
  version: "0.1.0",
  author: "Zap Pilot Team",
  repository: "https://github.com/zap-pilot/frontend",
} as const;

// Environment Configuration
export const ENV_CONFIG = {
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",
} as const;

// Global App Settings
export const APP_SETTINGS = {
  DEFAULT_THEME: "dark",
  SUPPORTED_LOCALES: ["en-US", "en-GB"] as const,
  DEFAULT_LOCALE: "en-US",
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes in ms
  AUTO_SAVE_INTERVAL: 5 * 60 * 1000, // 5 minutes in ms
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network connection error. Please try again.",
  WALLET_NOT_CONNECTED: "Please connect your wallet to continue.",
  INSUFFICIENT_BALANCE: "Insufficient balance for this transaction.",
  TRANSACTION_FAILED: "Transaction failed. Please try again.",
  UNKNOWN_ERROR: "An unexpected error occurred.",
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  WALLET_CONNECTED: "Wallet connected successfully!",
  TRANSACTION_COMPLETE: "Transaction completed successfully!",
  SETTINGS_SAVED: "Settings saved successfully!",
} as const;
