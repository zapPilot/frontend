import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";

const fallbackQueryClient = new QueryClient();

function useHasQueryClient() {
  try {
    useQueryClient();
    return true;
  } catch {
    return false;
  }
}

export const QueryClientBoundary = ({ children }: PropsWithChildren) => {
  const hasClient = useHasQueryClient();

  return hasClient ? (
    <>{children}</>
  ) : (
    <QueryClientProvider client={fallbackQueryClient}>
      {children}
    </QueryClientProvider>
  );
};
