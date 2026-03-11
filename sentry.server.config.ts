/**
 * Sentry Server Config — Node.js runtime error monitoring
 *
 * Initializes Sentry on the server for capturing API route errors,
 * server component failures, and unhandled Node.js exceptions.
 *
 * Reference: PRD Section 23.1 (Sentry Integration)
 */
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  /* DSN from environment */
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  /* Sample all errors (personal app) */
  sampleRate: 1.0,

  /* Performance monitoring — sample 20% of server transactions */
  tracesSampleRate: 0.2,

  /* Only enable in production */
  enabled: process.env.NODE_ENV === "production",
});
