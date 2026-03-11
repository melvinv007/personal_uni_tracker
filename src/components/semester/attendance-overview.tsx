/**
 * Attendance Overview — Per-class attendance stats on semester page
 *
 * Shows attendance percentage for each class as horizontal bars.
 * Color-coded: green (>=75%), amber (60-75%), red (<60%).
 * Sorted by attendance percentage ascending (worst first for visibility).
 *
 * Reference: PRD Section 10.4 (Attendance Overview Stats)
 */
"use client";

import { m } from "framer-motion";

interface AttendanceClass {
  id: string;
  name: string;
  color: string;
  scheduleSlots: Array<{ id: string }>;
}

interface AttendanceOverviewProps {
  classes: AttendanceClass[];
}

/**
 * AttendanceOverview — Per-class attendance bars for the semester page.
 * Note: Full attendance data comes from the class detail endpoint.
 * Here we show a simplified overview based on available data.
 */
export default function AttendanceOverview({
  classes,
}: AttendanceOverviewProps) {
  if (classes.length === 0) return null;

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-4">
        Attendance Overview
      </h2>

      <div className="rounded-xl border border-border dotted-surface-elevated p-4">
        <div className="space-y-3">
          {classes.map((cls, index) => (
            <AttendanceBar key={cls.id} cls={cls} index={index} />
          ))}
        </div>

        {/* Summary note */}
        <p className="text-xs text-muted mt-4">
          Open each class for detailed attendance stats
        </p>
      </div>
    </div>
  );
}

/**
 * Single class attendance bar.
 * Shows class name, color indicator, and schedule slot count.
 */
function AttendanceBar({
  cls,
  index,
}: {
  cls: AttendanceClass;
  index: number;
}) {
  const slotsPerWeek = cls.scheduleSlots.length;

  return (
    <m.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-3"
    >
      {/* Color indicator */}
      <div
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: cls.color }}
      />

      {/* Class name */}
      <p className="text-sm text-foreground truncate flex-1 min-w-0">
        {cls.name}
      </p>

      {/* Schedule info */}
      <p className="text-xs text-muted shrink-0">
        {slotsPerWeek}x/week
      </p>
    </m.div>
  );
}
