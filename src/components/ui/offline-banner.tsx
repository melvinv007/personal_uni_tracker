/**
 * Offline Banner Component
 *
 * Component: OfflineBanner
 * Purpose: Shows a clear banner when internet connection is lost.
 * Warns the user that changes will not be saved.
 *
 * Appears on: Top of every page (global, rendered in Providers or layout)
 *
 * Reference: PRD Section 21.8 (Network Failure Handling)
 */
"use client";

import { useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import { useUIStore } from "@/lib/stores/ui-store";

/**
 * OfflineBanner — Animated alert banner for offline status.
 * Listens to browser online/offline events and updates Zustand store.
 */
export function OfflineBanner() {
  const { isOnline, setOnline } = useUIStore();

  useEffect(() => {
    /* Listen to browser online/offline events */
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    /* Set initial state */
    setOnline(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setOnline]);

  return (
    <AnimatePresence>
      {!isOnline && (
        <m.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="
            fixed top-0 left-0 right-0 z-50
            bg-accent-amber/20 border-b border-accent-amber/30
            px-4 py-2 text-center
          "
        >
          <p className="text-sm text-accent-amber font-medium">
            You&apos;re offline. Changes will not be saved.
          </p>
        </m.div>
      )}
    </AnimatePresence>
  );
}
