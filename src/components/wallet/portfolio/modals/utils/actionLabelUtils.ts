import { WALLET_LABELS } from "@/constants/wallet";

interface ActionLabelConfig {
  isConnected: boolean;
  isReady: boolean;
  readyLabel: string;
  notReadyLabel: string;
  hasSelection?: boolean;
  selectionLabel?: string;
}

export function resolveActionLabel({
  isConnected,
  isReady,
  readyLabel,
  notReadyLabel,
  hasSelection = true,
  selectionLabel = notReadyLabel,
}: ActionLabelConfig): string {
  const needsConnection = !isConnected;
  if (needsConnection) {
    return WALLET_LABELS.CONNECT;
  }

  const needsSelection = !hasSelection;
  if (needsSelection) {
    return selectionLabel;
  }

  const cannotProceed = !isReady;
  if (cannotProceed) {
    return notReadyLabel;
  }

  return readyLabel;
}
