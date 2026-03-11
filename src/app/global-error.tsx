/**
 * Global Error Page — Next.js App Router root error boundary
 *
 * Catches unhandled errors at the root layout level.
 * Reports errors to Sentry and shows a user-friendly fallback UI.
 *
 * Reference: PRD Section 23.2 (Error Boundaries)
 */
"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * GlobalError — Root-level error boundary.
 * Captures the error in Sentry and provides a reset button.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    /* Report the error to Sentry */
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-bold text-foreground mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-muted mb-6">
            An unexpected error occurred. The issue has been reported automatically.
          </p>
          <button
            onClick={reset}
            className="
              px-5 py-2.5 rounded-lg font-medium text-sm
              bg-accent-purple/10 text-accent-purple
              hover:bg-accent-purple/20 transition-colors
            "
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
