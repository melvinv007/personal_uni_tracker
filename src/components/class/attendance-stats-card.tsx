/**
 * Attendance Stats Card — Animated attendance statistics
 *
 * Shows: Total attended/occurred, percentage with color coding,
 * skip-class safety indicator, animated count-up numbers.
 *
 * Reference: PRD Section 11.3 (Attendance Stats),
 * Section 13.3 (Attendance Calculations),
 * Section 17.1 (Skip-Class Safety)
 */
"use client";

import { m } from "framer-motion";
import type { AttendanceStats } from "@/lib/utils/attendance";
import { calculateSkipSafety } from "@/lib/utils/attendance";

interface AttendanceStatsCardProps {
  stats: AttendanceStats;
  classColor: string;
  totalRemaining: number;
}

/**
 * AttendanceStatsCard — Visual attendance dashboard for a class.
 */
export default function AttendanceStatsCard({
  stats,
  classColor,
  totalRemaining,
}: AttendanceStatsCardProps) {
  const { totalAttended, totalOccurred, attendancePercentage, totalCancelled } =
    stats;

  /* Skip-class safety calculation — PRD Section 17.1 */
  const safety = calculateSkipSafety(stats, totalRemaining);

  /* Color coding based on percentage — PRD Section 13.3 */
  const getPercentageColor = () => {
    if (attendancePercentage >= 75) return "text-accent-green";
    if (attendancePercentage >= 60) return "text-accent-amber";
    return "text-accent-red";
  };

  /* Safety indicator colors */
  const getSafetyColor = () => {
    switch (safety.safetyLevel) {
      case "safe":
        return "text-accent-green bg-accent-green/10 border-accent-green/30";
      case "marginal":
        return "text-accent-amber bg-accent-amber/10 border-accent-amber/30";
      case "danger":
        return "text-accent-red bg-accent-red/10 border-accent-red/30";
    }
  };

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border dotted-surface-elevated p-4"
    >
      <h3 className="text-sm font-medium text-muted mb-4">Attendance</h3>

      {/* Main stats row */}
      <div className="flex items-end justify-between mb-4">
        {/* Percentage — large display */}
        <div>
          <m.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`text-3xl font-bold ${getPercentageColor()}`}
          >
            {attendancePercentage.toFixed(1)}%
          </m.p>
          <p className="text-xs text-muted mt-0.5">
            {totalAttended} of {totalOccurred} classes attended
          </p>
        </div>

        {/* Quick stats */}
        <div className="flex gap-4 text-center">
          <div>
            <p className="text-lg font-bold text-foreground">{totalOccurred}</p>
            <p className="text-[10px] text-muted">Held</p>
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">{totalRemaining}</p>
            <p className="text-[10px] text-muted">Left</p>
          </div>
          {totalCancelled > 0 && (
            <div>
              <p className="text-lg font-bold text-muted">{totalCancelled}</p>
              <p className="text-[10px] text-muted">Cancelled</p>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 rounded-full bg-surface-elevated overflow-hidden mb-4">
        <m.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(attendancePercentage, 100)}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: classColor }}
        />
      </div>

      {/* Skip-Class Safety Indicator — PRD Section 17.1 */}
      <div className={`rounded-lg border p-3 ${getSafetyColor()}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">
              {safety.safetyLevel === "safe" && "Safe to skip"}
              {safety.safetyLevel === "marginal" && "Be careful"}
              {safety.safetyLevel === "danger" && "Don't skip!"}
            </p>
            <p className="text-xs opacity-80 mt-0.5">
              {safety.canMiss > 0
                ? `Can miss ${safety.canMiss} more class${safety.canMiss !== 1 ? "es" : ""} and stay above 75%`
                : "Cannot miss any more classes to maintain 75%"}
            </p>
          </div>
          <p className="text-2xl font-bold shrink-0">{safety.canMiss}</p>
        </div>
      </div>
    </m.div>
  );
}
