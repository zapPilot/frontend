import { useQuery } from "@tanstack/react-query";

import { chainService } from "@/services";
import type { ChainData } from "@/types/domain/transaction";

export function useChainQuery(chainId?: number) {
  return useQuery<ChainData[] | ChainData | null>({
    queryKey: ["chain", chainId ?? "all"],
    queryFn: async () => {
      if (typeof chainId === "number") {
        const chain = await chainService.getChainById(chainId);
        // React Query v5 doesn't allow undefined - convert to null
        return chain ?? null;
      }

      return chainService.getSupportedChains();
    },
    staleTime: Infinity,
  });
}
