/**
 * TanStack Query Hooks — Occurrences & Calendar Events
 *
 * Purpose: Custom hooks for fetching occurrences for calendar views.
 * Supports date range, single date, and class-specific queries.
 *
 * Reference: PRD Section 12 (Calendar System)
 */
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { showToast } from "@/components/ui/toast";
import type { CreateExtraClassInput } from "@/lib/validations/schemas";

/** Query key factory for occurrences */
export const occurrenceKeys = {
  byClass: (classId: string) => ["occurrences", { classId }] as const,
  byDate: (date: string) => ["occurrences", { date }] as const,
  byDateRange: (from: string, to: string) =>
    ["occurrences", { from, to }] as const,
  bySemester: (semesterId: string) =>
    ["occurrences", { semesterId }] as const,
};

/** Occurrence shape from API */
export interface Occurrence {
  id: string;
  classId: string;
  scheduleSlotId: string | null;
  occurrenceDate: string;
  startTime: string;
  endTime: string;
  location: string | null;
  status: "scheduled" | "cancelled" | "extra" | "rescheduled";
  isExtra: boolean;
  class_?: { id: string; name: string; color: string };
  attendance?: Array<{ id: string; status: string }>;
}

/**
 * Fetches occurrences for a single date (home page day view).
 */
export function useDayOccurrences(date: string) {
  return useQuery<Occurrence[]>({
    queryKey: occurrenceKeys.byDate(date),
    queryFn: async () => {
      const res = await fetch(`/api/occurrences?date=${date}`);
      if (!res.ok) throw new Error("Failed to fetch occurrences");
      return res.json();
    },
    enabled: !!date,
  });
}

/**
 * Fetches occurrences for a date range (week/calendar view).
 */
export function useWeekOccurrences(from: string, to: string) {
  return useQuery<Occurrence[]>({
    queryKey: occurrenceKeys.byDateRange(from, to),
    queryFn: async () => {
      const res = await fetch(
        `/api/occurrences?dateFrom=${from}&dateTo=${to}`
      );
      if (!res.ok) throw new Error("Failed to fetch occurrences");
      return res.json();
    },
    enabled: !!from && !!to,
  });
}

/**
 * Fetches all occurrences for a class.
 */
export function useClassOccurrences(classId: string) {
  return useQuery<Occurrence[]>({
    queryKey: occurrenceKeys.byClass(classId),
    queryFn: async () => {
      const res = await fetch(`/api/occurrences?classId=${classId}`);
      if (!res.ok) throw new Error("Failed to fetch occurrences");
      return res.json();
    },
    enabled: !!classId,
  });
}

/**
 * Creates an extra class occurrence.
 */
export function useCreateExtraClass(classId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateExtraClassInput) => {
      const res = await fetch("/api/occurrences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create extra class");
      }
      return res.json() as Promise<Occurrence>;
    },
    onSuccess: () => {
      showToast("Extra class added", "success");
      queryClient.invalidateQueries({
        queryKey: occurrenceKeys.byClass(classId),
      });
    },
    onError: () => {
      showToast("Failed to add extra class", "error");
    },
  });
}

/**
 * Cancels or updates a class occurrence.
 */
export function useUpdateOccurrence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: { status?: string; occurrenceDate?: string; startTime?: string; endTime?: string };
    }) => {
      const res = await fetch(`/api/occurrences/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update occurrence");
      }
      return res.json() as Promise<Occurrence>;
    },
    onSuccess: () => {
      /* Invalidate all occurrence queries */
      queryClient.invalidateQueries({ queryKey: ["occurrences"] });
    },
    onError: () => {
      showToast("Failed to update class", "error");
    },
  });
}
