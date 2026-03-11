/**
 * Empty State Component
 *
 * Component: EmptyState
 * Purpose: Placeholder shown when a section has no data.
 * Dashed border card with glowing "+" icon and descriptive text.
 *
 * Props:
 * - message: Description text (e.g. "Add your first semester to get started")
 * - onAction: Optional click handler (clicking the card triggers creation)
 * - icon: Optional custom icon (defaults to glowing "+")
 *
 * Appears on: Every page — no semesters, no classes, no tasks, etc.
 *
 * Reference: PRD Section 9.6 (Empty State), Section 21.3 (Empty States)
 */
"use client";

import { type ReactNode } from "react";
import { m } from "framer-motion";

interface EmptyStateProps {
  /** Descriptive message text */
  message: string;
  /** Optional click handler to trigger creation action */
  onAction?: () => void;
  /** Optional custom icon — defaults to glowing "+" */
  icon?: ReactNode;
}

/**
 * EmptyState — Dashed-border placeholder card with call to action.
 * Clicking anywhere on the card triggers the creation modal.
 */
export function EmptyState({ message, onAction, icon }: EmptyStateProps) {
  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onClick={onAction}
      className={`
        flex flex-col items-center justify-center
        rounded-xl border-2 border-dashed border-border/50
        bg-surface/30 backdrop-blur-sm
        p-8 min-h-[160px]
        ${onAction ? "cursor-pointer hover:border-border hover:bg-surface/50" : ""}
        transition-all duration-300
      `}
    >
      {/* Glowing "+" icon — PRD Section 9.6 */}
      {icon ?? (
        <m.div
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="text-4xl font-light text-accent-purple mb-3"
        >
          +
        </m.div>
      )}

      {/* Description text — small, muted, low opacity — PRD Section 3.3 */}
      <p className="text-sm text-muted text-center">{message}</p>
    </m.div>
  );
}
