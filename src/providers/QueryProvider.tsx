"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useEffect, useState } from "react";

import { queryClient } from "@/lib/state/queryClient";

type ReactQueryDevtoolsComponent =
  typeof import("@tanstack/react-query-devtools")["ReactQueryDevtools"];

interface QueryProviderProps {
  children: ReactNode;
}

const enableDevtools =
  process.env.NODE_ENV === "development" &&
  process.env["NEXT_PUBLIC_ENABLE_RQ_DEVTOOLS"] === "1";

function QueryDevtoolsLoader() {
  const [Devtools, setDevtools] = useState<ReactQueryDevtoolsComponent | null>(
    null
  );

  useEffect(() => {
    if (!enableDevtools) {
      return;
    }

    let isMounted = true;

    void import("@tanstack/react-query-devtools").then(mod => {
      if (isMounted) {
        setDevtools(() => mod.ReactQueryDevtools);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!enableDevtools || !Devtools) {
    return null;
  }

  return <Devtools initialIsOpen={false} position="bottom" />;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <QueryDevtoolsLoader />
    </QueryClientProvider>
  );
}
