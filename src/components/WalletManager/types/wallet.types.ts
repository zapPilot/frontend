export interface WalletManagerProps {
  isOpen: boolean;
  onClose: () => void;
  urlUserId?: string;
  onEmailSubscribed?: () => void;
}

// Local operation states
export interface OperationState {
  isLoading: boolean;
  error: string | null;
}

export interface WalletOperations {
  adding: OperationState;
  removing: { [walletId: string]: OperationState };
  editing: { [walletId: string]: OperationState };
  subscribing: OperationState;
}

export interface EditingWallet {
  id: string;
  label: string;
}

export interface NewWallet {
  address: string;
  label: string;
}

export interface MenuPosition {
  top: number;
  left: number;
}

export interface WalletState {
  wallets: import("@/services/userService").WalletData[];
  operations: WalletOperations;
  isRefreshing: boolean;
  isAdding: boolean;
  editingWallet: EditingWallet | null;
  newWallet: NewWallet;
  validationError: string | null;
  email: string;
  subscribedEmail: string | null;
  isEditingSubscription: boolean;
  openDropdown: string | null;
  menuPosition: MenuPosition | null;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}
