/**
 * Notification Permission Card — Request push notification access
 *
 * Purpose: Shows a dismissible card prompting the user to enable
 * notifications for deadline reminders. Appears on the home page
 * when permission hasn't been granted yet.
 *
 * States:
 * - "default": Show enable button
 * - "denied": Show "blocked" message with instructions
 * - "granted": Hidden (permission already given)
 * - "unsupported": Hidden (browser doesn't support)
 *
 * Reference: PRD Section 19.1 (Permission Request UI)
 */
"use client";

import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { useNotifications } from "@/lib/hooks/use-notifications";

/**
 * NotificationPermissionCard — Inline prompt for notification access.
 */
export default function NotificationPermissionCard() {
  const { isSupported, permission, isPending, requestPermission } =
    useNotifications();
  const [dismissed, setDismissed] = useState(false);

  /* Don't render if unsupported, already granted, or dismissed */
  if (!isSupported || permission === "granted" || dismissed) return null;

  return (
    <AnimatePresence>
      <m.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="rounded-lg border border-border bg-surface-elevated p-4"
      >
        <div className="flex items-start gap-3">
          {/* Bell icon */}
          <div className="shrink-0 mt-0.5">
            <svg
              className="w-5 h-5 text-accent-purple"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </div>

          <div className="flex-1">
            {permission === "denied" ? (
              <>
                <p className="text-sm font-medium text-foreground">
                  Notifications blocked
                </p>
                <p className="text-xs text-muted mt-1">
                  To enable deadline reminders, allow notifications in your
                  browser settings.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-foreground">
                  Enable assignment deadline reminders
                </p>
                <p className="text-xs text-muted mt-1">
                  Get notified when an assignment is due within 24 hours
                  and hasn&apos;t been submitted yet.
                </p>
                <button
                  onClick={requestPermission}
                  disabled={isPending}
                  className="mt-2 text-xs font-medium text-accent-purple hover:text-accent-purple/80 transition-colors disabled:opacity-50"
                >
                  {isPending ? "Requesting..." : "Enable notifications"}
                </button>
              </>
            )}
          </div>

          {/* Dismiss button */}
          <button
            onClick={() => setDismissed(true)}
            className="shrink-0 text-muted hover:text-foreground transition-colors"
            aria-label="Dismiss"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </m.div>
    </AnimatePresence>
  );
}
