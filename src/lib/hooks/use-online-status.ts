/**
 * Online Status Detection Hook
 *
 * Purpose: Tracks online/offline status and updates the Zustand UI store.
 * Shows offline banner when connection is lost.
 *
 * Reference: PRD Section 21.8 (Offline Detection)
 */
"use client";

import { useEffect } from "react";
import { useUIStore } from "@/lib/stores/ui-store";
import { showToast } from "@/components/ui/toast";

/**
 * useOnlineStatus — Listens to browser online/offline events.
 * Updates the Zustand store which triggers the OfflineBanner visibility.
 * Shows a toast when connection is restored.
 */
export function useOnlineStatus() {
  const setOnline = useUIStore((state) => state.setOnline);

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      showToast("Back online", "success");
    };

    const handleOffline = () => {
      setOnline(false);
    };

    /* Set initial state */
    setOnline(navigator.onLine);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setOnline]);
}
