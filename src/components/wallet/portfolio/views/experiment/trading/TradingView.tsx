"use client";

import { VariationC } from "./variations/VariationC";
import { EmptyStateCard } from "@/components/ui/EmptyStateCard";
import { AlertCircle } from "lucide-react";

interface TradingViewProps {
  userId: string | undefined;
}

export function TradingView({ userId }: TradingViewProps) {
  if (!userId) {
    return (
      <EmptyStateCard
        icon={AlertCircle}
        message="Connect wallet to access trading"
      />
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <VariationC userId={userId} />
    </div>
  );
}
