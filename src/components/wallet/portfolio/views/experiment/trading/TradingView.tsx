"use client";

import { useState } from "react";
import { Monitor, CreditCard, LayoutTemplate } from "lucide-react";
import { EmptyStateCard } from "@/components/ui/EmptyStateCard";
import { AlertCircle } from "lucide-react";

import { VariationA } from "./variations/VariationA";
import { VariationB } from "./variations/VariationB";
import { VariationC } from "./variations/VariationC";
import { cn } from "@/lib/ui/classNames";

interface TradingViewProps {
  userId: string | undefined;
}

function VariationSwitcher({
  active,
  onChange,
}: {
  active: string;
  onChange: (v: string) => void;
}) {
  const variations = [
    { id: "A", label: "Pro Terminal", icon: Monitor },
    { id: "B", label: "Visual Cards", icon: CreditCard },
    { id: "C", label: "Minimalist", icon: LayoutTemplate },
  ];

  return (
    <div className="flex justify-center mb-8">
      <div className="bg-gray-900 p-1 rounded-lg border border-gray-800 flex gap-1">
        {variations.map(v => (
          <button
            key={v.id}
            onClick={() => onChange(v.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
              active === v.id
                ? "bg-gray-800 text-white shadow-sm ring-1 ring-white/10"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
            )}
          >
            <v.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{v.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function TradingView({ userId }: TradingViewProps) {
  const [variation, setVariation] = useState("A");

  if (!userId) {
    return (
      <EmptyStateCard
        icon={AlertCircle}
        message="Connect wallet to access trading"
      />
    );
  }

  return (
    <div>
      <VariationSwitcher active={variation} onChange={setVariation} />

      <div className="animate-in fade-in duration-500">
        {variation === "A" && <VariationA userId={userId} />}
        {variation === "B" && <VariationB userId={userId} />}
        {variation === "C" && <VariationC userId={userId} />}
      </div>
    </div>
  );
}
