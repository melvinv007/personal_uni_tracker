/**
 * Sentry Edge Config — Edge runtime error monitoring
 *
 * Initializes Sentry for Edge functions (middleware, edge API routes).
 *
 * Reference: PRD Section 23.1 (Sentry Integration)
 */
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  /* DSN from environment */
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  /* Sample all errors */
  sampleRate: 1.0,

  /* Performance monitoring — sample 20% */
  tracesSampleRate: 0.2,

  /* Only enable in production */
  enabled: process.env.NODE_ENV === "production",
});
