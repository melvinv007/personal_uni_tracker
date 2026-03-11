/**
 * Weekly Schedule Card — Shows the recurring weekly schedule for a class
 *
 * Displays schedule slots as a compact weekly view.
 * Each slot shows: day, time range, location.
 *
 * Reference: PRD Section 11.4 (Weekly Schedule Card)
 */
"use client";

import { m } from "framer-motion";

interface ScheduleSlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location: string | null;
  validFrom: string;
  validUntil: string | null;
}

interface WeeklyScheduleCardProps {
  scheduleSlots: ScheduleSlot[];
  classColor: string;
}

/** Full day names for display */
const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/**
 * WeeklyScheduleCard — Compact weekly schedule display.
 */
export default function WeeklyScheduleCard({
  scheduleSlots,
  classColor,
}: WeeklyScheduleCardProps) {
  if (scheduleSlots.length === 0) return null;

  /* Sort by day of week, then by start time */
  const sortedSlots = [...scheduleSlots].sort((a, b) => {
    if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
    return a.startTime.localeCompare(b.startTime);
  });

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border dotted-surface-elevated p-4"
    >
      <h3 className="text-sm font-medium text-muted mb-3">Weekly Schedule</h3>

      <div className="space-y-2">
        {sortedSlots.map((slot, index) => (
          <m.div
            key={slot.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-elevated/50"
          >
            {/* Color bar */}
            <div
              className="w-1 h-8 rounded-full shrink-0"
              style={{ backgroundColor: classColor }}
            />

            {/* Day name */}
            <p className="text-sm font-medium text-foreground w-24 shrink-0">
              {DAY_NAMES[slot.dayOfWeek]}
            </p>

            {/* Time range */}
            <p className="text-sm text-muted">
              {formatTime(slot.startTime)} — {formatTime(slot.endTime)}
            </p>

            {/* Location */}
            {slot.location && (
              <p className="text-xs text-muted/60 ml-auto truncate max-w-[120px]">
                {slot.location}
              </p>
            )}
          </m.div>
        ))}
      </div>
    </m.div>
  );
}

/** Format time string to readable format */
function formatTime(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${m} ${ampm}`;
}
