/**
 * Semester Week Calendar — FullCalendar week view for semester page
 *
 * Desktop (lg+): FullCalendar timeGridWeek with hourly labels and
 * proportional event heights.
 * Mobile (<lg): Swipeable day strip with event list below.
 *
 * Reference: PRD Section 10.2, BF-07
 */
"use client";

import { useState, useMemo } from "react";
import {
  format,
  addDays,
  addWeeks,
  subWeeks,
  startOfWeek,
  parseISO,
  isToday,
  isSameDay,
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

/** Day label abbreviations for the strip */
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/**
 * SemesterWeekCalendar — Week view for the semester page.
 * Responsive: FullCalendar on desktop, day strip on mobile.
 */
export default function SemesterWeekCalendar({
  occurrences,
  weekStart,
  onWeekChange,
  onQuickAdd,
}: SemesterWeekCalendarProps) {
  const weekStartDate = parseISO(weekStart);

  /* Selected day for mobile day strip — defaults to today if within this week, else Monday */
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      if (isSameDay(addDays(weekStartDate, i), today)) return i;
    }
    return 0;
  });

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

  /** Get the 7 day dates for this week */
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStartDate, i)),
    [weekStartDate]
  );

  /** Filter occurrences for the selected day (mobile view) */
  const selectedDate = weekDays[selectedDayIndex];
  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
  const dayOccurrences = useMemo(
    () =>
      occurrences
        .filter((occ) => occ.occurrenceDate === selectedDateStr)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [occurrences, selectedDateStr]
  );

  /** Navigate to previous/next week */
  const goToPrevWeek = () => {
    onWeekChange(format(subWeeks(weekStartDate, 1), "yyyy-MM-dd"));
    setSelectedDayIndex(0);
  };
  const goToNextWeek = () => {
    onWeekChange(format(addWeeks(weekStartDate, 1), "yyyy-MM-dd"));
    setSelectedDayIndex(0);
  };
  const goToThisWeek = () => {
    const thisMonday = startOfWeek(new Date(), { weekStartsOn: 1 });
    onWeekChange(format(thisMonday, "yyyy-MM-dd"));
    /* Select today */
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      if (isSameDay(addDays(thisMonday, i), today)) {
        setSelectedDayIndex(i);
        return;
      }
    }
    setSelectedDayIndex(0);
  };

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

      {/* Desktop: FullCalendar week grid (hidden on mobile) */}
      <div className="hidden lg:block p-3">
        <DynamicWeekCalendar
          key={weekStart}
          events={calendarEvents}
          initialDate={weekStart}
          onDateSelect={(start) => onQuickAdd?.(format(start, "yyyy-MM-dd"))}
          showToolbar={false}
          height={560}
        />
      </div>

      {/* Mobile: Day strip + event list (hidden on desktop) — BF-07 */}
      <div className="block lg:hidden">
        {/* Day button strip */}
        <div className="flex border-b border-border">
          {weekDays.map((day, i) => {
            const isSelected = i === selectedDayIndex;
            const isDayToday = isToday(day);
            return (
              <button
                key={i}
                onClick={() => setSelectedDayIndex(i)}
                className={`
                  flex-1 py-3 flex flex-col items-center gap-0.5 transition-colors relative
                  ${isSelected
                    ? "bg-accent-purple/10 text-accent-purple"
                    : "text-muted hover:text-foreground hover:bg-surface-elevated/50"
                  }
                `}
              >
                <span className="text-[10px] font-medium uppercase">
                  {DAY_LABELS[i]}
                </span>
                <span
                  className={`
                    text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full
                    ${isDayToday && !isSelected ? "bg-accent-purple/20 text-accent-purple" : ""}
                    ${isDayToday && isSelected ? "bg-accent-purple text-white" : ""}
                  `}
                >
                  {format(day, "d")}
                </span>
                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-accent-purple rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Day events list */}
        <div className="p-3 min-h-[200px]">
          {dayOccurrences.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-muted">No classes on {format(selectedDate, "EEEE")}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {dayOccurrences.map((occ) => (
                <button
                  key={occ.id}
                  onClick={() => onQuickAdd?.(occ.occurrenceDate)}
                  className={`
                    w-full text-left p-3 rounded-lg border transition-colors
                    ${occ.status === "cancelled"
                      ? "opacity-50 border-border"
                      : "border-transparent hover:bg-surface-elevated/80"
                    }
                  `}
                  style={{
                    backgroundColor: occ.status === "cancelled"
                      ? undefined
                      : `${occ.class_?.color || "#a855f7"}15`,
                    borderLeftWidth: "3px",
                    borderLeftColor: occ.class_?.color || "#a855f7",
                  }}
                >
                  <p
                    className={`text-sm font-medium text-foreground ${
                      occ.status === "cancelled" ? "line-through" : ""
                    }`}
                  >
                    {occ.class_?.name || "Class"}
                    {occ.isExtra ? " (Extra)" : ""}
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    {occ.startTime.slice(0, 5)} — {occ.endTime.slice(0, 5)}
                    {occ.location ? ` · ${occ.location}` : ""}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

