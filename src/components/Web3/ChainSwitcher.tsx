"use client";

import { AnimatePresence } from "framer-motion";
import { ChevronDown, Loader2, Network } from "lucide-react";
import Image from "next/image";
import { memo, useState } from "react";
import {
  useActiveWalletChain,
  useSwitchActiveWalletChain,
} from "thirdweb/react";

import { AnimatedDropdown } from "@/components/ui/AnimatedDropdown";
// Import from unified chain configuration
import { getThirdWebChains } from "@/config/chains";
import { Z_INDEX } from "@/constants/design-system";
import { useDropdown } from "@/hooks/useDropdown";
import type { ButtonVariant } from "@/types/ui/ui.types";
import { chainLogger } from "@/utils/logger";

const SUPPORTED_CHAINS = getThirdWebChains();

interface ChainSwitcherProps {
  className?: string;
  disabled?: boolean;
  variant?: Extract<ButtonVariant, "primary" | "secondary">;
}

export const ChainSwitcher = memo(function ChainSwitcher({
  className = "",
  disabled = false,
  variant = "primary",
}: ChainSwitcherProps) {
  const activeChain = useActiveWalletChain();
  const switchChain = useSwitchActiveWalletChain();
  const dropdown = useDropdown(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const handleChainSwitch = async (chainId: number) => {
    if (chainId === activeChain?.id) {
      dropdown.close();
      return;
    }

    setIsSwitching(true);
    try {
      const targetChain = SUPPORTED_CHAINS.find(chain => chain.id === chainId);
      if (targetChain) {
        await switchChain(targetChain);
      }
    } catch (error) {
      chainLogger.error("Chain switch failed", error);
    } finally {
      setIsSwitching(false);
      dropdown.close();
    }
  };

  const getChainIcon = (chainId: number) => {
    const iconMap: Record<number, string> = {
      42161:
        "https://zap-assets-worker.davidtnfsh.workers.dev/chainPicturesWebp/arbitrum.webp",
      8453: "https://zap-assets-worker.davidtnfsh.workers.dev/chainPicturesWebp/base.webp", // Base
      10: "https://zap-assets-worker.davidtnfsh.workers.dev/chainPicturesWebp/optimism.webp", // Optimism
    };
    return (
      iconMap[chainId] ||
      "https://zap-assets-worker.davidtnfsh.workers.dev/chainPicturesWebp/base.webp"
    );
  };

  const getChainName = (chainId: number) => {
    const chain = SUPPORTED_CHAINS.find(c => c.id === chainId);
    return chain?.name || `Chain ${chainId}`;
  };

  const buttonVariant =
    variant === "primary"
      ? "glass-morphism hover:bg-purple-500/30 text-white border-purple-500/20"
      : "glass-morphism hover:bg-white/20 text-white border-white/20";

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={dropdown.toggle}
        disabled={disabled || isSwitching}
        className={`
          w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-all duration-200
          ${buttonVariant}
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        <div className="flex items-center gap-2">
          {isSwitching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : activeChain ? (
            <Image
              src={getChainIcon(activeChain.id)}
              alt={getChainName(activeChain.id)}
              width={20}
              height={20}
              className="rounded-full"
            />
          ) : (
            <Network className="h-4 w-4" />
          )}
          <span className="text-sm font-medium">
            {activeChain ? getChainName(activeChain.id) : "Select Chain"}
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${dropdown.isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {dropdown.isOpen && (
          <AnimatedDropdown
            className={`absolute top-full left-0 right-0 mt-2 glass-morphism border border-gray-700 rounded-lg shadow-lg ${Z_INDEX.TOAST} backdrop-blur-md`}
          >
            <div className="p-2 space-y-1">
              {SUPPORTED_CHAINS.map(chain => (
                <button
                  key={chain.id}
                  onClick={() => handleChainSwitch(chain.id)}
                  disabled={isSwitching}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200
                    ${
                      activeChain?.id === chain.id
                        ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                        : "text-gray-300 hover:bg-white/10 hover:text-white"
                    }
                    disabled:opacity-50
                  `}
                >
                  <Image
                    src={getChainIcon(chain.id)}
                    alt={chain.name || `Chain ${chain.id}`}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                  <span className="text-sm font-medium">
                    {chain.name || `Chain ${chain.id}`}
                  </span>
                  {activeChain?.id === chain.id && (
                    <span className="ml-auto flex items-center">
                      <span
                        className="w-2 h-2 bg-purple-400 rounded-full"
                        title="Active"
                      ></span>
                    </span>
                  )}
                </button>
              ))}
            </div>
          </AnimatedDropdown>
        )}
      </AnimatePresence>
    </div>
  );
});
