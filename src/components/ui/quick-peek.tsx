/**
 * Quick Peek Preview — Desktop hover card for semester/class cards
 *
 * Component: QuickPeekPreview
 * Purpose: Shows a floating mini-preview when hovering over a card on desktop.
 * For semester cards: upcoming events, active class count, CGPA contribution.
 * For class cards: upcoming classes, attendance %, next exam.
 *
 * Props:
 * - children: The content of the floating preview
 * - className: Additional CSS classes
 *
 * Appears on: Home page (semester cards), Semester page (class cards) — desktop only
 *
 * Reference: PRD Section 9.5 (Semester hover), Section 10.5 (Class hover),
 * Section 21.11 (Quick Peek Previews)
 */
"use client";

import { type ReactNode } from "react";
import { m, AnimatePresence } from "framer-motion";

interface QuickPeekProps {
  /** Whether the peek is currently visible */
  isVisible: boolean;
  /** Content to display inside the preview card */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * QuickPeekPreview — Floating preview card shown on hover.
 * Fades in with slight upward motion. Positioned above the hovered card.
 * Only rendered on desktop (parent should conditionally render).
 */
export function QuickPeekPreview({
  isVisible,
  children,
  className = "",
}: QuickPeekProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <m.div
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className={`
            absolute z-50 left-0 right-0 bottom-full mb-2
            rounded-lg border border-border/60
            bg-surface-elevated/95 backdrop-blur-md
            shadow-xl shadow-black/30
            p-3 text-xs
            pointer-events-none
            ${className}
          `}
        >
          {children}
        </m.div>
      )}
    </AnimatePresence>
  );
}

/**
 * SemesterPeekContent — Preview content for semester cards.
 * Shows upcoming events, class count, and overall stats.
 */
export function SemesterPeekContent({
  classCount,
  upcomingExam,
  attendanceStr,
}: {
  classCount: number;
  upcomingExam?: string;
  attendanceStr?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-muted">Classes</span>
        <span className="text-foreground font-medium">{classCount}</span>
      </div>
      {upcomingExam && (
        <div className="flex items-center justify-between">
          <span className="text-muted">Next exam</span>
          <span className="text-accent-orange font-medium truncate max-w-[60%] text-right">
            {upcomingExam}
          </span>
        </div>
      )}
      {attendanceStr && (
        <div className="flex items-center justify-between">
          <span className="text-muted">Attendance</span>
          <span className="text-foreground font-medium">{attendanceStr}</span>
        </div>
      )}
    </div>
  );
}

/**
 * ClassPeekContent — Preview content for class cards.
 * Shows attendance %, next class time, and next exam.
 */
export function ClassPeekContent({
  attendancePct,
  nextClass,
  nextExam,
}: {
  attendancePct?: string;
  nextClass?: string;
  nextExam?: string;
}) {
  return (
    <div className="space-y-1.5">
      {attendancePct && (
        <div className="flex items-center justify-between">
          <span className="text-muted">Attendance</span>
          <span className="text-foreground font-medium">{attendancePct}</span>
        </div>
      )}
      {nextClass && (
        <div className="flex items-center justify-between">
          <span className="text-muted">Next class</span>
          <span className="text-foreground font-medium truncate max-w-[60%] text-right">
            {nextClass}
          </span>
        </div>
      )}
      {nextExam && (
        <div className="flex items-center justify-between">
          <span className="text-muted">Next exam</span>
          <span className="text-accent-orange font-medium truncate max-w-[60%] text-right">
            {nextExam}
          </span>
        </div>
      )}
    </div>
  );
}
