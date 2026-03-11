/**
 * useReducedMotion — Hook to detect prefers-reduced-motion
 *
 * Returns true if the user has enabled reduced motion in their OS settings.
 * Used throughout the app to disable or simplify animations per PRD §22.2:
 * "Heavy animations are disabled if the user has prefers-reduced-motion enabled."
 *
 * Usage: const prefersReduced = useReducedMotion();
 *
 * Reference: PRD Section 22.2 (Animation Performance)
 */
"use client";

import { useState, useEffect } from "react";

/** Media query string for reduced motion preference */
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * useReducedMotion — Returns true if the user prefers reduced motion.
 * Listens for changes to the OS-level accessibility setting.
 */
export function useReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(REDUCED_MOTION_QUERY);
    /* Set initial value */
    setPrefersReduced(mql.matches);

    /** Update state when the setting changes */
    const handler = (event: MediaQueryListEvent) => {
      setPrefersReduced(event.matches);
    };

    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return prefersReduced;
}
