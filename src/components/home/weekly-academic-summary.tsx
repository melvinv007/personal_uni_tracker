/**
 * Weekly Academic Summary — Sunday-only stats card
 *
 * Component: WeeklyAcademicSummary
 * Purpose: Shows a summary of the academic week — classes attended,
 * tasks completed, assignments submitted, exams taken, missed classes.
 * Only visible on Sundays (00:00–23:59).
 *
 * Props:
 * - activeSemesterId: ID of the current active semester
 *
 * Appears on: Home page, right panel, below day view calendar
 *
 * Reference: PRD Section 9.8 (Weekly Academic Summary),
 * Section 17.6 (Analytics — Weekly Summary)
 */
"use client";

import { useState, useEffect, useMemo } from "react";
import { m } from "framer-motion";
import { startOfWeek, endOfWeek, isWithinInterval, getDay } from "date-fns";
import { useSemester } from "@/lib/hooks/use-semesters";
import { GlowingCard } from "@/components/ui/glowing-card";

interface WeeklyAcademicSummaryProps {
  /** Active semester ID — needed to fetch data */
  activeSemesterId?: string;
}

/** Counter stat item with animated count-up */
function CountStat({ label, value, color }: { label: string; value: number; color: string }) {
  const [displayValue, setDisplayValue] = useState(0);

  /* Animated count-up on mount — PRD §5.3 (stats count-up on viewport entry) */
  useEffect(() => {
    if (value === 0) return;
    const duration = 600; /* ms */
    const steps = 20;
    const increment = value / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(interval);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, [value]);

  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted">{label}</span>
      <span className={`text-sm font-bold ${color}`}>{displayValue}</span>
    </div>
  );
}

/**
 * WeeklyAcademicSummary — Only renders on Sundays.
 * Shows weekly academic metrics with animated count-up.
 */
export default function WeeklyAcademicSummary({
  activeSemesterId,
}: WeeklyAcademicSummaryProps) {
  /* Only render on Sundays — PRD §9.8 says "visible only on Sundays" */
  const today = new Date();
  const isSunday = getDay(today) === 0;

  /* Fetch semester detail for tasks/exams data */
  const { data: semesterDetail } = useSemester(activeSemesterId || "");

  /* Calculate this week's date range (Mon–Sun) */
  const weekRange = useMemo(() => {
    const start = startOfWeek(today, { weekStartsOn: 1 }); /* Monday */
    const end = endOfWeek(today, { weekStartsOn: 1 }); /* Sunday */
    return { start, end };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today.toDateString()]);

  /* Aggregate weekly stats from semester data */
  const stats = useMemo(() => {
    if (!semesterDetail) {
      return { attended: 0, missed: 0, tasksCompleted: 0, assignmentsSubmitted: 0, examsTaken: 0 };
    }

    /* Tasks completed this week */
    const tasksCompleted = (semesterDetail.tasks || []).filter((t) => {
      if (!t.isCompleted || !t.deadline) return false;
      const dl = new Date(t.deadline);
      return isWithinInterval(dl, weekRange);
    }).length;

    /* Assignments submitted this week (tasks with isAssignment + completed) */
    const assignmentsSubmitted = (semesterDetail.tasks || []).filter((t) => {
      if (!t.isAssignment || !t.isCompleted || !t.deadline) return false;
      const dl = new Date(t.deadline);
      return isWithinInterval(dl, weekRange);
    }).length;

    /* Exams taken this week */
    const examsTaken = (semesterDetail.classes || []).reduce((count, cls) => {
      return count + (cls.exams || []).filter((e) => {
        const ed = new Date(e.examDate);
        return isWithinInterval(ed, weekRange);
      }).length;
    }, 0);

    return {
      attended: 0, /* Attendance requires occurrence data — calculated separately */
      missed: 0,
      tasksCompleted,
      assignmentsSubmitted,
      examsTaken,
    };
  }, [semesterDetail, weekRange]);

  /* Don't render if not Sunday or no active semester */
  if (!isSunday || !activeSemesterId) return null;

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mt-6"
    >
      <GlowingCard color="#a855f7" className="p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Weekly Summary
        </h3>

        <div className="space-y-2">
          <CountStat label="Tasks completed" value={stats.tasksCompleted} color="text-accent-green" />
          <CountStat label="Assignments submitted" value={stats.assignmentsSubmitted} color="text-accent-blue" />
          <CountStat label="Exams taken" value={stats.examsTaken} color="text-accent-orange" />
        </div>

        <p className="text-[10px] text-muted/50 mt-3">
          Resets every Monday
        </p>
      </GlowingCard>
    </m.div>
  );
}
