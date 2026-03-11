/**
 * Error Boundary Component
 *
 * Component: ErrorBoundary
 * Purpose: Catches unhandled React errors per page section.
 * Shows a fallback UI without crashing the entire page.
 *
 * Appears on: Wraps each major page section
 *
 * Reference: PRD Section 23.2 (Error Boundaries)
 */
"use client";

import { Component, type ReactNode, type ErrorInfo } from "react";
import * as Sentry from "@sentry/nextjs";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional custom fallback UI */
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary — Catches rendering errors in child components.
 * Displays a recovery message instead of crashing the page.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    /* Report to Sentry in production, log to console in development */
    Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex flex-col items-center justify-center p-8 rounded-xl border border-border/50 bg-surface/30">
            <p className="text-sm text-muted mb-3">
              Something went wrong. Try refreshing.
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="text-sm text-accent-purple hover:text-accent-purple/80 transition-colors"
            >
              Try again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
