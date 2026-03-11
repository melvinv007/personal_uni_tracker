/**
 * Weekly Schedule Summary — Auto-generated weekly grid
 *
 * Purpose: Read-only schedule overview showing all class time slots
 * organized by day of week. Updates automatically when schedule changes.
 *
 * Reference: PRD Section 10.7 (Weekly Schedule Summary)
 */
"use client";

import { useMemo } from "react";
import { GlowingCard } from "@/components/ui/glowing-card";

interface ScheduleSlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location: string | null;
}

interface ClassWithSchedule {
  id: string;
  name: string;
  color: string;
  scheduleSlots: ScheduleSlot[];
}

interface WeeklyScheduleSummaryProps {
  classes: ClassWithSchedule[];
}

/** Day labels indexed 0 (Sunday) through 6 (Saturday) */
const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** Short day labels for compact display on mobile */
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Format "HH:mm" 24h string into compact 12h (e.g. "9:00a") */
function formatCompactTime(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "p" : "a";
  return `${hour % 12 || 12}:${m}${ampm}`;
}

/**
 * Slot entry enriched with class info for rendering.
 */
interface EnrichedSlot {
  classId: string;
  className: string;
  classColor: string;
  startTime: string;
  endTime: string;
  location: string | null;
}

/**
 * WeeklyScheduleSummary — displays all class slots in a clean weekly grid.
 */
export default function WeeklyScheduleSummary({
  classes,
}: WeeklyScheduleSummaryProps) {
  /* Group slots by day of week, sorted by start time within each day */
  const slotsByDay = useMemo(() => {
    const grouped: Record<number, EnrichedSlot[]> = {};

    for (const cls of classes) {
      for (const slot of cls.scheduleSlots) {
        if (!grouped[slot.dayOfWeek]) {
          grouped[slot.dayOfWeek] = [];
        }
        grouped[slot.dayOfWeek].push({
          classId: cls.id,
          className: cls.name,
          classColor: cls.color,
          startTime: slot.startTime,
          endTime: slot.endTime,
          location: slot.location,
        });
      }
    }

    /* Sort each day's slots by start time */
    for (const day in grouped) {
      grouped[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
    }

    return grouped;
  }, [classes]);

  /* Find which days have slots (Monday=1 through Saturday=6, Sunday=0) */
  const activeDays = useMemo(
    () =>
      [1, 2, 3, 4, 5, 6, 0].filter((d) => slotsByDay[d]?.length), // Mon–Sat, Sun
    [slotsByDay]
  );

  if (activeDays.length === 0) return null;

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-4">
        Weekly Schedule
      </h2>

      <GlowingCard className="p-4 overflow-x-auto">
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${activeDays.length}, minmax(140px, 1fr))` }}>
          {/* Day headers */}
          {activeDays.map((day) => (
            <div key={`header-${day}`} className="text-center">
              {/* Full name on desktop, short on mobile */}
              <p className="text-xs font-semibold text-muted uppercase tracking-wider hidden sm:block">
                {DAY_NAMES[day]}
              </p>
              <p className="text-xs font-semibold text-muted uppercase tracking-wider sm:hidden">
                {DAY_SHORT[day]}
              </p>
            </div>
          ))}

          {/* Slot entries per day */}
          {activeDays.map((day) => (
            <div key={`slots-${day}`} className="space-y-2">
              {slotsByDay[day]?.map((slot, idx) => (
                <div
                  key={`${slot.classId}-${idx}`}
                  className="rounded-lg p-2 text-xs"
                  style={{
                    backgroundColor: `${slot.classColor}15`,
                    borderLeft: `3px solid ${slot.classColor}`,
                  }}
                >
                  {/* Class name */}
                  <p
                    className="font-semibold truncate"
                    style={{ color: slot.classColor }}
                  >
                    {slot.className}
                  </p>
                  {/* Time range */}
                  <p className="text-muted mt-0.5">
                    {formatCompactTime(slot.startTime)} –{" "}
                    {formatCompactTime(slot.endTime)}
                  </p>
                  {/* Location (if set) */}
                  {slot.location && (
                    <p className="text-muted truncate mt-0.5">
                      📍 {slot.location}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </GlowingCard>
    </div>
  );
}
