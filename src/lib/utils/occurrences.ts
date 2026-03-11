/**
 * Occurrence Generation Utility
 *
 * Purpose: Generates individual class occurrence records from recurring
 * schedule slots using rrule.js. Called when:
 * - A new class is created with schedule slots
 * - A schedule slot is added or modified
 * - A semester date range changes
 *
 * Uses rrule.js to compute which dates a weekly slot falls on,
 * within the slot's valid_from/valid_until range.
 *
 * Reference: PRD Section 12.5 (Recurrence with rrule.js)
 */
import { RRule } from "rrule";

/** Shape of a schedule slot row from the database */
interface ScheduleSlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location: string | null;
  validFrom: string;
  validUntil: string | null;
}

/** Shape of an occurrence to insert into the database */
interface OccurrenceInsert {
  classId: string;
  scheduleSlotId: string;
  userId: string;
  occurrenceDate: string;
  startTime: string;
  endTime: string;
  location: string | null;
  status: "scheduled";
  isExtra: boolean;
}

/**
 * Maps our dayOfWeek (0=Sun..6=Sat) to rrule's weekday constants.
 * rrule uses RRule.SU=0, RRule.MO=1, etc.
 */
const DAY_MAP = [
  RRule.SU,
  RRule.MO,
  RRule.TU,
  RRule.WE,
  RRule.TH,
  RRule.FR,
  RRule.SA,
];

/**
 * Generates class occurrence records from schedule slots.
 *
 * @param slots - Schedule slots to generate from
 * @param classId - The class these occurrences belong to
 * @param userId - The user who owns these records
 * @param classStartDate - Start of the date range (ISO date string)
 * @param classEndDate - End of the date range (ISO date string)
 * @returns Array of occurrence insert objects ready for db.insert()
 */
export function generateOccurrences(
  slots: ScheduleSlot[],
  classId: string,
  userId: string,
  classStartDate: string,
  classEndDate: string
): OccurrenceInsert[] {
  const occurrences: OccurrenceInsert[] = [];

  for (const slot of slots) {
    /* Use slot validity range, constrained by class date range */
    const rangeStart = new Date(
      slot.validFrom > classStartDate ? slot.validFrom : classStartDate
    );
    const rangeEnd = slot.validUntil
      ? new Date(
          slot.validUntil < classEndDate ? slot.validUntil : classEndDate
        )
      : new Date(classEndDate);

    /* Create rrule for weekly recurrence on this day of week */
    const rule = new RRule({
      freq: RRule.WEEKLY,
      byweekday: [DAY_MAP[slot.dayOfWeek]],
      dtstart: rangeStart,
      until: rangeEnd,
    });

    /* Generate all dates this slot occurs on */
    const dates = rule.all();

    for (const date of dates) {
      const dateStr = date.toISOString().split("T")[0];
      occurrences.push({
        classId,
        scheduleSlotId: slot.id,
        userId,
        occurrenceDate: dateStr,
        startTime: slot.startTime,
        endTime: slot.endTime,
        location: slot.location,
        status: "scheduled",
        isExtra: false,
      });
    }
  }

  return occurrences;
}
