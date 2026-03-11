/**
 * Toast Notification System
 *
 * Component: ToastContainer, toast utilities
 * Purpose: Global toast notifications for success, error, and undo actions.
 * Appears on: Every page (global, rendered in Providers)
 *
 * Design: Slides in from bottom-right, auto-dismiss after 4 seconds.
 * Undo toasts have a 5-second countdown progress bar.
 *
 * Reference: https://21st.dev/reapollo/success-toast-notification/default
 * PRD Section 21.2 (Toast Notifications)
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";

/** Toast variant determines styling and behavior */
type ToastVariant = "success" | "error" | "undo";

/** Shape of a toast notification */
interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  /** Duration in ms before auto-dismiss (default: 4000) */
  duration?: number;
  /** Callback for undo action (only for 'undo' variant) */
  onUndo?: () => void;
  /** Callback for retry action (only for 'error' variant) */
  onRetry?: () => void;
}

/** Toast store — simple module-level state with subscribers */
let toasts: Toast[] = [];
let listeners: Array<() => void> = [];

/** Notify all subscribers of state change */
function notifyListeners() {
  listeners.forEach((listener) => listener());
}

/**
 * Show a toast notification.
 * Supports two calling patterns:
 * - showToast({ message, variant, ... }) — full config object
 * - showToast("message", "variant") — shorthand for simple toasts
 */
export function showToast(
  toastOrMessage: Omit<Toast, "id"> | string,
  variant?: ToastVariant
) {
  const toast: Omit<Toast, "id"> =
    typeof toastOrMessage === "string"
      ? { message: toastOrMessage, variant: variant || "success" }
      : toastOrMessage;

  const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  toasts = [...toasts, { ...toast, id }];
  notifyListeners();

  /* Auto-dismiss — PRD: toasts auto-dismiss after 4 seconds */
  const duration = toast.variant === "undo" ? 5000 : (toast.duration ?? 4000);
  setTimeout(() => {
    dismissToast(id);
  }, duration);
}

/** Remove a toast by id */
export function dismissToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  notifyListeners();
}

/**
 * ToastContainer Component
 *
 * Renders all active toasts in a fixed position at bottom-right.
 * Uses Framer Motion AnimatePresence for enter/exit animations.
 */
export function ToastContainer() {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>([]);

  useEffect(() => {
    /* Subscribe to toast state changes */
    const listener = () => setCurrentToasts([...toasts]);
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      <AnimatePresence mode="popLayout">
        {currentToasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
}

/**
 * Individual toast item with animation and variant styling.
 */
function ToastItem({ toast }: { toast: Toast }) {
  const handleDismiss = useCallback(() => {
    dismissToast(toast.id);
  }, [toast.id]);

  const handleUndo = useCallback(() => {
    toast.onUndo?.();
    dismissToast(toast.id);
  }, [toast]);

  const handleRetry = useCallback(() => {
    toast.onRetry?.();
    dismissToast(toast.id);
  }, [toast]);

  /* Variant-specific styles */
  const variantStyles = {
    success: "border-accent-green/30 bg-accent-green/10",
    error: "border-accent-red/30 bg-accent-red/10",
    undo: "border-accent-amber/30 bg-accent-amber/10",
  };

  const variantIcon = {
    success: "✓",
    error: "✕",
    undo: "↩",
  };

  return (
    <m.div
      /* Slide in from bottom-right — PRD Section 5.4 */
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`
        relative overflow-hidden rounded-lg border px-4 py-3
        dotted-surface-elevated backdrop-blur-sm
        ${variantStyles[toast.variant]}
      `}
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <span className="text-sm font-bold opacity-80">
          {variantIcon[toast.variant]}
        </span>

        {/* Message */}
        <p className="text-sm text-foreground flex-1">{toast.message}</p>

        {/* Action buttons */}
        {toast.variant === "undo" && toast.onUndo && (
          <button
            onClick={handleUndo}
            className="text-sm font-medium text-accent-amber hover:text-accent-amber/80 transition-colors"
          >
            Undo
          </button>
        )}

        {toast.variant === "error" && toast.onRetry && (
          <button
            onClick={handleRetry}
            className="text-sm font-medium text-accent-red hover:text-accent-red/80 transition-colors"
          >
            Retry
          </button>
        )}

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="text-muted hover:text-foreground transition-colors text-xs ml-1"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>

      {/* Undo countdown progress bar — PRD Section 5.4 */}
      {toast.variant === "undo" && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-amber/20">
          <m.div
            className="h-full bg-accent-amber"
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: 5, ease: "linear" }}
          />
        </div>
      )}
    </m.div>
  );
}
