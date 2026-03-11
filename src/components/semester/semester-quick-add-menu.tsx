/**
 * Semester Quick Add Menu — Contextual menu for creating items from calendar
 *
 * Appears when user clicks an empty day cell on the semester week calendar.
 * Provides options: New Task, New Exam, Extra Class, Non-Academic Event.
 * For class-specific items (task/exam/extra class), shows a class selector step.
 *
 * Props:
 * - date: the clicked date in yyyy-MM-dd format
 * - classes: list of classes in the semester (for class-specific actions)
 * - onAction: callback with action type and optional classId when user selects
 * - onClose: callback to dismiss the menu
 *
 * Reference: PRD Section 10.2 (Quick Add), Section 12.3 (Quick Add)
 */
"use client";

import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { format, parseISO } from "date-fns";

/** Action types available from the quick-add menu */
export type QuickAddAction = "task" | "exam" | "extra-class" | "event";

interface SemesterQuickAddMenuProps {
  date: string;
  classes: Array<{ id: string; name: string; color: string }>;
  onAction: (action: QuickAddAction, classId?: string) => void;
  onClose: () => void;
}

/** Menu items for each action type */
const ACTIONS: Array<{
  key: QuickAddAction;
  label: string;
  icon: string;
  needsClass: boolean;
}> = [
  { key: "task", label: "New Task", icon: "✓", needsClass: true },
  { key: "exam", label: "New Exam", icon: "📝", needsClass: true },
  { key: "extra-class", label: "Extra Class", icon: "📚", needsClass: true },
  { key: "event", label: "Non-Academic Event", icon: "🎯", needsClass: false },
];

/**
 * SemesterQuickAddMenu — floating menu for quick creation from semester calendar.
 * Two-step flow for class-specific items: pick action → pick class.
 */
export default function SemesterQuickAddMenu({
  date,
  classes,
  onAction,
  onClose,
}: SemesterQuickAddMenuProps) {
  /* If user picks a class-specific action, we store it and show class picker */
  const [pendingAction, setPendingAction] = useState<QuickAddAction | null>(null);

  const formattedDate = format(parseISO(date), "EEEE, MMM d");

  /** Handle action button click */
  const handleActionClick = (action: QuickAddAction, needsClass: boolean) => {
    if (!needsClass) {
      /* Non-academic event doesn't need class selection */
      onAction(action);
      return;
    }

    if (classes.length === 0) {
      /* No classes — can't create class-specific items */
      return;
    }

    if (classes.length === 1) {
      /* Only one class — skip class selection */
      onAction(action, classes[0].id);
      return;
    }

    /* Multiple classes — show class picker */
    setPendingAction(action);
  };

  /** Handle class selection from picker */
  const handleClassSelect = (classId: string) => {
    if (pendingAction) {
      onAction(pendingAction, classId);
    }
  };

  return (
    <>
      {/* Backdrop — click to dismiss */}
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/40"
      />

      {/* Menu popup — centered on screen */}
      <m.div
        initial={{ opacity: 0, scale: 0.9, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 8 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-72 rounded-xl border border-border bg-surface shadow-xl overflow-hidden"
      >
        {/* Header with date */}
        <div className="px-4 py-3 border-b border-border">
          <p className="text-xs text-muted">Quick Add for</p>
          <p className="text-sm font-semibold text-foreground">
            {formattedDate}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!pendingAction ? (
            /* Step 1: Action selection */
            <m.div
              key="actions"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="p-2"
            >
              {ACTIONS.map((action) => {
                const disabled = action.needsClass && classes.length === 0;
                return (
                  <button
                    key={action.key}
                    onClick={() =>
                      handleActionClick(action.key, action.needsClass)
                    }
                    disabled={disabled}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left
                      ${
                        disabled
                          ? "text-muted/50 cursor-not-allowed"
                          : "text-foreground hover:bg-surface-elevated"
                      }
                    `}
                  >
                    <span className="text-base">{action.icon}</span>
                    <span>{action.label}</span>
                    {disabled && (
                      <span className="ml-auto text-[10px] text-muted">
                        No classes
                      </span>
                    )}
                  </button>
                );
              })}
            </m.div>
          ) : (
            /* Step 2: Class selection */
            <m.div
              key="classes"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="p-2"
            >
              {/* Back button */}
              <button
                onClick={() => setPendingAction(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted hover:text-foreground transition-colors mb-1"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Pick a class
              </button>

              {/* Class list */}
              {classes.map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => handleClassSelect(cls.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-surface-elevated transition-colors text-left"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cls.color }}
                  />
                  <span className="truncate">{cls.name}</span>
                </button>
              ))}
            </m.div>
          )}
        </AnimatePresence>
      </m.div>
    </>
  );
}
