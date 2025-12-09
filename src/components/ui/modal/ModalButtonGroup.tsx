import type { ModalButtonGroupProps } from "./types";

export function ModalButtonGroup({
  onCancel,
  onConfirm,
  cancelLabel = "Cancel",
  confirmLabel = "Confirm",
  confirmVariant = "primary",
  confirmDisabled = false,
  isLoading = false,
}: ModalButtonGroupProps) {
  const variantStyles = {
    primary:
      "bg-gradient-to-r from-purple-600 to-blue-600 shadow-purple-500/20 hover:shadow-purple-500/40",
    success:
      "bg-gradient-to-r from-green-600 to-emerald-600 shadow-green-500/20 hover:shadow-green-500/40",
    danger:
      "bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50",
  }[confirmVariant];

  return (
    <>
      <button
        onClick={onCancel}
        disabled={isLoading}
        className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl transition-colors disabled:opacity-50"
      >
        {cancelLabel}
      </button>
      <button
        onClick={onConfirm}
        disabled={confirmDisabled || isLoading}
        className={`flex-1 py-3 ${variantStyles} text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50`}
      >
        {confirmLabel}
      </button>
    </>
  );
}
