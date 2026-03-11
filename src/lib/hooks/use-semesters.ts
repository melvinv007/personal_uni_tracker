/**
 * TanStack Query Hooks — Semesters
 *
 * Purpose: Custom hooks for fetching and mutating semester data.
 * Implements optimistic updates for all mutations.
 *
 * Reference: PRD Section 8.2 (Server State → TanStack Query)
 */
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { showToast } from "@/components/ui/toast";
import type { CreateSemesterInput, UpdateSemesterInput } from "@/lib/validations/schemas";

/** Query key factory for semesters */
export const semesterKeys = {
  all: ["semesters"] as const,
  detail: (id: string) => ["semesters", id] as const,
};

/** Semester shape from the API */
export interface Semester {
  id: string;
  userId: string;
  name: string;
  startDate: string;
  endDate: string;
  color: string;
  credits: number | null;
  creditsManualOverride: boolean | null;
  isActive: boolean | null;
  isCompleted: boolean | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Semester detail with relations */
export interface SemesterDetail extends Semester {
  classes: Array<{
    id: string;
    name: string;
    color: string;
    category: string;
    credits: number;
    scheduleSlots: Array<{ id: string; dayOfWeek: number; startTime: string; endTime: string; location: string | null }>;
    exams: Array<{ id: string; name: string; examDate: string; marksScored: string | null; totalMarks: string; weightage: string }>;
    letterGrade: Array<{ id: string; grade: string; gradePoints: string }>;
  }>;
  tasks: Array<{ id: string; name: string; deadline: string | null; isCompleted: boolean | null; isAssignment: boolean | null }>;
  nonAcademicEvents: Array<{ id: string; name: string; eventDate: string; startTime: string; endTime: string }>;
  letterGrades: Array<{ id: string; classId: string; grade: string; gradePoints: string }>;
  officialGrades: Array<{ id: string; spi: string | null }>;
}

/**
 * Fetches all semesters for the current user.
 */
export function useSemesters() {
  return useQuery<Semester[]>({
    queryKey: semesterKeys.all,
    queryFn: async () => {
      const res = await fetch("/api/semesters");
      if (!res.ok) throw new Error("Failed to fetch semesters");
      return res.json();
    },
  });
}

/**
 * Fetches a single semester with all its relations.
 */
export function useSemester(id: string) {
  return useQuery<SemesterDetail>({
    queryKey: semesterKeys.detail(id),
    queryFn: async () => {
      const res = await fetch(`/api/semesters/${id}`);
      if (!res.ok) throw new Error("Failed to fetch semester");
      return res.json();
    },
    enabled: !!id,
  });
}

/**
 * Creates a new semester with optimistic update.
 * Immediately adds the semester to the list before server responds.
 */
export function useCreateSemester() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSemesterInput) => {
      const res = await fetch("/api/semesters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create semester");
      }
      return res.json() as Promise<Semester>;
    },
    /* Optimistic update — add semester to list immediately */
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: semesterKeys.all });
      const previous = queryClient.getQueryData<Semester[]>(semesterKeys.all);

      const optimistic: Semester = {
        id: `temp-${Date.now()}`,
        userId: "",
        name: newData.name,
        startDate: newData.startDate,
        endDate: newData.endDate,
        color: newData.color,
        credits: null,
        creditsManualOverride: false,
        isActive: false,
        isCompleted: false,
        notes: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<Semester[]>(semesterKeys.all, (old) => [
        optimistic,
        ...(old || []),
      ]);

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(semesterKeys.all, context.previous);
      }
      showToast("Failed to create semester", "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: semesterKeys.all });
    },
    onSuccess: () => {
      showToast("Semester created", "success");
    },
  });
}

/**
 * Updates a semester with optimistic update.
 */
export function useUpdateSemester(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateSemesterInput) => {
      const res = await fetch(`/api/semesters/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update semester");
      }
      return res.json() as Promise<Semester>;
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: semesterKeys.all });
      await queryClient.cancelQueries({ queryKey: semesterKeys.detail(id) });

      const previousAll = queryClient.getQueryData<Semester[]>(semesterKeys.all);
      const previousDetail = queryClient.getQueryData<SemesterDetail>(semesterKeys.detail(id));

      /* Optimistic update on list */
      queryClient.setQueryData<Semester[]>(semesterKeys.all, (old) =>
        (old || []).map((s) => (s.id === id ? { ...s, ...updates } : s))
      );

      /* If setting active, deactivate others */
      if (updates.isActive) {
        queryClient.setQueryData<Semester[]>(semesterKeys.all, (old) =>
          (old || []).map((s) => ({
            ...s,
            isActive: s.id === id ? true : false,
          }))
        );
      }

      return { previousAll, previousDetail };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousAll) {
        queryClient.setQueryData(semesterKeys.all, context.previousAll);
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(semesterKeys.detail(id), context.previousDetail);
      }
      showToast("Failed to update semester", "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: semesterKeys.all });
      queryClient.invalidateQueries({ queryKey: semesterKeys.detail(id) });
    },
  });
}

/**
 * Deletes a semester with optimistic removal + undo toast.
 */
export function useDeleteSemester() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/semesters/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete semester");
      return res.json();
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: semesterKeys.all });
      const previous = queryClient.getQueryData<Semester[]>(semesterKeys.all);

      queryClient.setQueryData<Semester[]>(semesterKeys.all, (old) =>
        (old || []).filter((s) => s.id !== id)
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(semesterKeys.all, context.previous);
      }
      showToast("Failed to delete semester", "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: semesterKeys.all });
    },
  });
}
