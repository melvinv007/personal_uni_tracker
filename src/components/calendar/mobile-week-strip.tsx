/**
 * Mobile Week Strip — Horizontal scrollable day selector
 *
 * Purpose: Shows 7 days in a horizontal strip on mobile.
 * Tapping a day shows that day's schedule below.
 * Highlights today with accent color.
 *
 * Reference: PRD Section 12.4 (Mobile Week Strip)
 */
"use client";

import { useMemo } from "react";
import { format, addDays, isToday, isSameDay } from "date-fns";

interface MobileWeekStripProps {
  /** Start date of the week (Monday) */
  weekStart: Date;
  /** Currently selected date */
  selectedDate: Date;
  /** Called when a day is tapped */
  onSelectDate: (date: Date) => void;
  /** Optional dot indicators per day (e.g. number of events) */
  eventCounts?: Record<string, number>;
}

/**
 * MobileWeekStrip — Compact horizontal day selector for mobile.
 */
export default function MobileWeekStrip({
  weekStart,
  selectedDate,
  onSelectDate,
  eventCounts = {},
}: MobileWeekStripProps) {
  /* Generate 7 days */
  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  return (
    <div className="flex items-center gap-1 overflow-x-auto py-2 px-1 -mx-1">
      {days.map((day) => {
        const dateKey = format(day, "yyyy-MM-dd");
        const isSelected = isSameDay(day, selectedDate);
        const isTodayDay = isToday(day);
        const count = eventCounts[dateKey] || 0;

        return (
          <button
            key={dateKey}
            onClick={() => onSelectDate(day)}
            className={`
              flex flex-col items-center justify-center
              min-w-[48px] h-[60px] rounded-xl
              transition-all duration-200 shrink-0
              ${
                isSelected
                  ? "bg-accent-purple/20 border border-accent-purple/40"
                  : "bg-surface-elevated/50 border border-transparent"
              }
              ${isTodayDay && !isSelected ? "border-accent-purple/20" : ""}
            `}
          >
            {/* Day abbreviation */}
            <span
              className={`text-[10px] font-medium ${
                isSelected ? "text-accent-purple" : "text-muted"
              }`}
            >
              {format(day, "EEE")}
            </span>

            {/* Day number */}
            <span
              className={`text-sm font-semibold ${
                isSelected
                  ? "text-accent-purple"
                  : isTodayDay
                    ? "text-foreground"
                    : "text-muted"
              }`}
            >
              {format(day, "d")}
            </span>

            {/* Event count dots */}
            {count > 0 && (
              <div className="flex gap-0.5 mt-0.5">
                {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-1 h-1 rounded-full ${
                      isSelected ? "bg-accent-purple" : "bg-muted/50"
                    }`}
                  />
                ))}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
