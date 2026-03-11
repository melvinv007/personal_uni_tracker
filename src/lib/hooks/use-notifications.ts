/**
 * useNotifications — Hook for notification permission and scheduling
 *
 * Purpose: Manages notification permission state, requests access,
 * registers the service worker, and checks for unsubmitted assignment
 * deadlines on page load.
 *
 * Per PRD §19.2, the ONLY notification in v1 is:
 * Assignment deadline < 24hrs AND is_submitted = false.
 *
 * Reference: PRD Section 19 (Notifications)
 */
"use client";

import { useEffect, useState, useCallback } from "react";
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  registerServiceWorker,
  checkAndNotifyAssignmentDeadlines,
} from "@/lib/utils/notifications";
import { showToast } from "@/components/ui/toast";

/** Notification permission state for components */
export interface NotificationState {
  isSupported: boolean;
  permission: NotificationPermission | "unsupported";
  isPending: boolean;
}

/**
 * useNotifications — Manages push notification lifecycle.
 * Auto-registers service worker on mount if permission is granted.
 */
export function useNotifications() {
  const [state, setState] = useState<NotificationState>({
    isSupported: false,
    permission: "unsupported",
    isPending: false,
  });

  /* Check support and permission on mount */
  useEffect(() => {
    const supported = isNotificationSupported();
    setState({
      isSupported: supported,
      permission: supported ? getNotificationPermission() : "unsupported",
      isPending: false,
    });

    /* Auto-register service worker if already granted */
    if (supported && Notification.permission === "granted") {
      registerServiceWorker();
    }
  }, []);

  /** Request permission from the user */
  const requestPermission = useCallback(async () => {
    setState((prev) => ({ ...prev, isPending: true }));

    const result = await requestNotificationPermission();

    setState((prev) => ({
      ...prev,
      permission: result,
      isPending: false,
    }));

    if (result === "granted") {
      await registerServiceWorker();
      showToast("Notifications enabled", "success");
    } else if (result === "denied") {
      showToast("Notifications blocked — enable in browser settings", "error");
    }

    return result;
  }, []);

  /**
   * Check for unsubmitted assignments approaching deadline and notify.
   * PRD §19.2: Only assignments with deadline < 24hrs and is_submitted = false.
   */
  const checkAssignmentDeadlines = useCallback(
    (
      assignments: Array<{
        name: string;
        deadline: string | null;
        isAssignment: boolean | null;
        isSubmitted: boolean | null;
        isCompleted: boolean | null;
        classId: string | null;
        semesterId: string;
      }>
    ) => {
      if (state.permission !== "granted") return;
      checkAndNotifyAssignmentDeadlines(assignments);
    },
    [state.permission]
  );

  return {
    ...state,
    requestPermission,
    checkAssignmentDeadlines,
  };
}
