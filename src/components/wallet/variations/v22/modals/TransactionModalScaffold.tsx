"use client";

import type { ReactNode } from "react";

import {
  type ActionButtonsProps,
  TransactionFormLayout,
  type TransactionFormLayoutProps,
} from "./components/TransactionFormLayout";
import type { useTransactionForm } from "./hooks/useTransactionForm";
import type { useTransactionTokenData } from "./hooks/useTransactionTokenData";

type TransactionModalMeta = Pick<
  TransactionFormLayoutProps,
  "isOpen" | "onClose" | "title" | "subtitle" | "accent" | "testId"
>;

interface TransactionModalScaffoldProps {
  meta: TransactionModalMeta;
  form: ReturnType<typeof useTransactionForm>;
  transactionData: ReturnType<typeof useTransactionTokenData>;
  chainId: number | null;
  amount: string;
  maxAmount?: string | null;
  token: ReturnType<typeof useTransactionTokenData>["selectedToken"];
  amountError?: string | null;
  readOnlyAmount?: boolean;
  summary: Parameters<typeof TransactionFormLayout>[0]["summary"];
  actionButtons: ActionButtonsProps;
  successMessage?: string | null;
  successClassName?: string;
  preFormContent?: ReactNode;
  postAmountContent?: ReactNode;
}

export function TransactionModalScaffold({
  meta,
  form,
  transactionData,
  chainId,
  amount,
  maxAmount,
  token,
  amountError,
  readOnlyAmount,
  summary,
  actionButtons,
  successMessage,
  successClassName,
  preFormContent,
  postAmountContent,
}: TransactionModalScaffoldProps) {
  return (
    <TransactionFormLayout
      isOpen={meta.isOpen}
      onClose={meta.onClose}
      title={meta.title}
      subtitle={meta.subtitle}
      accent={meta.accent}
      testId={meta.testId}
      chainList={transactionData.chainList}
      selectedChainId={chainId}
      onSelectChain={id => form.setValue("chainId", id)}
      tokens={transactionData.tokenQuery.data ?? []}
      selectedTokenAddress={transactionData.selectedToken?.address ?? null}
      onSelectToken={address => form.setValue("tokenAddress", address)}
      balances={transactionData.balances}
      tokensLoading={transactionData.tokenQuery.isLoading}
      amount={amount}
      onChangeAmount={value => form.setValue("amount", value)}
      {...(maxAmount ? { maxAmount } : {})}
      token={token}
      {...(amountError ? { amountError } : {})}
      {...(readOnlyAmount !== undefined ? { readOnlyAmount } : {})}
      summary={summary}
      actionButtons={actionButtons}
      {...(successMessage ? { successMessage } : {})}
      {...(successClassName ? { successClassName } : {})}
      preFormContent={preFormContent}
      postAmountContent={postAmountContent}
    />
  );
}
