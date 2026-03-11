/**
 * Attendance Calculation Utilities
 *
 * Purpose: Provides all attendance-related calculations used in
 * attendance stats, skip-class safety indicator, survival calculator,
 * and bunk planner.
 *
 * Reference: PRD Section 13.3 (Attendance Calculations),
 * Section 17.1-17.3 (Analytics & Calculators)
 */

/** Attendance stats shape returned by calculations */
export interface AttendanceStats {
  /** Total scheduled + extra (excluding cancelled) */
  totalScheduled: number;
  /** Cancelled occurrences count */
  totalCancelled: number;
  /** Past occurrences that were not cancelled */
  totalOccurred: number;
  /** Occurrences marked as present */
  totalAttended: number;
  /** (attended / occurred) × 100 — PRD Section 13.3 */
  attendancePercentage: number;
}

/**
 * Calculates attendance statistics for a class.
 *
 * Formula (PRD Section 13.3):
 * - total_scheduled = count of occurrences with status IN ('scheduled', 'extra')
 * - total_cancelled = count of occurrences with status = 'cancelled'
 * - total_occurred = count of past occurrences not cancelled
 * - total_attended = count of attendance records with status = 'present'
 * - attendance_percentage = (total_attended / total_occurred) × 100
 *
 * @param occurrences - All class occurrences
 * @param attendanceRecords - All attendance records for those occurrences
 * @param currentDate - Current date for determining "past" occurrences
 * @returns Calculated attendance statistics
 */
export function calculateAttendanceStats(
  occurrences: Array<{
    id: string;
    status: string;
    occurrenceDate: string;
    isExtra: boolean;
  }>,
  attendanceRecords: Array<{
    occurrenceId: string;
    status: string;
  }>,
  currentDate: Date = new Date()
): AttendanceStats {
  const today = currentDate.toISOString().split("T")[0];

  /* Count scheduled + extra occurrences (excluding cancelled) */
  const totalScheduled = occurrences.filter(
    (o) => o.status !== "cancelled"
  ).length;

  /* Count cancelled */
  const totalCancelled = occurrences.filter(
    (o) => o.status === "cancelled"
  ).length;

  /* Count past, non-cancelled occurrences */
  const totalOccurred = occurrences.filter(
    (o) => o.occurrenceDate <= today && o.status !== "cancelled"
  ).length;

  /* Count attendance records with status = 'present' */
  const totalAttended = attendanceRecords.filter(
    (a) => a.status === "present"
  ).length;

  /* Calculate percentage — handle division by zero */
  const attendancePercentage =
    totalOccurred > 0
      ? Math.round((totalAttended / totalOccurred) * 10000) / 100
      : 0;

  return {
    totalScheduled,
    totalCancelled,
    totalOccurred,
    totalAttended,
    attendancePercentage,
  };
}

/**
 * Skip-Class Safety Indicator
 *
 * Calculates how many more classes can be missed while staying above 75%.
 * Also calculates what attendance becomes if the next class is missed.
 *
 * @param stats - Current attendance stats
 * @param remainingClasses - Number of remaining scheduled classes
 * @returns Safety indicator data
 *
 * Reference: PRD Section 11.6, Section 17.3
 */
export function calculateSkipSafety(
  stats: AttendanceStats,
  remainingClasses: number
): {
  canMiss: number;
  percentageIfMissNext: number;
  safetyLevel: "safe" | "marginal" | "danger";
} {
  const { totalAttended, totalOccurred } = stats;

  /* Calculate how many can be missed and still be above 75% */
  /* After skipping X: attended / (occurred + X) >= 0.75 */
  /* attended >= 0.75 * (occurred + X) */
  /* X <= (attended / 0.75) - occurred */
  const maxMissable = Math.floor(totalAttended / 0.75 - totalOccurred);
  const canMiss = Math.max(0, Math.min(maxMissable, remainingClasses));

  /* Calculate percentage if next class is missed */
  const percentageIfMissNext =
    totalOccurred + 1 > 0
      ? Math.round((totalAttended / (totalOccurred + 1)) * 10000) / 100
      : 0;

  /* Determine safety level — PRD Section 17.3 */
  let safetyLevel: "safe" | "marginal" | "danger";
  if (percentageIfMissNext > 75) {
    safetyLevel = "safe";
  } else if (percentageIfMissNext >= 65) {
    safetyLevel = "marginal";
  } else {
    safetyLevel = "danger";
  }

  return { canMiss, percentageIfMissNext, safetyLevel };
}

/**
 * Attendance Survival Calculator
 *
 * Given a number of classes to miss, calculates resulting attendance percentage.
 *
 * @param stats - Current attendance stats
 * @param classesToMiss - Number of upcoming classes to miss
 * @returns Resulting attendance percentage
 *
 * Reference: PRD Section 17.1
 */
export function calculateSurvival(
  stats: AttendanceStats,
  classesToMiss: number
): number {
  const newOccurred = stats.totalOccurred + classesToMiss;
  if (newOccurred === 0) return 100;
  return Math.round((stats.totalAttended / newOccurred) * 10000) / 100;
}

/**
 * Bunk Planner
 *
 * Given a target attendance percentage, calculates how many classes
 * can be missed while maintaining that target.
 *
 * @param stats - Current attendance stats
 * @param targetPercentage - Target attendance percentage (0-100)
 * @returns Number of classes that can be missed
 *
 * Reference: PRD Section 17.2
 */
export function calculateBunkAllowance(
  stats: AttendanceStats,
  targetPercentage: number
): number {
  const { totalAttended, totalOccurred } = stats;
  const targetFraction = targetPercentage / 100;

  if (targetFraction === 0) return Infinity;

  /* attended / (occurred + X) >= target */
  /* X <= (attended / target) - occurred */
  const maxMissable = Math.floor(totalAttended / targetFraction - totalOccurred);
  return Math.max(0, maxMissable);
}
