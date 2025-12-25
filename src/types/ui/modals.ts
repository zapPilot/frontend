/**
 * Transaction Modal Type Definitions
 * Centralized prop interfaces for all transaction modals
 */

import type { AllocationBreakdown } from "@/types/domain/transaction";

export interface BaseTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface DepositModalProps extends BaseTransactionModalProps {
  defaultChainId?: number;
}

export interface WithdrawModalProps extends BaseTransactionModalProps {
  defaultChainId?: number;
}

export interface RebalanceModalProps extends BaseTransactionModalProps {
  currentAllocation: AllocationBreakdown;
  targetAllocation: AllocationBreakdown;
}
