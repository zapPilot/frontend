/**
 * Modal Component Types
 *
 * Type definitions for modal/dialog components.
 * Minimal set retained for ZapExecutionProgress component.
 *
 * @module types/modal
 */

import type { ReactNode } from "react";

/**
 * Base modal props with generic result type
 * Foundation for all modal components in the application
 *
 * @template TResult - Type of result returned when modal closes
 */
export interface BaseModalProps<TResult = void> {
  /** Whether modal is currently open */
  isOpen: boolean;
  /** Handler called when modal closes, receives optional result */
  onClose: (result?: TResult) => void;
  /** Modal content */
  children: ReactNode;
  /** Additional CSS classes for customization */
  className?: string;
  /** Z-index override for stacking context */
  zIndex?: string;
}

/**
 * Transaction execution status
 */
type TransactionStatus =
  | "idle"
  | "pending"
  | "confirming"
  | "success"
  | "failed"
  | "cancelled";

/**
 * Transaction metadata for block explorers
 */
interface TransactionMetadata {
  /** Transaction hash */
  hash: string;
  /** Chain ID where transaction occurred */
  chainId: number;
  /** Block explorer URL for this transaction */
  explorerUrl?: string;
  /** Block number (available after confirmation) */
  blockNumber?: number;
  /** Gas consumed by transaction (in wei) */
  gasUsed?: string;
  /** Effective gas price paid (in wei) */
  effectiveGasPrice?: string;
  /** Transaction timestamp */
  timestamp?: number;
}

/**
 * Successful Zap execution result
 */
export interface ZapExecutionResult {
  /** Final transaction status */
  status: TransactionStatus;
  /** Array of transaction metadata */
  transactions: TransactionMetadata[];
  /** Total value transacted in USD */
  totalValue: number;
  /** Number of strategies executed */
  strategyCount: number;
  /** Intent identifier for tracking */
  intentId: string;
  /** Total execution time in milliseconds */
  executionTime: number;
  /** User-facing success message */
  message: string;
  /** Optional additional data */
  metadata?: Record<string, unknown>;
}
