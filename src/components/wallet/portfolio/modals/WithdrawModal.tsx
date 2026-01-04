"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Coins, Layers } from "lucide-react";
import Image from "next/image";
import { type ReactNode, useEffect, useRef, useState } from "react";

import {
  type AssetCategoryKey,
  getCategoryForToken,
} from "@/lib/domain/assetCategoryUtils";
import { dropdownMenu } from "@/lib/ui/animationVariants";
import { cn } from "@/lib/ui/classNames";
import { useWalletProvider } from "@/providers/WalletProvider";
import { transactionService } from "@/services";
import type { WithdrawModalProps } from "@/types/ui/modals";

import { TransactionModalBase } from "./base/TransactionModalBase";
import * as modalDeps from "./transactionModalDependencies";

interface DropdownPanelProps {
  isOpen: boolean;
  className: string;
  children: ReactNode;
}

/* c8 ignore start - Pure UI animation component, covered by E2E tests */
function DropdownPanel({ isOpen, className, children }: DropdownPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial="initial"
          animate="animate"
          exit="exit"
          variants={dropdownMenu}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
/* c8 ignore stop */

const CATEGORIES: {
  id: AssetCategoryKey;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "stablecoin",
    label: "Stablecoins",
    icon: <Coins className="w-3 h-3 text-emerald-400" />,
  },
  {
    id: "btc",
    label: "Bitcoin",
    icon: <span className="text-orange-400 font-bold text-xs">₿</span>,
  },
  {
    id: "eth",
    label: "Ethereum",
    icon: <span className="text-blue-400 font-bold text-xs">Ξ</span>,
  },
  {
    id: "altcoin",
    label: "Altcoins",
    icon: <Layers className="w-3 h-3 text-purple-400" />,
  },
];

