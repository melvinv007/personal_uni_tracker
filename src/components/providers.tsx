/**
 * Providers Component
 *
 * Purpose: Wraps the entire application with all required context providers.
 * This is a client component because TanStack Query and Framer Motion
 * require client-side React context.
 *
 * Providers included:
 * - TanStack QueryClientProvider for caching & optimistic updates
 * - Framer Motion LazyMotion for tree-shaking animation features
 * - Toast container for global notifications
 *
 * Reference: PRD Section 2 (Tech Stack), Section 22.2 (Animation Performance)
 */
"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LazyMotion, domAnimation } from "framer-motion";
import { ToastContainer } from "@/components/ui/toast";
import { GlobalHooks } from "./global-hooks";

/** Configure TanStack Query client with aggressive caching and background refetch */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        /* Data stays fresh for 30 seconds before background refetch */
        staleTime: 30 * 1000,
        /* Cache persists for 5 minutes */
        gcTime: 5 * 60 * 1000,
        /* Retry failed requests once */
        retry: 1,
        /* Refetch on window focus for freshness */
        refetchOnWindowFocus: true,
      },
      mutations: {
        /* Retry mutations once on failure */
        retry: 1,
      },
    },
  });
}

export function Providers({ children }: { children: React.ReactNode }) {
  /* Create query client once per session — avoids re-creating on every render */
  const [queryClient] = useState(() => makeQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {/* LazyMotion with domAnimation feature set minimizes bundle size — PRD Section 22.2 */}
      <LazyMotion features={domAnimation} strict>
        <GlobalHooks />
        {children}
        {/* Global toast container — PRD Section 21.2 */}
        <ToastContainer />
      </LazyMotion>
    </QueryClientProvider>
  );
}
