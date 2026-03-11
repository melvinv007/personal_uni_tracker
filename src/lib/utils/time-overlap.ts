/**
 * Time Overlap Warning Utility
 *
 * Checks for time conflicts between a proposed time slot and existing events
 * on the same day. Used when creating or editing schedule slots, extra classes,
 * and non-academic events.
 *
 * Returns a list of overlapping events with their names and times so the UI
 * can show an inline warning: "This overlaps with [Event Name] at [Time]."
 * Overlaps are warnings, not hard blocks — user can still proceed.
 *
 * Reference: PRD Section 21.9 (Time Overlap Warning)
 */

/** A generic time-slot event that can be checked for overlap */
export interface TimeSlotEvent {
  id: string;
  name: string;
  date: string; // yyyy-MM-dd
  startTime: string; // HH:MM
  endTime: string; // HH:MM
}

/** Result of an overlap check — one entry per conflicting event */
export interface OverlapWarning {
  eventName: string;
  startTime: string;
  endTime: string;
}

/**
 * Check if two time ranges overlap.
 * Two ranges [s1, e1) and [s2, e2) overlap when s1 < e2 AND s2 < e1.
 * Times are compared as HH:MM strings (lexicographic comparison works for 24h format).
 *
 * @param start1 - Start time of first range (HH:MM)
 * @param end1 - End time of first range (HH:MM)
 * @param start2 - Start time of second range (HH:MM)
 * @param end2 - End time of second range (HH:MM)
 */
function timesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  return start1 < end2 && start2 < end1;
}

/**
 * Check a proposed time slot against a list of existing events for overlaps.
 * Only events on the same date are checked.
 *
 * @param proposedDate - Date of the proposed event (yyyy-MM-dd)
 * @param proposedStart - Start time of proposed event (HH:MM)
 * @param proposedEnd - End time of proposed event (HH:MM)
 * @param existingEvents - All events that could potentially overlap
 * @param excludeId - Optional event ID to exclude (for edit mode — exclude the event being edited)
 * @returns Array of overlap warnings (empty if no conflicts)
 */
export function checkTimeOverlap(
  proposedDate: string,
  proposedStart: string,
  proposedEnd: string,
  existingEvents: TimeSlotEvent[],
  excludeId?: string
): OverlapWarning[] {
  return existingEvents
    .filter((event) => {
      /* Only check events on the same date */
      if (event.date !== proposedDate) return false;
      /* Skip the event being edited */
      if (excludeId && event.id === excludeId) return false;
      /* Check for time overlap */
      return timesOverlap(proposedStart, proposedEnd, event.startTime, event.endTime);
    })
    .map((event) => ({
      eventName: event.name,
      startTime: event.startTime,
      endTime: event.endTime,
    }));
}

/**
 * Format overlap warnings into a human-readable string.
 * Returns null if no overlaps.
 *
 * @param warnings - Array of overlap warnings from checkTimeOverlap
 * @returns Formatted warning message or null
 */
export function formatOverlapWarnings(
  warnings: OverlapWarning[]
): string | null {
  if (warnings.length === 0) return null;

  if (warnings.length === 1) {
    const w = warnings[0];
    return `This overlaps with ${w.eventName} at ${w.startTime}–${w.endTime}. You can still proceed.`;
  }

  /* Multiple overlaps */
  const names = warnings.map((w) => `${w.eventName} (${w.startTime}–${w.endTime})`);
  return `This overlaps with ${names.join(", ")}. You can still proceed.`;
}
