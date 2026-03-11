/**
 * Instrumentation Hook — Next.js server-side initialization
 *
 * This file is automatically loaded by Next.js on server startup.
 * It registers Sentry for server and edge runtimes.
 *
 * Reference: PRD Section 23.1 (Sentry Integration)
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    /* Import Sentry server config for Node.js runtime */
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    /* Import Sentry edge config for Edge runtime */
    await import("../sentry.edge.config");
  }
}
