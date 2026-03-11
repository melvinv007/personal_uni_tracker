/**
 * Last Visited Page Hook
 *
 * Purpose: Tracks the last visited page in the Zustand UI store.
 * Updates on every page navigation. Used for "Continue where you left off".
 *
 * Reference: PRD Section 8.2 (Last Visited Page Persistence)
 */
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useUIStore } from "@/lib/stores/ui-store";

/**
 * useLastVisitedPage — Updates last visited page on navigation.
 * Call once in the root layout or providers component.
 */
export function useLastVisitedPage() {
  const pathname = usePathname();
  const setLastVisitedPage = useUIStore((state) => state.setLastVisitedPage);

  useEffect(() => {
    /* Don't track auth pages */
    if (!pathname.startsWith("/auth")) {
      setLastVisitedPage(pathname);
    }
  }, [pathname, setLastVisitedPage]);
}
