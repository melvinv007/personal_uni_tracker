/**
 * Delete Confirmation Dialog
 *
 * Component: DeleteConfirmation
 * Purpose: Confirmation dialog shown before any delete action.
 * After deletion, shows a 5-second undo toast.
 *
 * Props:
 * - isOpen: Controls visibility
 * - onClose: Close callback
 * - onConfirm: Delete action callback
 * - itemName: Name of the item being deleted
 *
 * Appears on: All edit modals (every record type has delete inside edit modal)
 *
 * Reference: PRD Section 20.9 (Delete Confirmation), Section 21.5 (Edit & Delete)
 */
"use client";

import { m, AnimatePresence } from "framer-motion";

interface DeleteConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
}

/**
 * DeleteConfirmation — Modal dialog with shake animation and confirm/cancel.
 * Shake animation on the item before dialog appears — PRD Section 5.5.
 */
export function DeleteConfirmation({
  isOpen,
  onClose,
  onConfirm,
  itemName,
}: DeleteConfirmationProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Dialog */}
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
            <m.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="
                w-full max-w-sm pointer-events-auto
                rounded-xl border border-accent-red/30
                dotted-surface-elevated
                shadow-2xl p-5
              "
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base font-semibold text-foreground mb-2">
                Delete {itemName}?
              </h3>
              <p className="text-sm text-muted mb-5">
                {itemName} will be permanently deleted. This cannot be undone.
              </p>

              <div className="flex gap-3 justify-end">
                <m.button
                  whileTap={{ scale: 0.97 }}
                  onClick={onClose}
                  className="px-4 py-2 text-sm rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
                >
                  Cancel
                </m.button>
                <m.button
                  whileTap={{ scale: 0.97 }}
                  onClick={onConfirm}
                  className="px-4 py-2 text-sm rounded-lg bg-accent-red/20 text-accent-red border border-accent-red/30 hover:bg-accent-red/30 transition-colors"
                >
                  Delete
                </m.button>
              </div>
            </m.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
