import type { WalletPortfolioDataWithDirection } from "@/adapters/walletPortfolioDataAdapter";
import { SettingsModal } from "@/components/wallet/portfolio/components/SettingsModal";
import {
    DepositModal,
    RebalanceModal,
} from "@/components/wallet/portfolio/modals";
import { WithdrawModal } from "@/components/wallet/portfolio/modals/WithdrawModal";
import type { ModalType } from "@/types/portfolio";

interface PortfolioModalsProps {
  activeModal: ModalType | null;
  onClose: () => void;
  data: WalletPortfolioDataWithDirection;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (isOpen: boolean) => void;
}

export function PortfolioModals({
  activeModal,
  onClose,
  data,
  isSettingsOpen,
  setIsSettingsOpen,
}: PortfolioModalsProps) {
  const rebalanceAllocation = {
    crypto: data.currentAllocation.crypto,
    stable: data.currentAllocation.stable,
    simplifiedCrypto: data.currentAllocation.simplifiedCrypto,
  };

  return (
    <>
      <DepositModal
        isOpen={activeModal === "deposit"}
        onClose={onClose}
        defaultChainId={1}
      />
      <WithdrawModal isOpen={activeModal === "withdraw"} onClose={onClose} />
      <RebalanceModal
        isOpen={activeModal === "rebalance"}
        onClose={onClose}
        currentAllocation={rebalanceAllocation}
        targetAllocation={data.targetAllocation}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
}
