/**
 * Floating Action Button (FAB) Component
 *
 * Component: FAB
 * Purpose: Context-aware floating action button fixed at bottom-right.
 * Changes available actions based on the current page.
 *
 * Props:
 * - actions: Array of action items ({ label, icon, onClick })
 * - singleAction: For pages with one action (e.g. home page: create semester)
 *
 * Appears on: Every page
 *
 * Behavior:
 * - Home page: Single action → create semester
 * - Semester page: Single action → create class
 * - Class page: Expands into menu (task, assignment, exam, extra class)
 *
 * Reference: PRD Section 8.3 (FAB), Section 5.4 (FAB press animation)
 */
"use client";

import { type ReactNode, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import { useUIStore } from "@/lib/stores/ui-store";

/** Individual FAB action item */
interface FABAction {
  label: string;
  icon: ReactNode;
  onClick: () => void;
}

interface FABProps {
  /** Array of actions — if multiple, shows expandable menu */
  actions: FABAction[];
}

/**
 * FAB — Floating Action Button with spring animation.
 * Single action: triggers directly on click.
 * Multiple actions: expands into a staggered menu on click.
 */
export function FAB({ actions }: FABProps) {
  const { isFabOpen, toggleFab, closeFab } = useUIStore();

  const handleAction = useCallback(
    (action: FABAction) => {
      action.onClick();
      closeFab();
    },
    [closeFab]
  );

  /* Single action — direct click */
  if (actions.length === 1) {
    return (
      <m.button
        onClick={() => handleAction(actions[0])}
        /* Spring scale bounce on press — PRD Section 8.3 */
        whileTap={{ scale: 0.85 }}
        whileHover={{ scale: 1.05 }}
        className="
          fixed bottom-6 right-6 z-40
          w-14 h-14 rounded-full
          bg-accent-purple text-white
          flex items-center justify-center
          shadow-lg shadow-accent-purple/30
          hover:shadow-xl hover:shadow-accent-purple/40
          transition-shadow duration-300
        "
        aria-label={actions[0].label}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </m.button>
    );
  }

  /* Multiple actions — expandable menu */
  return (
    <>
      {/* Backdrop when menu is open */}
      <AnimatePresence>
        {isFabOpen && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30"
            onClick={closeFab}
          />
        )}
      </AnimatePresence>

      {/* Action menu */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col-reverse items-end gap-3">
        {/* Expandable action items — staggered entrance */}
        <AnimatePresence>
          {isFabOpen &&
            actions.map((action, index) => (
              <m.button
                key={action.label}
                /* Staggered entrance — PRD Section 8.3 */
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                transition={{
                  delay: index * 0.05,
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAction(action)}
                className="
                  flex items-center gap-2 px-4 py-2.5 rounded-full
                  bg-surface border border-border
                  text-foreground text-sm font-medium
                  shadow-lg hover:bg-surface-hover
                  transition-colors
                "
              >
                {action.icon}
                {action.label}
              </m.button>
            ))}
        </AnimatePresence>

        {/* Main FAB button */}
        <m.button
          onClick={toggleFab}
          whileTap={{ scale: 0.85 }}
          whileHover={{ scale: 1.05 }}
          animate={{ rotate: isFabOpen ? 45 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="
            w-14 h-14 rounded-full
            bg-accent-purple text-white
            flex items-center justify-center
            shadow-lg shadow-accent-purple/30
            hover:shadow-xl hover:shadow-accent-purple/40
            transition-shadow duration-300
          "
          aria-label="Create new item"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </m.button>
      </div>
    </>
  );
}
