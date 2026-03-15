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
  /** PRD §11.4: "recent" = today/yesterday, "older" = anything before yesterday */
  mode?: "recent" | "older";
}

/**
 * PendingAttendance — shows unmarked past occurrences with quick-mark buttons.
 */
export default function PendingAttendance({
  classId,
  occurrences,
  attendance,
  classColor,
  mode = "older", // default to older for backward compatibility if needed
}: PendingAttendanceProps) {
  const markAttendance = useMarkAttendance(classId);
  const bulkAttendance = useBulkAttendance(classId);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  /* Find past occurrences without attendance (excluding today and cancelled) */
  const pendingOccurrences = useMemo(() => {
    const today = startOfDay(new Date());
    // "today" logic for pending attendance means we only consider occurrences whose endTime has passed, but for simplicity we rely on the date. Wait, PRD 11.4 says "today and yesterday".
    // IsBefore today means yesterday or older.
    // Let's refine the date logic:
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const markedIds = new Set(attendance.map((a) => a.occurrenceId));

    return occurrences
      .filter((o) => {
        const occDate = parseISO(o.occurrenceDate);
        const isNotMarked = !markedIds.has(o.id) && o.status !== "cancelled";
        
        // Time checks
        // We consider an occurrence "past" if it's before today, OR if it's today but the end time has passed.
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTime = `${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`;
        
        let isPast = false;
        if (isBefore(occDate, today)) {
          isPast = true;
        } else if (occDate.getTime() === today.getTime()) {
           // For today, it's pending only if the class end time has passed
           if (o.endTime < currentTime) {
              isPast = true;
           }
        }

        if (!isPast || !isNotMarked) return false;

        // Mode filtering
        const isRecent = occDate.getTime() >= yesterday.getTime(); // Yesterday or today
        
        if (mode === "recent") return isRecent;
        if (mode === "older") return !isRecent;
        
        return true;
      })
      .sort((a, b) => b.occurrenceDate.localeCompare(a.occurrenceDate));
  }, [occurrences, attendance, mode]);

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
          <h3 className={`text-sm font-semibold ${mode === "recent" ? "text-accent-red" : "text-accent-amber"}`}>
            {mode === "recent" ? "⚠️ Recent Missing Attendance" : "⚠️ Pending Attendance"}
          </h3>
          <p className="text-xs text-muted mt-0.5">
            {pendingOccurrences.length} unmarked session{pendingOccurrences.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Bulk actions — Only show for 'older' mode per BF-17 */}
        {mode === "older" && (
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
        )}
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
