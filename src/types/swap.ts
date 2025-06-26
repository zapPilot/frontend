import { InvestmentOpportunity } from "./investment";

export interface SwapToken {
  symbol: string;
  name: string;
  balance: number;
  price: number;
  icon?: string;
}

export interface SwapState {
  fromToken: SwapToken | null;
  toStrategy: InvestmentOpportunity | null;
  fromAmount: string;
  toAmount: string;
  slippage: number;
  isLoading: boolean;
}

export interface SwapRoute {
  inputAmount: string;
  outputAmount: string;
  priceImpact: number;
  minimumReceived: string;
  fee: number;
  route: string[];
}