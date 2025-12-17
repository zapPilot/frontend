"use client";

import Image from "next/image";

import type { ChainData } from "@/types/domain/transaction";

interface ChainSelectorProps {
  chains: ChainData[];
  selectedChainId: number | null;
  onSelect: (chainId: number) => void;
}

export function ChainSelector({
  chains,
  selectedChainId,
  onSelect,
}: ChainSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
            Select Chain
          </p>
          <p className="text-sm text-gray-400">
            Multi-chain ready. Disabled chains are marked as coming soon.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {chains.map(chain => {
          const isSelected = chain.chainId === selectedChainId;
          return (
            <button
              key={chain.chainId}
              type="button"
              data-testid={`chain-card-${chain.chainId}`}
              aria-pressed={isSelected}
              aria-label={`Select ${chain.name}`}
              onClick={() => onSelect(chain.chainId)}
              disabled={!chain.isActive}
              className={`relative rounded-xl border p-3 text-left transition-all duration-150 ${
                isSelected
                  ? "border-purple-500/60 bg-purple-500/10 shadow-lg shadow-purple-500/20"
                  : "border-gray-800 bg-gray-900/50 hover:border-purple-500/30 hover:bg-gray-900/80"
              } ${!chain.isActive ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-gray-800 flex items-center justify-center">
                  {chain.iconUrl ? (
                    <Image
                      src={chain.iconUrl}
                      alt={`${chain.name} icon`}
                      width={24}
                      height={24}
                    />
                  ) : (
                    <span className="text-lg font-bold text-white">
                      {chain.symbol.slice(0, 2)}
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-white font-semibold leading-tight">
                    {chain.name}
                  </div>
                  <div className="text-xs text-gray-500">{chain.symbol}</div>
                </div>
              </div>
              {!chain.isActive ? (
                <span className="mt-2 inline-flex items-center rounded-full bg-gray-800 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  Coming Soon
                </span>
              ) : (
                <span className="mt-2 inline-flex items-center rounded-full bg-green-500/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-green-300">
                  Active
                </span>
              )}
              {isSelected && (
                <span className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-purple-500/80 via-blue-500/80 to-purple-500/80" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
