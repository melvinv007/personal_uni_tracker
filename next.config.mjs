/**
 * Next.js Configuration — with Sentry integration
 *
 * Wraps the base Next.js config with @sentry/nextjs for:
 * - Automatic source map upload to Sentry
 * - Server-side error capturing
 * - Client-side error capturing
 *
 * Reference: PRD Section 23.1 (Sentry Integration)
 */
import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* Enable instrumentation hook for Sentry server init */
  experimental: {
    instrumentationHook: true,
  },
};

export default withSentryConfig(nextConfig, {
  /* Sentry org and project — set via env vars or Sentry CLI */
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  /* Upload source maps for readable stack traces in production */
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },

  /* Suppress noisy Sentry build logs */
  silent: !process.env.CI,

  /* Disable Sentry telemetry */
  telemetry: false,
});
