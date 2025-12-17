import { useQuery } from "@tanstack/react-query";

import { chainService } from "@/services";
import type { ChainData } from "@/types/domain/transaction";

export function useChainQuery(chainId?: number) {
  return useQuery<ChainData[] | ChainData | undefined>({
    queryKey: ["chain", chainId ?? "all"],
    queryFn: () => {
      if (typeof chainId === "number") {
        return chainService.getChainById(chainId);
      }

      return chainService.getSupportedChains();
    },
    staleTime: Infinity,
  });
}
