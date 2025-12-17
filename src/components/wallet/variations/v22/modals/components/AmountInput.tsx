"use client";

import { useMemo } from "react";

import type { TransactionToken } from "@/types/domain/transaction";

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  max?: string | undefined;
  token?: TransactionToken | null;
  error?: string | undefined;
  showMaxButton?: boolean;
  readOnly?: boolean;
}

const QUICK_PRESETS = [25, 50, 75, 100];

export function AmountInput({
  value,
  onChange,
  max,
  token,
  error,
  showMaxButton = true,
  readOnly = false,
}: AmountInputProps) {
  const usdValue = useMemo(() => {
    const numericAmount = parseFloat(value || "0");
    if (!token?.usdPrice || Number.isNaN(numericAmount)) return 0;
    return numericAmount * token.usdPrice;
  }, [token?.usdPrice, value]);

  const handlePreset = (pct: number) => {
    if (!max) return;
    const numericMax = parseFloat(max);
    if (Number.isNaN(numericMax)) return;
    const next = ((numericMax * pct) / 100).toFixed(2);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-widest text-gray-500">
          Amount
        </div>
        {showMaxButton && max ? (
          <button
            type="button"
            onClick={() => onChange(max)}
            className="text-xs font-semibold text-purple-300 hover:text-white"
          >
            Max: {max}
          </button>
        ) : null}
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-4">
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={value}
            onChange={event => onChange(event.target.value)}
            placeholder="0.00"
            min="0"
            inputMode="decimal"
            aria-label="Amount"
            readOnly={readOnly}
            data-testid="amount-input"
            className="w-full bg-transparent text-2xl font-semibold text-white placeholder:text-gray-600 focus:outline-none"
          />
          {token ? (
            <div className="rounded-xl bg-gray-800 px-3 py-2 text-sm font-semibold text-white">
              {token.symbol}
            </div>
          ) : null}
        </div>

        <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
          <div>≈ ${usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
          {token?.usdPrice ? (
            <div className="text-xs">
              1 {token.symbol} ≈ ${token.usdPrice.toLocaleString()}
            </div>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK_PRESETS.map(pct => (
            <button
              key={pct}
              type="button"
              onClick={() => handlePreset(pct)}
              data-testid={`preset-${pct}`}
              className="rounded-lg border border-gray-800 px-3 py-1.5 text-xs font-semibold text-gray-300 transition-colors hover:border-purple-500/40 hover:text-white"
            >
              {pct}%
            </button>
          ))}
        </div>

        {error ? (
          <p className="mt-2 text-xs font-semibold text-red-300">{error}</p>
        ) : null}
      </div>
    </div>
  );
}
