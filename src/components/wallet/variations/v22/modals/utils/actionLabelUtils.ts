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
  if (!isConnected) return "Connect Wallet";
  if (!hasSelection) return selectionLabel;
  if (!isReady) return notReadyLabel;
  return readyLabel;
}
