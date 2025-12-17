import type { ChainData } from "@/types/domain/transaction";

export const MOCK_CHAIN_DATA: ChainData[] = [
  {
    chainId: 1,
    name: "Ethereum",
    symbol: "ETH",
    iconUrl: "/chains/eth.svg",
    isActive: true,
  },
  {
    chainId: 137,
    name: "Polygon",
    symbol: "MATIC",
    iconUrl: "/chains/polygon.svg",
    isActive: true,
  },
  {
    chainId: 42161,
    name: "Arbitrum",
    symbol: "ARB",
    iconUrl: "/chains/arbitrum.svg",
    isActive: false,
  },
];

const delay = (ms = 120) => new Promise(resolve => setTimeout(resolve, ms));

export async function getSupportedChains(): Promise<ChainData[]> {
  await delay();
  return MOCK_CHAIN_DATA;
}

export async function getChainById(chainId: number): Promise<ChainData | undefined> {
  await delay();
  return MOCK_CHAIN_DATA.find(chain => chain.chainId === chainId);
}
