/**
 * Pending Attendance — Alerts for unmarked past class occurrences
 *
 * Component: PendingAttendance
 * Purpose: Shows past occurrences where attendance hasn't been marked yet.
 * Includes bulk "Mark All" option per PRD §11.4.
 *
 * Props:
 * - classId: Current class ID
 * - occurrences: All class occurrences
 * - attendance: Existing attendance records
 *
 * Appears on: Class page (below today's attendance prompt)
 *
 * Reference: PRD Section 11.4 (Pending Attendance Alerts)
 */
"use client";

import { useState, useMemo } from "react";
import { format, parseISO, isBefore, startOfDay } from "date-fns";
import { m, AnimatePresence } from "framer-motion";
import { useMarkAttendance, useBulkAttendance } from "@/lib/hooks/use-attendance";
import type { AttendanceRecord } from "@/lib/hooks/use-attendance";
import { GlowingCard } from "@/components/ui/glowing-card";

interface Occurrence {
  id: string;
  occurrenceDate: string;
  startTime: string;
  endTime: string;
  status: string;
  isExtra: boolean;
}

interface PendingAttendanceProps {
  classId: string;
  occurrences: Occurrence[];
  attendance: AttendanceRecord[];
  classColor: string;
}

/**
 * PendingAttendance — shows unmarked past occurrences with quick-mark buttons.
 */
export default function PendingAttendance({
  classId,
  occurrences,
  attendance,
  classColor,
}: PendingAttendanceProps) {
  const markAttendance = useMarkAttendance(classId);
  const bulkAttendance = useBulkAttendance(classId);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  /* Find past occurrences without attendance (excluding today and cancelled) */
  const pendingOccurrences = useMemo(() => {
    const today = startOfDay(new Date());
    const markedIds = new Set(attendance.map((a) => a.occurrenceId));

    return occurrences
      .filter((o) => {
        const occDate = parseISO(o.occurrenceDate);
        return (
          isBefore(occDate, today) &&
          o.status !== "cancelled" &&
          !markedIds.has(o.id)
        );
      })
      .sort((a, b) => b.occurrenceDate.localeCompare(a.occurrenceDate));
  }, [occurrences, attendance]);

  /* Don't render if nothing pending */
  if (pendingOccurrences.length === 0) return null;

  /* Toggle selection for bulk marking */
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /* Select or deselect all */
  const toggleAll = () => {
    if (selectedIds.size === pendingOccurrences.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingOccurrences.map((o) => o.id)));
    }
  };

  /* Bulk mark selected as present or absent */
  const handleBulkMark = (status: "present" | "absent") => {
    if (selectedIds.size === 0) return;
    bulkAttendance.mutate({
      occurrenceIds: Array.from(selectedIds),
      classId,
      status,
    });
    setSelectedIds(new Set());
  };

  /* Single mark */
  const handleMark = (occurrenceId: string, status: "present" | "absent") => {
    markAttendance.mutate({ occurrenceId, classId, status });
  };

  return (
    <GlowingCard color={classColor} className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-accent-amber">
            ⚠️ Pending Attendance
          </h3>
          <p className="text-xs text-muted mt-0.5">
            {pendingOccurrences.length} unmarked session{pendingOccurrences.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Bulk actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleAll}
            className="text-xs text-muted hover:text-foreground transition-colors"
          >
            {selectedIds.size === pendingOccurrences.length ? "Deselect All" : "Select All"}
          </button>
          {selectedIds.size > 0 && (
            <div className="flex gap-1">
              <button
                onClick={() => handleBulkMark("present")}
                disabled={bulkAttendance.isPending}
                className="text-xs px-2 py-1 rounded bg-accent-green/20 text-accent-green hover:bg-accent-green/30 transition-colors"
              >
                All Present
              </button>
              <button
                onClick={() => handleBulkMark("absent")}
                disabled={bulkAttendance.isPending}
                className="text-xs px-2 py-1 rounded bg-accent-red/20 text-accent-red hover:bg-accent-red/30 transition-colors"
              >
                All Absent
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Pending items list */}
      <div className="space-y-2 max-h-60 overflow-y-auto">
        <AnimatePresence>
          {pendingOccurrences.map((occ) => (
            <m.div
              key={occ.id}
              layout
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center gap-3 p-2 rounded-lg bg-surface/50 hover:bg-surface-elevated/50 transition-colors"
            >
              {/* Selection checkbox */}
              <input
                type="checkbox"
                checked={selectedIds.has(occ.id)}
                onChange={() => toggleSelect(occ.id)}
                className="rounded border-border bg-surface text-accent-purple focus:ring-accent-purple shrink-0"
              />

              {/* Date + time info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground">
                  {format(parseISO(occ.occurrenceDate), "EEE, MMM d")}
                  {occ.isExtra && (
                    <span className="ml-1 text-[10px] text-accent-purple">(Extra)</span>
                  )}
                </p>
                <p className="text-[10px] text-muted">
                  {occ.startTime} – {occ.endTime}
                </p>
              </div>

              {/* Quick mark buttons */}
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => handleMark(occ.id, "present")}
                  disabled={markAttendance.isPending}
                  className="text-[10px] px-2 py-1 rounded bg-accent-green/20 text-accent-green hover:bg-accent-green/30 transition-colors"
                >
                  P
                </button>
                <button
                  onClick={() => handleMark(occ.id, "absent")}
                  disabled={markAttendance.isPending}
                  className="text-[10px] px-2 py-1 rounded bg-accent-red/20 text-accent-red hover:bg-accent-red/30 transition-colors"
                >
                  A
                </button>
              </div>
            </m.div>
          ))}
        </AnimatePresence>
      </div>
    </GlowingCard>
  );
}
