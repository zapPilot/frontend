"use client";

import { ArrowRight, Check } from "lucide-react";
import type { ReactNode } from "react";
import type { UseFormReturn } from "react-hook-form";

import { GradientButton } from "@/components/ui/GradientButton";
import type { TransactionFormData } from "@/types/domain/transaction";

import { IntentVisualizer } from "../visualizers/IntentVisualizer";

interface TransactionModalHeaderProps {
  title: string;
  indicatorClassName: string;
  isSubmitting: boolean;
  onClose: () => void;
}

export function TransactionModalHeader({
  title,
  indicatorClassName,
  isSubmitting,
  onClose,
}: TransactionModalHeaderProps) {
  return (
    <div className="bg-gray-900/50 p-4 flex justify-between items-center border-b border-gray-800">
      <h3 className="font-bold text-white flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${indicatorClassName}`} />
        {title}
      </h3>
      {!isSubmitting && (
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          ✕
        </button>
      )}
    </div>
  );
}

type SuccessTone = "green" | "indigo";

const SUCCESS_TONE_STYLES: Record<SuccessTone, string> = {
  green: "bg-green-500/10 border border-green-500/20 text-green-400",
  indigo: "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400",
};

interface SuccessBannerProps {
  message: string;
  tone: SuccessTone;
  extra?: ReactNode;
}

// Internal function used by SubmittingState
function SuccessBanner({ message, tone, extra }: SuccessBannerProps) {
  return (
    <div
      className={`mt-6 p-4 rounded-xl flex items-center gap-3 ${SUCCESS_TONE_STYLES[tone]}`}
    >
      <Check className="w-5 h-5 flex-shrink-0" />
      <div className="text-sm font-semibold">{message}</div>
      {extra ? <div className="ml-auto">{extra}</div> : null}
    </div>
  );
}

interface SubmittingStateProps {
  isSuccess: boolean;
  successMessage?: string;
  successTone?: SuccessTone;
  successExtra?: ReactNode;
}

export function SubmittingState({
  isSuccess,
  successMessage,
  successTone = "indigo",
  successExtra,
}: SubmittingStateProps) {
  return (
    <div className="animate-in fade-in zoom-in duration-300">
      <div className="mb-6">
        <IntentVisualizer />
      </div>

      {isSuccess && successMessage ? (
        <SuccessBanner
          message={successMessage}
          tone={successTone}
          extra={successExtra}
        />
      ) : null}
    </div>
  );
}

interface AmountInputSectionProps {
  amount: string;
  onChange: (value: string) => void;
  usdPrice?: number | undefined;
  className?: string | undefined;
}

// Internal function used by TransactionFormActions
function AmountInputSection({
  amount,
  onChange,
  usdPrice,
  className,
}: AmountInputSectionProps) {
  const normalizedAmount = parseFloat(amount || "0");
  const amountUsd = (normalizedAmount * (usdPrice ?? 1)).toLocaleString();

  return (
    <div className={className ?? "relative"}>
      <div className="absolute top-0 left-0 text-xs font-bold text-gray-500 uppercase tracking-wider">
        Amount
      </div>
      <input
        type="number"
        value={amount}
        onChange={event => onChange(event.target.value)}
        placeholder="0.00"
        className="w-full bg-transparent text-4xl font-mono font-bold text-white placeholder-gray-800 focus:outline-none py-6 border-b border-gray-800 focus:border-indigo-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <div className="absolute top-6 right-0 text-sm text-gray-500 flex items-center gap-1">
        ≈ ${amountUsd}
      </div>
    </div>
  );
}

interface QuickPercentPillsProps {
  onSelect: (pct: number) => void;
  values?: number[];
}

// Internal function used by TransactionFormActions
function QuickPercentPills({
  onSelect,
  values = [0.25, 0.5, 0.75, 1],
}: QuickPercentPillsProps) {
  return (
    <div className="flex gap-2">
      {values.map(pct => (
        <button
          key={pct}
          onClick={() => onSelect(pct)}
          className="flex-1 bg-gray-900 hover:bg-gray-800 text-gray-400 text-xs font-bold py-2 rounded-lg border border-gray-800 transition-colors"
        >
          {pct === 1 ? "MAX" : `${pct * 100}%`}
        </button>
      ))}
    </div>
  );
}

interface TransactionFormActionsProps {
  amount: string;
  onAmountChange: (value: string) => void;
  usdPrice?: number | undefined;
  onQuickSelect: (pct: number) => void;
  actionLabel: string;
  actionDisabled: boolean;
  actionGradient: string;
  onAction: () => void;
  className?: string;
  amountClassName?: string;
}

// Internal function used by TransactionFormActionsWithForm
function TransactionFormActions({
  amount,
  onAmountChange,
  usdPrice,
  onQuickSelect,
  actionLabel,
  actionDisabled,
  actionGradient,
  onAction,
  className,
  amountClassName,
}: TransactionFormActionsProps) {
  return (
    <div className={className ?? "flex flex-col gap-6"}>
      <AmountInputSection
        className={amountClassName}
        amount={amount}
        onChange={onAmountChange}
        usdPrice={usdPrice}
      />

      <QuickPercentPills onSelect={onQuickSelect} />

      <TransactionActionButton
        gradient={actionGradient}
        disabled={actionDisabled}
        onClick={onAction}
        label={actionLabel}
      />
    </div>
  );
}

type TransactionFormActionsWithFormProps = Omit<
  TransactionFormActionsProps,
  "onAmountChange"
> & {
  form: UseFormReturn<TransactionFormData>;
};

export function TransactionFormActionsWithForm({
  form,
  amount,
  usdPrice,
  onQuickSelect,
  actionLabel,
  actionDisabled,
  actionGradient,
  onAction,
  className,
  amountClassName,
}: TransactionFormActionsWithFormProps) {
  return (
    <TransactionFormActions
      amount={amount}
      onAmountChange={value =>
        form.setValue("amount", value, { shouldValidate: true })
      }
      usdPrice={usdPrice}
      onQuickSelect={onQuickSelect}
      actionLabel={actionLabel}
      actionDisabled={actionDisabled}
      actionGradient={actionGradient}
      onAction={onAction}
      {...(className && { className })}
      {...(amountClassName && { amountClassName })}
    />
  );
}

interface TransactionActionButtonProps {
  gradient: string;
  disabled: boolean;
  label: string;
  onClick: () => void;
}

export function TransactionActionButton({
  gradient,
  disabled,
  label,
  onClick,
}: TransactionActionButtonProps) {
  return (
    <GradientButton
      gradient={gradient}
      className="w-full py-4 text-lg font-bold shadow-lg shadow-indigo-500/10 flex items-center justify-center gap-2 group"
      disabled={disabled}
      onClick={onClick}
    >
      <span>{label}</span>
      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
    </GradientButton>
  );
}
