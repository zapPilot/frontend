"use client";

import { TradingView } from "./trading/TradingView";

interface ExperimentViewProps {
  userId: string | undefined;
}

export function ExperimentView({ userId }: ExperimentViewProps) {
  return <TradingView userId={userId} />;
}
