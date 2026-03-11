/**
 * Attendance History — Full table of all past class occurrences
 *
 * Shows date, time, location, status (present/absent/cancelled/extra),
 * and edit actions. Each row can show attendance edit history.
 * Supports lazy loading via "Show More" for large lists.
 *
 * Reference: PRD Section 11.14 (Attendance History Review)
 */
"use client";

import { useState, useMemo } from "react";
import { m, AnimatePresence } from "framer-motion";
import { format, parseISO, isToday } from "date-fns";
import { useMarkAttendance } from "@/lib/hooks/use-attendance";
import type { AttendanceRecord } from "@/lib/hooks/use-attendance";

interface Occurrence {
  id: string;
  occurrenceDate: string;
  startTime: string;
  endTime: string;
  status: string;
  isExtra: boolean;
}

interface AttendanceHistoryProps {
  classId: string;
  occurrences: Occurrence[];
  attendance: AttendanceRecord[];
}

/** Number of rows to display at a time */
const PAGE_SIZE = 15;

/**
 * AttendanceHistory — expandable table of all past class occurrences.
 */
export default function AttendanceHistory({
  classId,
  occurrences,
  attendance,
}: AttendanceHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const markAttendance = useMarkAttendance(classId);

  /* Build a lookup of attendance by occurrence ID */
  const attendanceMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    for (const a of attendance) {
      map.set(a.occurrenceId, a);
    }
    return map;
  }, [attendance]);

  /* Sort occurrences: most recent first, only past + today */
  const sortedOccurrences = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    return [...occurrences]
      .filter((o) => o.occurrenceDate <= today)
      .sort((a, b) => b.occurrenceDate.localeCompare(a.occurrenceDate));
  }, [occurrences]);

  /* Slice for pagination */
  const visibleOccurrences = sortedOccurrences.slice(0, visibleCount);

  if (sortedOccurrences.length === 0) return null;

  /* Status badge styling */
  const getStatusBadge = (occ: Occurrence) => {
    const record = attendanceMap.get(occ.id);
    if (occ.status === "cancelled") {
      return { label: "Cancelled", className: "bg-surface-elevated text-muted" };
    }
    if (!record) {
      return { label: "Unmarked", className: "bg-accent-amber/20 text-accent-amber" };
    }
    switch (record.status) {
      case "present":
        return { label: "Present", className: "bg-accent-green/20 text-accent-green" };
      case "absent":
        return { label: "Absent", className: "bg-accent-red/20 text-accent-red" };
      case "cancelled":
        return { label: "Cancelled", className: "bg-surface-elevated text-muted" };
      default:
        return { label: record.status, className: "bg-surface-elevated text-muted" };
    }
  };

  /* Handle quick status change */
  const handleStatusChange = (occurrenceId: string, status: "present" | "absent") => {
    markAttendance.mutate({ occurrenceId, classId, status });
  };

  return (
    <div>
      {/* Collapsible toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm font-medium text-muted hover:text-foreground transition-colors mb-3"
      >
        <svg
          className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        Attendance History ({sortedOccurrences.length})
      </button>

      <AnimatePresence>
        {isExpanded && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-border overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-4 py-2 bg-surface-elevated/50 text-xs text-muted font-medium">
                <span>Date</span>
                <span className="text-center w-16">Time</span>
                <span className="text-center w-20">Status</span>
                <span className="text-center w-16">Actions</span>
              </div>

              {/* Table rows */}
              <div className="divide-y divide-border/50">
                {visibleOccurrences.map((occ) => {
                  const isTodayRow = isToday(parseISO(occ.occurrenceDate));
                  const badge = getStatusBadge(occ);
                  const record = attendanceMap.get(occ.id);

                  return (
                    <div key={occ.id}>
                      <div
                        className={`grid grid-cols-[1fr_auto_auto_auto] gap-2 px-4 py-2.5 items-center text-xs ${
                          isTodayRow ? "bg-accent-purple/5" : "hover:bg-surface-elevated/30"
                        } transition-colors`}
                      >
                        {/* Date */}
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${isTodayRow ? "text-accent-purple" : "text-foreground"}`}>
                            {format(parseISO(occ.occurrenceDate), "EEE, MMM d")}
                          </span>
                          {occ.isExtra && (
                            <span className="text-[9px] px-1 py-0.5 rounded bg-accent-purple/20 text-accent-purple">
                              Extra
                            </span>
                          )}
                          {isTodayRow && (
                            <span className="text-[9px] px-1 py-0.5 rounded bg-accent-purple/20 text-accent-purple">
                              Today
                            </span>
                          )}
                        </div>

                        {/* Time */}
                        <span className="text-muted text-center w-16">
                          {occ.startTime.slice(0, 5)}
                        </span>

                        {/* Status badge */}
                        <span
                          className={`text-center w-20 text-[10px] font-medium px-2 py-0.5 rounded-full ${badge.className}`}
                        >
                          {badge.label}
                        </span>

                        {/* Actions */}
                        <div className="flex items-center justify-center gap-1 w-16">
                          {occ.status !== "cancelled" && (
                            <>
                              <button
                                onClick={() => handleStatusChange(occ.id, "present")}
                                disabled={markAttendance.isPending}
                                className={`text-[9px] px-1.5 py-0.5 rounded transition-colors ${
                                  record?.status === "present"
                                    ? "bg-accent-green text-white"
                                    : "bg-accent-green/20 text-accent-green hover:bg-accent-green/30"
                                }`}
                              >
                                P
                              </button>
                              <button
                                onClick={() => handleStatusChange(occ.id, "absent")}
                                disabled={markAttendance.isPending}
                                className={`text-[9px] px-1.5 py-0.5 rounded transition-colors ${
                                  record?.status === "absent"
                                    ? "bg-accent-red text-white"
                                    : "bg-accent-red/20 text-accent-red hover:bg-accent-red/30"
                                }`}
                              >
                                A
                              </button>
                              {/* Edit history toggle */}
                              {record?.editHistory && record.editHistory.length > 0 && (
                                <button
                                  onClick={() =>
                                    setExpandedHistoryId(
                                      expandedHistoryId === occ.id ? null : occ.id
                                    )
                                  }
                                  className="text-muted hover:text-foreground transition-colors p-0.5"
                                  title="View edit history"
                                >
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Edit history expansion */}
                      <AnimatePresence>
                        {expandedHistoryId === occ.id && record?.editHistory && (
                          <m.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-surface/50 px-6 py-2 overflow-hidden"
                          >
                            <p className="text-[10px] text-muted font-medium mb-1">Edit History:</p>
                            {record.editHistory.map((h) => (
                              <p key={h.id} className="text-[10px] text-muted">
                                {h.previousStatus} → {h.newStatus}{" "}
                                <span className="opacity-60">
                                  ({format(parseISO(h.changedAt), "MMM d, HH:mm")})
                                </span>
                              </p>
                            ))}
                          </m.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* Show more button */}
              {visibleCount < sortedOccurrences.length && (
                <button
                  onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                  className="w-full py-2 text-xs text-muted hover:text-foreground transition-colors bg-surface-elevated/30"
                >
                  Show more ({sortedOccurrences.length - visibleCount} remaining)
                </button>
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
