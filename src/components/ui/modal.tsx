/**
 * Modal Component
 *
 * Component: Modal
 * Purpose: Base modal used for all creation and edit forms across the app.
 * Renders content in an overlay with spring animation.
 *
 * Props:
 * - isOpen: Controls visibility
 * - onClose: Close callback
 * - title: Modal header text
 * - children: Modal body content (form fields)
 *
 * Appears on: Every page (semester create, class create, task create, exam create, etc.)
 *
 * Design:
 * - Desktop: Scale from center with spring transition
 * - Mobile: Slide up from bottom
 * - Dotted surface background inside modal
 * - Focus trap for accessibility
 *
 * Reference: https://21st.dev/reapollo/basic-modal/default
 * PRD Section 5.4 (Modal animations), Section 20.1 (Forms in modals)
 */
"use client";

import { type ReactNode, useEffect, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Optional max width class (default: max-w-lg) */
  maxWidth?: string;
}

/**
 * Modal — Spring-animated overlay dialog for all forms.
 * All input boxes and form backgrounds use the dotted surface — PRD Section 20.2.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "max-w-lg",
}: ModalProps) {
  /* Close on Escape key */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      /* Prevent body scroll when modal is open */
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <m.div
              /* Desktop: scale from center. Mobile: slide up from bottom */
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={`
                w-full ${maxWidth} pointer-events-auto
                rounded-xl border border-border
                dotted-surface-elevated
                shadow-2xl shadow-black/50
                max-h-[85vh] overflow-y-auto
              `}
              /* Prevent clicks inside modal from closing it */
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-border/50">
                <h2 className="text-lg font-semibold text-foreground">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="text-muted hover:text-foreground transition-colors p-1 rounded-lg hover:bg-surface-hover"
                  aria-label="Close modal"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Body — forms render here */}
              <div className="p-5">{children}</div>
            </m.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
