/**
 * Loading States Component
 *
 * Component: LoadingDots, LoadingSkeleton
 * Purpose: Loading indicators used throughout the app.
 *
 * Appears on: All pages during data fetching
 *
 * Reference: https://21st.dev/jakobhoeg/message-loading/default
 * PRD Section 4 (Message Loading component)
 */
"use client";

import { m } from "framer-motion";

/**
 * LoadingDots — Three animated bouncing dots.
 * Used for inline loading states (e.g. button loading, message loading).
 */
export function LoadingDots() {
  return (
    <div className="flex items-center gap-1.5" role="status" aria-label="Loading">
      {[0, 1, 2].map((i) => (
        <m.span
          key={i}
          className="w-2 h-2 rounded-full bg-accent-purple"
          animate={{ y: [0, -6, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/**
 * LoadingSkeleton — Pulsing skeleton placeholder.
 * Used for content area loading states.
 */
export function LoadingSkeleton({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-surface ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

/**
 * PageLoader — Full page loading state with dots.
 * Shown during initial page data fetch.
 */
export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <LoadingDots />
    </div>
  );
}
