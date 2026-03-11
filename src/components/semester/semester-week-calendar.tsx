/**
 * Semester Week Calendar — Week view showing occurrences
 *
 * Displays a simplified week calendar with class blocks for the selected week.
 * Navigation: Previous Week / This Week / Next Week.
 * Desktop: 7-column grid. Mobile: horizontal scrollable strip.
 *
 * Reference: PRD Section 10.2 (Week Calendar), Section 12 (Calendar System)
 */
"use client";

import { useMemo } from "react";
import { m } from "framer-motion";
import {
  format,
  addWeeks,
  subWeeks,
  startOfWeek,
  addDays,
  isToday,
  parseISO,
} from "date-fns";
import type { Occurrence } from "@/lib/hooks/use-occurrences";

interface SemesterWeekCalendarProps {
  occurrences: Occurrence[];
  weekStart: string;
  onWeekChange: (newStart: string) => void;
  semesterColor: string;
  /** Called when user clicks an empty area in a day column — PRD §10.2 quick-add */
  onQuickAdd?: (date: string) => void;
}

/**
 * SemesterWeekCalendar — Week view for the semester page.
 */
export default function SemesterWeekCalendar({
  occurrences,
  weekStart,
  onWeekChange,
  onQuickAdd,
}: SemesterWeekCalendarProps) {
  const weekStartDate = parseISO(weekStart);

  /* Generate 7 days of the week (Monday–Sunday) */
  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStartDate, i));
  }, [weekStartDate]);

  /* Group occurrences by date */
  const occurrencesByDate = useMemo(() => {
    const map: Record<string, Occurrence[]> = {};
    for (const occ of occurrences) {
      const key = occ.occurrenceDate;
      if (!map[key]) map[key] = [];
      map[key].push(occ);
    }
    /* Sort each day's occurrences by start time */
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return map;
  }, [occurrences]);

  /** Navigate to previous/next week */
  const goToPrevWeek = () =>
    onWeekChange(format(subWeeks(weekStartDate, 1), "yyyy-MM-dd"));
  const goToNextWeek = () =>
    onWeekChange(format(addWeeks(weekStartDate, 1), "yyyy-MM-dd"));
  const goToThisWeek = () =>
    onWeekChange(
      format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd")
    );

  return (
    <div className="rounded-xl border border-border dotted-surface-elevated overflow-hidden">
      {/* Header — Week navigation */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button
          onClick={goToPrevWeek}
          className="p-1.5 rounded hover:bg-surface-elevated transition-colors"
          aria-label="Previous week"
        >
          <svg
            className="w-4 h-4 text-muted"
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
        </button>

        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-foreground">
            {format(weekStartDate, "MMM d")} —{" "}
            {format(addDays(weekStartDate, 6), "MMM d, yyyy")}
          </h3>
          <button
            onClick={goToThisWeek}
            className="text-xs text-accent-purple hover:text-accent-purple/80 transition-colors"
          >
            Today
          </button>
        </div>

        <button
          onClick={goToNextWeek}
          className="p-1.5 rounded hover:bg-surface-elevated transition-colors"
          aria-label="Next week"
        >
          <svg
            className="w-4 h-4 text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Day columns — 7-column grid desktop, horizontal scroll mobile */}
      <div className="grid grid-cols-7 gap-px bg-border/30 overflow-x-auto">
        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayOccurrences = occurrencesByDate[dateKey] || [];
          const today = isToday(day);

          return (
            <div
              key={dateKey}
              onClick={() => dayOccurrences.length === 0 && onQuickAdd?.(dateKey)}
              className={`
                min-w-[100px] p-2 min-h-[100px] cursor-pointer hover:bg-surface-elevated/30 transition-colors
                ${today ? "bg-accent-purple/5" : "bg-surface/30"}
              `}
            >
              {/* Day header */}
              <div className="text-center mb-2">
                <p className="text-[10px] text-muted uppercase">
                  {format(day, "EEE")}
                </p>
                <p
                  className={`
                    text-sm font-medium
                    ${today ? "text-accent-purple" : "text-foreground"}
                  `}
                >
                  {format(day, "d")}
                </p>
              </div>

              {/* Occurrence blocks for this day */}
              <div className="space-y-1">
                {dayOccurrences.map((occ) => (
                  <OccurrenceBlock key={occ.id} occurrence={occ} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Individual occurrence block in the week calendar.
 * Shows class name + time, color-coded by class.
 */
function OccurrenceBlock({ occurrence }: { occurrence: Occurrence }) {
  const color = occurrence.class_?.color || "#a855f7";
  const isCancelled = occurrence.status === "cancelled";

  /* Format time compactly */
  const formatCompactTime = (time: string) => {
    const [h, m] = time.split(":");
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "p" : "a";
    return `${hour % 12 || 12}:${m}${ampm}`;
  };

  return (
    <m.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        rounded px-1.5 py-1 text-[10px]
        ${isCancelled ? "opacity-40 line-through" : ""}
      `}
      style={{
        backgroundColor: `${color}20`,
        borderLeft: `2px solid ${color}`,
      }}
    >
      <p className="font-medium text-foreground truncate">
        {occurrence.class_?.name || "Class"}
      </p>
      <p className="text-muted">
        {formatCompactTime(occurrence.startTime)}
      </p>
    </m.div>
  );
}
