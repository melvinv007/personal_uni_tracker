/**
 * Sentry Client Config — Browser-side error monitoring
 *
 * Initializes Sentry in the browser for capturing unhandled exceptions,
 * console errors, and performance traces on the client.
 *
 * Reference: PRD Section 23.1 (Sentry Integration)
 */
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  /* DSN from environment — never hardcoded */
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  /* Sample 100% of errors (personal app, low traffic) */
  sampleRate: 1.0,

  /* Performance monitoring — sample 20% of transactions */
  tracesSampleRate: 0.2,

  /* Replay configuration — capture sessions on error */
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,

  /* Only enable in production */
  enabled: process.env.NODE_ENV === "production",

  /* Filter out noisy errors that aren't actionable */
  ignoreErrors: [
    /* Browser extensions and third-party scripts */
    "ResizeObserver loop",
    "Network request failed",
    "Load failed",
    /* Service worker registration failures on unsupported browsers */
    "ServiceWorker",
  ],
});
