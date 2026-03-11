/**
 * Page Transition Wrapper
 *
 * Component: PageTransition
 * Purpose: Wraps page content to provide iOS-style push slide transitions.
 * Forward navigation slides from right, back slides out to right.
 *
 * Uses Framer Motion AnimatePresence with direction-aware variants.
 * Direction is tracked in the Zustand UI store.
 *
 * Reference: PRD Section 5.1 (Page Transitions), ~300ms ease-in-out
 */
"use client";

import { type ReactNode } from "react";
import { m } from "framer-motion";
import { useUIStore } from "@/lib/stores/ui-store";

interface PageTransitionProps {
  children: ReactNode;
  /** Unique key for AnimatePresence (usually the route path) */
  pageKey: string;
}

/**
 * iOS-style push slide page transition variants.
 * Forward: enters from right (+20px), exits to left (-20px)
 * Back: enters from left (-20px), exits to right (+20px)
 */
const variants = {
  forward: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
  back: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
};

/**
 * PageTransition — Animated wrapper for route content.
 * Reads navigation direction from Zustand to determine animation.
 */
export function PageTransition({ children, pageKey }: PageTransitionProps) {
  const direction = useUIStore((state) => state.navigationDirection);
  const variant = variants[direction];

  return (
    <m.div
      key={pageKey}
      initial={variant.initial}
      animate={variant.animate}
      exit={variant.exit}
      transition={{
        duration: 0.3,
        ease: "easeInOut",
      }}
    >
      {children}
    </m.div>
  );
}
