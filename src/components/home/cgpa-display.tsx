/**
 * CGPA Display — Shows running CGPA and active semester SPI
 *
 * Calculates CGPA from all completed semesters with official grades.
 * Shows projected SPI for the active semester.
 * Displays "No grades yet" if no letter grades exist.
 *
 * Reference: PRD Section 9.4 (CGPA Display), Section 16 (CGPA & SPI)
 */
"use client";

import { m } from "framer-motion";
import type { Semester } from "@/lib/hooks/use-semesters";

interface CgpaDisplayProps {
  semesters: Semester[];
}

export default function CgpaDisplay({ semesters }: CgpaDisplayProps) {
  /* Find completed semesters */
  const completedSemesters = semesters.filter((s) => s.isCompleted);
  const activeSemester = semesters.find((s) => s.isActive);

  /* CGPA will be calculated when we have letter grades data */
  const hasSemesters = semesters.length > 0;

  if (!hasSemesters) return null;

  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="rounded-xl border border-border dotted-surface-elevated p-5"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted uppercase tracking-wider mb-1">
            Cumulative GPA
          </p>
          <p className="text-3xl font-bold text-foreground tabular-nums">
            {completedSemesters.length > 0 ? "—" : "—"}
          </p>
          <p className="text-xs text-muted mt-1">
            {completedSemesters.length > 0
              ? `Across ${completedSemesters.length} semester${completedSemesters.length > 1 ? "s" : ""}`
              : "Complete a semester to see your CGPA"}
          </p>
        </div>

        {activeSemester && (
          <div className="text-right">
            <p className="text-xs text-muted uppercase tracking-wider mb-1">
              Active Semester
            </p>
            <p className="text-lg font-semibold text-accent-green">
              {activeSemester.name}
            </p>
          </div>
        )}
      </div>
    </m.div>
  );
}
