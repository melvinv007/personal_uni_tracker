/**
 * TanStack Query Hooks — Attendance
 *
 * Purpose: Custom hooks for attendance marking (single + bulk).
 * All mutations use optimistic updates.
 *
 * Reference: PRD Section 13 (Attendance System)
 */
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { showToast } from "@/components/ui/toast";
import type { MarkAttendanceInput, BulkAttendanceInput } from "@/lib/validations/schemas";

/** Query key factory for attendance */
export const attendanceKeys = {
  byClass: (classId: string) => ["attendance", { classId }] as const,
};

/** Attendance record shape */
export interface AttendanceRecord {
  id: string;
  occurrenceId: string;
  classId: string;
  userId: string;
  status: "present" | "absent" | "cancelled";
  markedAt: string;
  updatedAt: string;
  occurrence?: {
    id: string;
    occurrenceDate: string;
    startTime: string;
    endTime: string;
    status: string;
  };
  editHistory?: Array<{
    id: string;
    previousStatus: string;
    newStatus: string;
    changedAt: string;
  }>;
}

/**
 * Fetches all attendance records for a class.
 */
export function useAttendance(classId: string) {
  return useQuery<AttendanceRecord[]>({
    queryKey: attendanceKeys.byClass(classId),
    queryFn: async () => {
      const res = await fetch(`/api/attendance?classId=${classId}`);
      if (!res.ok) throw new Error("Failed to fetch attendance");
      return res.json();
    },
    enabled: !!classId,
  });
}

/**
 * Marks attendance for a single occurrence.
 * Optimistically updates the attendance list.
 */
export function useMarkAttendance(classId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: MarkAttendanceInput) => {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to mark attendance");
      }
      return res.json() as Promise<AttendanceRecord>;
    },
    onMutate: async (newData) => {
      await queryClient.cancelQueries({
        queryKey: attendanceKeys.byClass(classId),
      });
      const previous = queryClient.getQueryData<AttendanceRecord[]>(
        attendanceKeys.byClass(classId)
      );

      /* Optimistic — add or update attendance */
      queryClient.setQueryData<AttendanceRecord[]>(
        attendanceKeys.byClass(classId),
        (old) => {
          const records = old || [];
          const existing = records.find(
            (r) => r.occurrenceId === newData.occurrenceId
          );

          if (existing) {
            return records.map((r) =>
              r.occurrenceId === newData.occurrenceId
                ? { ...r, status: newData.status }
                : r
            );
          }

          return [
            ...records,
            {
              id: `temp-${Date.now()}`,
              occurrenceId: newData.occurrenceId,
              classId: newData.classId,
              userId: "",
              status: newData.status,
              markedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ];
        }
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          attendanceKeys.byClass(classId),
          context.previous
        );
      }
      showToast("Failed to mark attendance", "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["semesters"] });
    },
  });
}

/**
 * Bulk marks attendance for multiple occurrences.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useBulkAttendance(classId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BulkAttendanceInput) => {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to mark attendance");
      }
      return res.json();
    },
    onSuccess: () => {
      showToast("Attendance marked", "success");
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["semesters"] });
    },
    onError: () => {
      showToast("Failed to mark attendance", "error");
    },
  });
}
