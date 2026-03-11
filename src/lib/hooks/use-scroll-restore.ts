/**
 * Scroll Position Restoration Hook
 *
 * Purpose: Saves scroll position when leaving a page and restores it
 * when navigating back. Uses the Zustand UI store.
 *
 * Usage: Call useScrollRestore() in any page component.
 * It will auto-save on scroll and restore on mount if navigating back.
 *
 * Reference: PRD Section 21.6 (Scroll Position Memory)
 */
"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useUIStore } from "@/lib/stores/ui-store";

/**
 * useScrollRestore — Auto-saves and restores scroll position per page.
 * Only restores when navigating "back" (direction tracked in Zustand).
 */
export function useScrollRestore() {
  const pathname = usePathname();
  const setScrollPosition = useUIStore((state) => state.setScrollPosition);
  const getScrollPosition = useUIStore((state) => state.getScrollPosition);
  const navigationDirection = useUIStore((state) => state.navigationDirection);
  const hasRestored = useRef(false);

  /* Restore scroll position on mount (only when navigating back) */
  useEffect(() => {
    if (navigationDirection === "back" && !hasRestored.current) {
      const saved = getScrollPosition(pathname);
      if (saved > 0) {
        /* Delay to let content render before scrolling */
        requestAnimationFrame(() => {
          window.scrollTo(0, saved);
        });
      }
      hasRestored.current = true;
    }
  }, [pathname, navigationDirection, getScrollPosition]);

  /* Save scroll position on scroll (debounced) */
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setScrollPosition(pathname, window.scrollY);
      }, 150);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [pathname, setScrollPosition]);
}