export function WithdrawModal({
  isOpen,
  onClose,
  defaultChainId = 1,
}: WithdrawModalProps) {
  const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false);
  const [isChainDropdownOpen, setIsChainDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsAssetDropdownOpen(false);
        setIsChainDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <TransactionModalBase
      isOpen={isOpen}
      onClose={onClose}
      title="Withdraw from Pilot"
      indicatorColor="bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
      defaultChainId={defaultChainId}
      slippage={0.5}
      submitFn={transactionService.simulateWithdraw}
      successMessage="Withdrawal Executed Successfully!"
      successTone="indigo"
      modalContentClassName="p-0 overflow-visible bg-gray-950 border-gray-800"
    >
      {({
        form,
        chainId,
        amount,
        transactionData,
        selectedChain,
        isSubmitDisabled,
        handleSubmit,
      }) => {
        const tokens = transactionData.tokenQuery.data || [];
        const tokensByCategory = CATEGORIES.reduce(
          (acc, cat) => {
            acc[cat.id] = tokens.filter(
              t => getCategoryForToken(t.symbol) === cat.id
            );
            return acc;
          },
          {} as Record<AssetCategoryKey, typeof tokens>
        );

        const handlePercentage = (pct: number) => {
          const max = parseFloat(
            transactionData.balances[
              transactionData.selectedToken?.address || ""
            ]?.balance || "0"
          );
          modalDeps.applyPercentageToAmount(form, pct, max);
        };

        // Destructure formState to ensure proper subscription to changes
        const { isValid } = form.formState;

        const { isConnected } = useWalletProvider();
            
        const actionLabel = modalDeps.resolveActionLabel({
          isConnected,
          hasSelection: Boolean(transactionData.selectedToken),
          isReady: isValid,
          selectionLabel: "Select Asset",
          notReadyLabel: "Enter Amount",
          readyLabel: "Review & Withdraw",
        });

        const formActionsProps = modalDeps.buildFormActionsProps(
          form,
          amount,
          transactionData.selectedToken?.usdPrice,
          handlePercentage,
          actionLabel,
          isSubmitDisabled,
          "from-indigo-600 to-violet-600",
          handleSubmit
        );

        return (
          <div className="flex flex-col gap-6" ref={dropdownRef}>
            <div className="grid grid-cols-2 gap-3 z-20">
              <div className="relative">
                <div className="cursor-pointer">
                  <modalDeps.CompactSelectorButton
                    onClick={() => {
                      setIsChainDropdownOpen(!isChainDropdownOpen);
                      setIsAssetDropdownOpen(false);
                    }}
                    icon={
                      <Image
                        src={modalDeps.getChainLogo(selectedChain?.chainId)}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full bg-black p-1"
                        alt={selectedChain?.name || "Chain"}
                      />
                    }
                    label="Network"
                    value={selectedChain?.name || "Select"}
                    isOpen={isChainDropdownOpen}
                  />
                </div>

                <DropdownPanel
                  isOpen={isChainDropdownOpen}
                  className="absolute top-full left-0 mt-2 w-full bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden z-30"
                >
                  <div className="p-2 space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
                    {transactionData.chainList.map(chain => (
                      <button
                        key={chain.chainId}
                        onClick={() => {
                          form.setValue("chainId", chain.chainId);
                          setIsChainDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer",
                          chainId === chain.chainId && "bg-gray-800"
                        )}
                      >
                        <Image
                          src={modalDeps.getChainLogo(chain.chainId)}
                          width={24}
                          height={24}
                          className="w-6 h-6 rounded-full"
                          alt={chain.name}
                        />
                        <span className="text-sm font-medium text-white">
                          {chain.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </DropdownPanel>
              </div>

              <div className="relative">
                <div className="cursor-pointer">
                  <modalDeps.CompactSelectorButton
                    onClick={() => {
                      setIsAssetDropdownOpen(!isAssetDropdownOpen);
                      setIsChainDropdownOpen(false);
                    }}
                    icon={
                      <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/30">
                        {transactionData.selectedToken?.symbol?.[0] || "?"}
                      </div>
                    }
                    label="Asset"
                    value={
                      transactionData.selectedToken?.symbol || "Select Asset"
                    }
                    isOpen={isAssetDropdownOpen}
                  />
                </div>

                <DropdownPanel
                  isOpen={isAssetDropdownOpen}
                  className="absolute top-full right-0 mt-2 w-[280px] bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden z-30"
                >
                  <div className="max-h-80 overflow-y-auto custom-scrollbar">
                    {CATEGORIES.map(category => {
                      const catTokens = tokensByCategory[category.id] || [];
                      if (catTokens.length === 0) return null;

                      return (
                        <div
                          key={category.id}
                          className="border-b border-gray-800 last:border-0"
                        >
                          <div className="px-4 py-2 bg-gray-950/50 text-[10px] uppercase font-bold text-gray-500 flex items-center gap-2 tracking-wider sticky top-0 z-10 backdrop-blur-sm">
                            {category.icon} {category.label}
                          </div>
                          <div className="p-1">
                            {catTokens.map(token => {
                              const isSelected =
                                transactionData.selectedToken?.address ===
                                token.address;
                              const bal =
                                transactionData.balances[token.address]
                                  ?.balance || "0";
                              return (
                                <button
                                  key={token.address}
                                  onClick={() => {
                                    form.setValue(
                                      "tokenAddress",
                                      token.address
                                    );
                                    setIsAssetDropdownOpen(false);
                                  }}
                                  className={cn(
                                    "w-full flex items-center justify-between p-2.5 rounded-lg transition-colors group cursor-pointer",
                                    isSelected
                                      ? "bg-indigo-500/10"
                                      : "hover:bg-gray-800"
                                  )}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-400 group-hover:bg-gray-700">
                                      {token.symbol[0]}
                                    </div>
                                    <div className="text-left">
                                      <div
                                        className={cn(
                                          "text-sm font-medium",
                                          isSelected
                                            ? "text-indigo-300"
                                            : "text-gray-300"
                                        )}
                                      >
                                        {token.symbol}
                                      </div>
                                      <div className="text-[10px] text-gray-500">
                                        {bal} available
                                      </div>
                                    </div>
                                  </div>
                                  {isSelected && (
                                    <Check className="w-3 h-3 text-indigo-400" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                    {tokens.length === 0 && (
                      <div className="p-6 text-center text-gray-500 text-sm">
                        No assets found.
                      </div>
                    )}
                  </div>
                </DropdownPanel>
              </div>
            </div>

            <div className="relative z-10">
              <modalDeps.TransactionFormActionsWithForm {...formActionsProps} />
            </div>
          </div>
        );
      }}
    </TransactionModalBase>
  );
}
