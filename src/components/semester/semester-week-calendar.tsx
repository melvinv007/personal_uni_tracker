/**
 * Semester Week Calendar — FullCalendar week view for semester page
 *
 * Uses the shared WeekCalendar wrapper to show hourly labels and
 * proportional event heights based on actual duration.
 */
"use client";

import { useMemo } from "react";
import {
  format,
  addDays,
  addWeeks,
  subWeeks,
  startOfWeek,
  parseISO,
} from "date-fns";
import DynamicWeekCalendar from "@/components/calendar/dynamic-week-calendar";
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

  const calendarEvents = useMemo(
    () =>
      occurrences.map((occ) => ({
        id: occ.id,
        title: `${occ.class_?.name || "Class"}${occ.isExtra ? " (Extra)" : ""}`,
        start: `${occ.occurrenceDate}T${occ.startTime}`,
        end: `${occ.occurrenceDate}T${occ.endTime}`,
        color: occ.class_?.color || "#a855f7",
        type: occ.status === "cancelled"
          ? ("cancelled" as const)
          : occ.isExtra
            ? ("extra" as const)
            : ("class" as const),
      })),
    [occurrences]
  );

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

      <div className="p-3">
        <DynamicWeekCalendar
          key={weekStart}
          events={calendarEvents}
          initialDate={weekStart}
          onDateSelect={(start) => onQuickAdd?.(format(start, "yyyy-MM-dd"))}
          showToolbar={false}
          height={560}
        />
      </div>
    </div>
  );
}
