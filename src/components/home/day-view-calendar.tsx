/**
 * Day View Calendar — Right panel on Home page
 *
 * Shows a day view of today's schedule (classes, events, tasks).
 * Navigation: Previous Day / Today / Next Day.
 * Shows "No classes today" empty state.
 * If no active semester is set, shows a prompt to activate one.
 *
 * Reference: PRD Section 9.7 (Day View Calendar — Right Panel)
 */
"use client";

import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { format, addDays, subDays, isToday, parseISO } from "date-fns";
import { useDayOccurrences } from "@/lib/hooks/use-occurrences";

interface DayViewCalendarProps {
  date: string;
  onDateChange: (date: string) => void;
  activeSemesterId?: string;
}

/**
 * DayViewCalendar — compact day schedule for the home page.
 */
export default function DayViewCalendar({
  date,
  onDateChange,
  activeSemesterId,
}: DayViewCalendarProps) {
  const { data: occurrences, isLoading } = useDayOccurrences(date);
  const [direction, setDirection] = useState(0);

  const dateObj = parseISO(date);
  const isCurrentDay = isToday(dateObj);

  /** Navigate to previous day */
  const goToPrev = () => {
    setDirection(-1);
    onDateChange(format(subDays(dateObj, 1), "yyyy-MM-dd"));
  };

  /** Navigate to next day */
  const goToNext = () => {
    setDirection(1);
    onDateChange(format(addDays(dateObj, 1), "yyyy-MM-dd"));
  };

  /** Jump to today */
  const goToToday = () => {
    setDirection(0);
    onDateChange(format(new Date(), "yyyy-MM-dd"));
  };

  /* Filter to only scheduled/extra occurrences (not cancelled) */
  const visibleOccurrences = (occurrences || [])
    .filter((o) => o.status !== "cancelled")
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="rounded-xl border border-border dotted-surface-elevated overflow-hidden">
      {/* Header — Date + Navigation */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <button
            onClick={goToPrev}
            className="p-1 rounded hover:bg-surface-elevated transition-colors"
            aria-label="Previous day"
          >
            <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">
              {format(dateObj, "EEEE")}
            </p>
            <p className="text-xs text-muted">
              {format(dateObj, "MMMM d, yyyy")}
            </p>
          </div>

          <button
            onClick={goToNext}
            className="p-1 rounded hover:bg-surface-elevated transition-colors"
            aria-label="Next day"
          >
            <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Today button — only shown when not viewing today */}
        {!isCurrentDay && (
          <button
            onClick={goToToday}
            className="w-full mt-2 text-xs text-accent-purple hover:text-accent-purple/80 transition-colors"
          >
            Jump to Today
          </button>
        )}
      </div>

      {/* Schedule list */}
      <div className="p-4 min-h-[200px]">
        {!activeSemesterId ? (
          /* No active semester state */
          <div className="flex flex-col items-center justify-center h-[200px] text-center">
            <p className="text-sm text-muted">No active semester</p>
            <p className="text-xs text-muted/60 mt-1">
              Set a semester as active to see your schedule
            </p>
          </div>
        ) : isLoading ? (
          /* Loading state */
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-14 rounded-lg bg-surface-elevated animate-pulse"
              />
            ))}
          </div>
        ) : visibleOccurrences.length === 0 ? (
          /* No classes today */
          <div className="flex flex-col items-center justify-center h-[200px] text-center">
            <p className="text-sm text-muted">No classes today</p>
            <p className="text-xs text-muted/60 mt-1">Enjoy your free time</p>
          </div>
        ) : (
          /* Occurrence list */
          <AnimatePresence mode="popLayout" custom={direction}>
            <m.div
              key={date}
              custom={direction}
              initial={{ opacity: 0, x: direction * 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-2"
            >
              {visibleOccurrences.map((occ) => (
                <OccurrenceItem key={occ.id} occurrence={occ} />
              ))}
            </m.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

/**
 * Single occurrence item in the day view schedule.
 */
function OccurrenceItem({
  occurrence,
}: {
  occurrence: {
    id: string;
    startTime: string;
    endTime: string;
    status: string;
    isExtra: boolean;
    class_?: { name: string; color: string };
    attendance?: Array<{ status: string }>;
  };
}) {
  const className = occurrence.class_?.name || "Unknown Class";
  const color = occurrence.class_?.color || "#a855f7";
  const hasAttendance = occurrence.attendance && occurrence.attendance.length > 0;
  const attendanceStatus = hasAttendance ? occurrence.attendance![0].status : null;

  /* Format time to display */
  const formatTime = (time: string) => {
    const [h, m] = time.split(":");
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${m} ${ampm}`;
  };

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg bg-surface-elevated/50 hover:bg-surface-elevated transition-colors"
    >
      {/* Color bar */}
      <div
        className="w-1 h-10 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-foreground truncate">
            {className}
          </p>
          {occurrence.isExtra && (
            <span className="text-[10px] px-1 py-0.5 rounded bg-accent-blue/20 text-accent-blue">
              Extra
            </span>
          )}
        </div>
        <p className="text-xs text-muted">
          {formatTime(occurrence.startTime)} — {formatTime(occurrence.endTime)}
        </p>
      </div>

      {/* Attendance indicator */}
      {attendanceStatus && (
        <div className="shrink-0">
          {attendanceStatus === "present" && (
            <div className="w-5 h-5 rounded-full bg-accent-green/20 flex items-center justify-center">
              <svg className="w-3 h-3 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          {attendanceStatus === "absent" && (
            <div className="w-5 h-5 rounded-full bg-accent-red/20 flex items-center justify-center">
              <svg className="w-3 h-3 text-accent-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
