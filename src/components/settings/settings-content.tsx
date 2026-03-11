/**
 * Settings Content — Client Component
 *
 * Component: SettingsContent
 * Purpose: Main settings page content with data export functionality,
 * notification preferences, and account information.
 *
 * Props:
 * - user: { email: string; id: string } — authenticated user info
 *
 * Appears on: /settings page
 *
 * Reference: PRD Section 24 (Data Export), Section 19.1 (Notifications)
 */
"use client";

import { useState, useCallback } from "react";
import { m } from "framer-motion";
import { BackButton } from "@/components/ui/back-button";
import { useNotifications } from "@/lib/hooks/use-notifications";
import { showToast } from "@/components/ui/toast";

interface SettingsContentProps {
  /** Authenticated user information from server component */
  user: { email: string; id: string };
}

/** Possible export states for the download buttons */
type ExportState = "idle" | "loading" | "success" | "error";

/**
 * SettingsContent — Full settings page with export, notifications, and account sections.
 *
 * Export flow:
 * 1. User clicks JSON or CSV export button
 * 2. Fetch /api/export?format=json|csv
 * 3. Create Blob from response and trigger download
 * 4. Show success/error toast
 */
export default function SettingsContent({ user }: SettingsContentProps) {
  /* Export button states — tracked separately for JSON and CSV */
  const [jsonState, setJsonState] = useState<ExportState>("idle");
  const [csvState, setCsvState] = useState<ExportState>("idle");

  /* Notification management hook */
  const { isSupported, permission, isPending, requestPermission } =
    useNotifications();

  /**
   * handleExport — Triggers a data export download.
   * Fetches from /api/export with the specified format,
   * creates a Blob URL, and programmatically clicks a download link.
   */
  const handleExport = useCallback(
    async (format: "json" | "csv") => {
      const setState = format === "json" ? setJsonState : setCsvState;
      setState("loading");

      try {
        const res = await fetch(`/api/export?format=${format}`);
        if (!res.ok) {
          throw new Error(`Export failed with status ${res.status}`);
        }

        /* Read response as blob for file download */
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);

        /* Extract filename from Content-Disposition header or generate fallback */
        const disposition = res.headers.get("Content-Disposition");
        const filenameMatch = disposition?.match(/filename="(.+)"/);
        const filename =
          filenameMatch?.[1] ||
          `tracker-export-${new Date().toISOString().split("T")[0]}.${format}`;

        /* Create a temporary anchor element and trigger download */
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();

        /* Cleanup: revoke blob URL and remove temp anchor */
        URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setState("success");
        showToast(
          `${format.toUpperCase()} export downloaded successfully`,
          "success"
        );

        /* Reset button state after 2 seconds */
        setTimeout(() => setState("idle"), 2000);
      } catch {
        setState("error");
        showToast("Export failed. Please try again.", "error");
        setTimeout(() => setState("idle"), 3000);
      }
    },
    []
  );

  return (
    <div className="min-h-screen px-4 py-6 lg:px-8 lg:py-8 max-w-3xl mx-auto">
      {/* Back navigation */}
      <BackButton label="Settings" />

      {/* Page title */}
      <m.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold text-foreground mt-6 mb-8"
      >
        Settings
      </m.h1>

      {/* Data Export Section — PRD §24.2 */}
      <m.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <h2 className="text-lg font-semibold text-foreground mb-2">
          Data Export
        </h2>
        <p className="text-sm text-muted mb-4">
          Download a backup of all your academic data. JSON includes everything
          in a restorable format. CSV exports attendance, tasks, and exams for
          spreadsheets.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* JSON Export Button */}
          <m.button
            whileTap={{ scale: 0.97 }}
            onClick={() => handleExport("json")}
            disabled={jsonState === "loading"}
            className="
              flex items-center justify-center gap-2 px-5 py-3 rounded-lg
              border border-border bg-surface hover:bg-surface-elevated
              text-foreground font-medium transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {/* Download icon */}
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            {jsonState === "loading"
              ? "Exporting..."
              : jsonState === "success"
                ? "Downloaded!"
                : "Export JSON"}
          </m.button>

          {/* CSV Export Button */}
          <m.button
            whileTap={{ scale: 0.97 }}
            onClick={() => handleExport("csv")}
            disabled={csvState === "loading"}
            className="
              flex items-center justify-center gap-2 px-5 py-3 rounded-lg
              border border-border bg-surface hover:bg-surface-elevated
              text-foreground font-medium transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {/* Spreadsheet icon */}
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
              />
            </svg>
            {csvState === "loading"
              ? "Exporting..."
              : csvState === "success"
                ? "Downloaded!"
                : "Export CSV"}
          </m.button>
        </div>
      </m.section>

      {/* Divider */}
      <div className="border-t border-border/30 mb-8" />

      {/* Notifications Section — PRD §19.1 */}
      <m.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <h2 className="text-lg font-semibold text-foreground mb-2">
          Notifications
        </h2>
        <p className="text-sm text-muted mb-4">
          Get push notifications when an assignment deadline is within 24 hours
          and hasn&apos;t been submitted yet.
        </p>

        {/* Notification permission status and toggle */}
        {isSupported ? (
          <div className="flex items-center gap-4">
            {/* Status indicator */}
            <div
              className={`
                px-3 py-1.5 rounded-full text-xs font-medium
                ${
                  permission === "granted"
                    ? "bg-accent-green/10 text-accent-green"
                    : permission === "denied"
                      ? "bg-accent-red/10 text-accent-red"
                      : "bg-surface-elevated text-muted"
                }
              `}
            >
              {permission === "granted"
                ? "Enabled"
                : permission === "denied"
                  ? "Blocked"
                  : "Not enabled"}
            </div>

            {/* Action button based on current permission state */}
            {permission === "default" && (
              <m.button
                whileTap={{ scale: 0.97 }}
                onClick={requestPermission}
                disabled={isPending}
                className="
                  px-4 py-2 rounded-lg text-sm font-medium
                  bg-accent-purple/10 text-accent-purple
                  hover:bg-accent-purple/20 transition-colors
                  disabled:opacity-50
                "
              >
                {isPending ? "Requesting..." : "Enable Notifications"}
              </m.button>
            )}

            {permission === "denied" && (
              <p className="text-xs text-muted">
                Notifications are blocked. Update your browser settings to allow
                notifications for this site.
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted/60">
            Push notifications are not supported in this browser.
          </p>
        )}
      </m.section>

      {/* Divider */}
      <div className="border-t border-border/30 mb-8" />

      {/* Account Section */}
      <m.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-8"
      >
        <h2 className="text-lg font-semibold text-foreground mb-2">Account</h2>
        <p className="text-sm text-muted mb-4">
          Signed in via Google OAuth. Your data is stored securely in Supabase.
        </p>

        <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border/50 bg-surface">
          {/* User avatar placeholder — first letter of email */}
          <div className="w-9 h-9 rounded-full bg-accent-purple/20 flex items-center justify-center text-accent-purple font-semibold text-sm">
            {user.email.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{user.email}</p>
            <p className="text-xs text-muted">Google OAuth</p>
          </div>
        </div>
      </m.section>
    </div>
  );
}
