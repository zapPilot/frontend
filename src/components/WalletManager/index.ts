// Main component
export { WalletManager } from "./WalletManager";

// Components
export { AddWalletForm } from "./components/AddWalletForm";
export { EditWalletModal } from "./components/EditWalletModal";
export { EmailSubscription } from "./components/EmailSubscription";
export { WalletActionMenu } from "./components/WalletActionMenu";
export { WalletCard } from "./components/WalletCard";
export { WalletList } from "./components/WalletList";

// Hooks
export { useDropdownMenu } from "./hooks/useDropdownMenu";
export { useEmailSubscription } from "./hooks/useEmailSubscription";
export { useWalletOperations } from "./hooks/useWalletOperations";

// Services
export {
  addWallet,
  loadWallets,
  removeWallet,
  unsubscribeUserEmail,
  updateUserEmailSubscription,
  updateWalletLabel,
} from "./services/WalletService";

// Utils
export {
  validateEmail,
  validateNewWallet,
} from "./utils/validation";
