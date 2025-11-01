// Main component
export { WalletManager } from "./WalletManager";

// Types
export type { WalletManagerProps } from "./types/wallet.types";

// Components
export { WalletCard } from "./components/WalletCard";
export { WalletActionMenu } from "./components/WalletActionMenu";
export { EditWalletModal } from "./components/EditWalletModal";
export { AddWalletForm } from "./components/AddWalletForm";
export { EmailSubscription } from "./components/EmailSubscription";
export { WalletList } from "./components/WalletList";

// Hooks
export { useWalletOperations } from "./hooks/useWalletOperations";
export { useEmailSubscription } from "./hooks/useEmailSubscription";
export { useDropdownMenu } from "./hooks/useDropdownMenu";

// Services
export {
  loadWallets,
  addWallet,
  removeWallet,
  updateWalletLabel,
  updateUserEmailSubscription,
  unsubscribeUserEmail,
} from "./services/WalletService";

// Utils
export {
  validateAddress,
  validateLabel,
  validateEmail,
  validateNewWallet,
} from "./utils/validation";
