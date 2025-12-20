"use client";

import { useId, useMemo } from "react";

import { FOCUS_STYLES } from "@/constants/design-system";
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
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const descriptionId = `${inputId}-description`;

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
            aria-label={`Set amount to maximum balance: ${max} ${token?.symbol || "tokens"}`}
            className={`text-xs font-semibold text-purple-300 hover:text-white ${FOCUS_STYLES}`}
          >
            Max: {max}
          </button>
        ) : null}
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-4">
        <div className="flex items-center gap-3">
          <input
            id={inputId}
            type="number"
            value={value}
            onChange={event => onChange(event.target.value)}
            placeholder="0.00"
            min="0"
            inputMode="decimal"
            aria-label={`${token?.symbol || "Token"} amount`}
            aria-describedby={[descriptionId, error ? errorId : null]
              .filter(Boolean)
              .join(" ")}
            aria-invalid={!!error}
            readOnly={readOnly}
            data-testid="amount-input"
            className={`w-full bg-transparent text-2xl font-semibold text-white placeholder:text-gray-600 ${FOCUS_STYLES}`}
          />
          {token ? (
            <div className="rounded-xl bg-gray-800 px-3 py-2 text-sm font-semibold text-white">
              {token.symbol}
            </div>
          ) : null}
        </div>

        <div
          id={descriptionId}
          className="mt-2 flex items-center justify-between text-sm text-gray-500"
        >
          <div>
            ≈ $
            {usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
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
              aria-label={`Set amount to ${pct} percent of maximum balance`}
              data-testid={`preset-${pct}`}
              className={`rounded-lg border border-gray-800 px-3 py-1.5 text-xs font-semibold text-gray-300 transition-colors hover:border-purple-500/40 hover:text-white ${FOCUS_STYLES}`}
            >
              {pct}%
            </button>
          ))}
        </div>

        {error ? (
          <p
            id={errorId}
            role="alert"
            className="mt-2 text-xs font-semibold text-red-300"
          >
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
