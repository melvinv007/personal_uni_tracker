/**
 * Attendance Prompt — Today's class attendance marking card
 *
 * Shows when the class has an occurrence today but attendance hasn't been marked.
 * Two-button UI: Present (green check) / Absent (red X).
 * Appears at the top of the class page for immediate action.
 *
 * Reference: PRD Section 11.2 (Today's Attendance Prompt)
 */
"use client";

import { m, AnimatePresence } from "framer-motion";
import { useMarkAttendance } from "@/lib/hooks/use-attendance";

interface AttendancePromptProps {
  classId: string;
  occurrences: Array<{
    id: string;
    startTime: string;
    endTime: string;
  }>;
  classColor: string;
}

/**
 * AttendancePrompt — Prompts user to mark attendance for today's class.
 */
export default function AttendancePrompt({
  classId,
  occurrences,
  classColor,
}: AttendancePromptProps) {
  const markAttendance = useMarkAttendance(classId);

  /** Mark attendance for an occurrence */
  const handleMark = (occurrenceId: string, status: "present" | "absent") => {
    markAttendance.mutate({
      occurrenceId,
      classId,
      status,
    });
  };

  /** Format time compactly */
  const formatTime = (time: string) => {
    const [h, m] = time.split(":");
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    return `${hour % 12 || 12}:${m} ${ampm}`;
  };

  return (
    <AnimatePresence>
      {occurrences.map((occ) => (
        <m.div
          key={occ.id}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
          className="rounded-xl border border-border p-4"
          style={{
            backgroundColor: `${classColor}08`,
            borderColor: `${classColor}30`,
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">
                Mark attendance
              </p>
              <p className="text-xs text-muted mt-0.5">
                {formatTime(occ.startTime)} — {formatTime(occ.endTime)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Present button */}
              <button
                onClick={() => handleMark(occ.id, "present")}
                disabled={markAttendance.isPending}
                className="
                  flex items-center gap-1.5 px-3 py-2 rounded-lg
                  bg-accent-green/10 border border-accent-green/30
                  text-accent-green text-sm font-medium
                  hover:bg-accent-green/20
                  disabled:opacity-50
                  transition-colors
                "
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Present
              </button>

              {/* Absent button */}
              <button
                onClick={() => handleMark(occ.id, "absent")}
                disabled={markAttendance.isPending}
                className="
                  flex items-center gap-1.5 px-3 py-2 rounded-lg
                  bg-accent-red/10 border border-accent-red/30
                  text-accent-red text-sm font-medium
                  hover:bg-accent-red/20
                  disabled:opacity-50
                  transition-colors
                "
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Absent
              </button>
            </div>
          </div>
        </m.div>
      ))}
    </AnimatePresence>
  );
}
