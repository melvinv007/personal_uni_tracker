/**
 * TanStack Query Hooks — Non-Academic Events
 *
 * Purpose: Custom hooks for fetching and mutating non-academic events.
 * Implements optimistic updates for create, update, and delete operations.
 * Non-academic events appear on the calendar but are excluded from all academic stats.
 *
 * Reference: PRD Section 12.4 (Non-Academic Events), Section 21.1 (Optimistic UI)
 */
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { showToast } from "@/components/ui/toast";
import { useUndoToast } from "./use-undo-toast";
// import { semesterKeys } from "./use-semesters";
import type { CreateNonAcademicEventInput } from "@/lib/validations/schemas";

/** Query key factory for non-academic events */
export const eventKeys = {
  all: ["events"] as const,
  bySemester: (semesterId: string) =>
    ["events", { semesterId }] as const,
};

/** Non-academic event shape from the API */
export interface NonAcademicEvent {
  id: string;
  userId: string;
  semesterId: string | null;
  name: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string | null;
  color: string | null;
  notes: string | null;
  createdAt: string;
}

/**
 * Fetches all non-academic events, optionally filtered by semester.
 */
export function useEvents(semesterId?: string) {
  const url = semesterId
    ? `/api/events?semesterId=${semesterId}`
    : "/api/events";

  return useQuery<NonAcademicEvent[]>({
    queryKey: semesterId
      ? eventKeys.bySemester(semesterId)
      : eventKeys.all,
    queryFn: async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch events");
      const data = await res.json();
      return data.data ?? data;
    },
  });
}

/**
 * Creates a non-academic event with optimistic update.
 */
export function useCreateEvent(semesterId?: string) {
  const queryClient = useQueryClient();
  const queryKey = semesterId
    ? eventKeys.bySemester(semesterId)
    : eventKeys.all;

  return useMutation({
    mutationFn: async (data: CreateNonAcademicEventInput) => {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create event");
      }
      const json = await res.json();
      return (json.data ?? json) as NonAcademicEvent;
    },
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<NonAcademicEvent[]>(queryKey);

      /* Optimistic placeholder */
      const optimistic: NonAcademicEvent = {
        id: `temp-${Date.now()}`,
        userId: "",
        semesterId: newData.semesterId ?? null,
        name: newData.name,
        eventDate: newData.eventDate,
        startTime: newData.startTime,
        endTime: newData.endTime,
        location: newData.location ?? null,
        color: newData.color ?? null,
        notes: newData.notes ?? null,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<NonAcademicEvent[]>(queryKey, (old) => [
        ...(old || []),
        optimistic,
      ]);

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      showToast("Failed to create event", "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["semesters"] });
      queryClient.invalidateQueries({ queryKey: ["occurrences"] });
    },
    onSuccess: () => {
      showToast("Event created", "success");
    },
  });
}

/** Update input — partial fields for PATCH */
export type UpdateNonAcademicEventInput = Partial<
  Omit<CreateNonAcademicEventInput, "semesterId">
>;

/**
 * Updates a non-academic event with optimistic update.
 */
export function useUpdateEvent(semesterId?: string) {
  const queryClient = useQueryClient();
  const queryKey = semesterId
    ? eventKeys.bySemester(semesterId)
    : eventKeys.all;

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateNonAcademicEventInput;
    }) => {
      const res = await fetch(`/api/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update event");
      }
      const json = await res.json();
      return (json.data ?? json) as NonAcademicEvent;
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<NonAcademicEvent[]>(queryKey);

      queryClient.setQueryData<NonAcademicEvent[]>(queryKey, (old) =>
        (old || []).map((e) => (e.id === id ? { ...e, ...data } : e))
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      showToast("Failed to update event", "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["semesters"] });
      queryClient.invalidateQueries({ queryKey: ["occurrences"] });
    },
  });
}

/**
 * Deletes a non-academic event with optimistic removal.
 */
export function useDeleteEvent(semesterId?: string) {
  const queryClient = useQueryClient();
  const { showUndoToast } = useUndoToast();
  const queryKey = semesterId
    ? eventKeys.bySemester(semesterId)
    : eventKeys.all;

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete event");
      return res.json();
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<NonAcademicEvent[]>(queryKey);

      queryClient.setQueryData<NonAcademicEvent[]>(queryKey, (old) =>
        (old || []).filter((e) => e.id !== id)
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      showToast("Failed to delete event", "error");
    },
    onSuccess: (_data, id) => {
      showUndoToast({
        id,
        entityName: "Event",
        apiPath: "/api/events",
        invalidateKeys: [["events"], ["semesters"], ["occurrences"]],
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["semesters"] });
      queryClient.invalidateQueries({ queryKey: ["occurrences"] });
    },
  });
}
