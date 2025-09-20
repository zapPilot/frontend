"use client";

import { SwapToken } from "../../types/swap";

interface AmountButtonsProps {
  fromToken: SwapToken;
  onAmountChange: (amount: string) => void;
}

const AMOUNT_PERCENTAGES = [
  { label: "25%", value: 0.25 },
  { label: "50%", value: 0.5 },
  { label: "75%", value: 0.75 },
  { label: "MAX", value: 1.0 },
];

export function AmountButtons({
  fromToken,
  onAmountChange,
}: AmountButtonsProps) {
  const handlePercentageClick = (percentage: number) => {
    if (fromToken.balance !== undefined) {
      const amount = (fromToken.balance * percentage).toString();
      onAmountChange(amount);
    }
  };

  return (
    <div className="flex gap-2 mt-3">
      {AMOUNT_PERCENTAGES.map(option => (
        <button
          key={option.label}
          onClick={() => handlePercentageClick(option.value)}
          className="flex-1 px-2 py-1 rounded-lg bg-purple-600/20 text-purple-400 text-xs font-medium hover:bg-purple-600/30 transition-colors cursor-pointer"
          data-testid={`amount-${option.label.toLowerCase()}-button`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
