"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useState } from "react";
import { Toaster } from "~/components/ui/sonner";
import { AuthProvider } from "~/hooks/use-auth";

import { trpc } from "~/trpc/client";
import { createTRPCHttpBatchClientClient } from "~/trpc/create-client";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Cache data for 60 seconds before considering it stale
        staleTime: 60 * 1000,
        // Keep unused data in cache for 5 minutes
        gcTime: 5 * 60 * 1000,
        // Retry once on failure (not for 4xx errors)
        retry: (failureCount, error) => {
          if (failureCount >= 1) return false;
          // Don't retry client errors (auth, validation, not found)
          const status = (error as any)?.data?.httpStatus;
          if (status && status < 500) return false;
          return true;
        },
        refetchOnWindowFocus: false,
        refetchOnMount: true,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always create a new QueryClient
    return makeQueryClient();
  }
  // Browser: reuse the same client between renders
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}

export const GlobalProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [createTRPCHttpBatchClientClient()],
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <trpc.Provider queryClient={queryClient} client={trpcClient}>
          {children}
          <Toaster richColors position="top-right" />
        </trpc.Provider>
      </AuthProvider>
    </QueryClientProvider>
  );
};
