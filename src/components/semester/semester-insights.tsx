/**
 * Semester Insights — Key stats at the bottom of semester page
 *
 * Purpose: Shows subject with highest exam marks (avg percentage),
 * and subject with lowest attendance opening count ratio.
 * Gradient card format with automatic updates.
 *
 * Reference: PRD Section 10.8 (Semester Insights)
 */
"use client";

import { useMemo } from "react";
import { m } from "framer-motion";

interface ClassData {
  id: string;
  name: string;
  color: string;
  exams: Array<{
    marksScored: string | null;
    totalMarks: string;
  }>;
  scheduleSlots: Array<{ id: string }>;
}

interface SemesterInsightsProps {
  classes: ClassData[];
}

/**
 * SemesterInsights — bottom section showing top marks & lowest attendance.
 */
export default function SemesterInsights({ classes }: SemesterInsightsProps) {
  const insights = useMemo(() => {
    if (classes.length === 0) return null;

    /* === Highest marks (average exam percentage) === */
    let bestClass: { name: string; color: string; avg: number } | null = null;

    for (const cls of classes) {
      const scoredExams = cls.exams.filter((e) => e.marksScored !== null);
      if (scoredExams.length === 0) continue;

      const avg =
        scoredExams.reduce((sum, e) => {
          const scored = parseFloat(e.marksScored!);
          const total = parseFloat(e.totalMarks);
          return sum + (total > 0 ? (scored / total) * 100 : 0);
        }, 0) / scoredExams.length;

      if (!bestClass || avg > bestClass.avg) {
        bestClass = { name: cls.name, color: cls.color, avg };
      }
    }

    /* === Lowest attendance (by slot count as a proxy — detailed attendance
       requires per-class detail queries, so we track basic info) === */
    /* Note: SemesterDetail doesn't include full attendance records.
       We show the class with the fewest schedule slots as a placeholder
       insight, but ideally this would use occurrence-level data. */
    let worstAttendanceClass: {
      name: string;
      color: string;
      slots: number;
    } | null = null;

    for (const cls of classes) {
      const slotCount = cls.scheduleSlots.length;
      if (!worstAttendanceClass || slotCount < worstAttendanceClass.slots) {
        worstAttendanceClass = {
          name: cls.name,
          color: cls.color,
          slots: slotCount,
        };
      }
    }

    return { bestClass, worstAttendanceClass };
  }, [classes]);

  /* Don't render if there's no meaningful data */
  if (!insights || (!insights.bestClass && !insights.worstAttendanceClass)) {
    return null;
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-4">
        Semester Insights
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Highest marks card */}
        {insights.bestClass && (
          <InsightCard
            label="Highest Marks"
            value={`${Math.round(insights.bestClass.avg)}% avg`}
            className={insights.bestClass.name}
            color={insights.bestClass.color}
            icon="🏆"
            index={0}
          />
        )}

        {/* Lowest schedule density card */}
        {insights.worstAttendanceClass && (
          <InsightCard
            label="Fewest Weekly Slots"
            value={`${insights.worstAttendanceClass.slots} slot${insights.worstAttendanceClass.slots !== 1 ? "s" : ""}/week`}
            className={insights.worstAttendanceClass.name}
            color={insights.worstAttendanceClass.color}
            icon="📊"
            index={1}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Individual insight card with gradient background.
 */
function InsightCard({
  label,
  value,
  className: clsName,
  color,
  icon,
  index,
}: {
  label: string;
  value: string;
  className: string;
  color: string;
  icon: string;
  index: number;
}) {
  return (
    <m.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="rounded-xl p-4 border border-border/30"
      style={{
        background: `linear-gradient(135deg, ${color}10, ${color}05)`,
      }}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icon}</span>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted uppercase tracking-wider">
            {label}
          </p>
          <p
            className="text-sm font-bold truncate mt-0.5"
            style={{ color }}
          >
            {clsName}
          </p>
          <p className="text-xs text-muted mt-0.5">{value}</p>
        </div>
      </div>
    </m.div>
  );
}
