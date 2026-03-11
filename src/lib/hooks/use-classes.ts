/**
 * TanStack Query Hooks — Classes
 *
 * Purpose: Custom hooks for fetching and mutating class data.
 * Implements optimistic updates for all mutations.
 *
 * Reference: PRD Section 8.2, Section 11 (Class Detail Page)
 */
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { showToast } from "@/components/ui/toast";
import { semesterKeys } from "./use-semesters";
import type { CreateClassInput, UpdateClassInput } from "@/lib/validations/schemas";

/** Query key factory for classes */
export const classKeys = {
  bySemester: (semesterId: string) => ["classes", { semesterId }] as const,
  detail: (id: string) => ["classes", id] as const,
};

/** Class shape from the API */
export interface ClassData {
  id: string;
  semesterId: string;
  userId: string;
  name: string;
  color: string;
  category: string;
  credits: number;
  startDate: string;
  endDate: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Class detail with all relations */
export interface ClassDetail extends ClassData {
  semester: { id: string; name: string; color: string };
  scheduleSlots: Array<{
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    location: string | null;
    validFrom: string;
    validUntil: string | null;
  }>;
  occurrences: Array<{
    id: string;
    occurrenceDate: string;
    startTime: string;
    endTime: string;
    status: string;
    isExtra: boolean;
    attendance: Array<{ id: string; status: string }>;
  }>;
  attendance: Array<{
    id: string;
    occurrenceId: string;
    status: string;
    markedAt: string;
  }>;
  tasks: Array<{
    id: string;
    name: string;
    deadline: string | null;
    isCompleted: boolean | null;
    isAssignment: boolean | null;
    isSubmitted: boolean | null;
    marksScored: string | null;
    totalMarks: string | null;
  }>;
  exams: Array<{
    id: string;
    name: string;
    examDate: string;
    marksScored: string | null;
    totalMarks: string;
    weightage: string;
  }>;
  syllabusRubric: Array<{
    id: string;
    components: Array<{ name: string; weightage_percent: number }>;
  }>;
  letterGrade: Array<{ id: string; grade: string; gradePoints: string }>;
  files: Array<{
    id: string;
    displayName: string;
    sortOrder: number | null;
    handleValid: boolean | null;
  }>;
}

/**
 * Fetches all classes for a semester.
 */
export function useClasses(semesterId: string) {
  return useQuery<ClassData[]>({
    queryKey: classKeys.bySemester(semesterId),
    queryFn: async () => {
      const res = await fetch(`/api/classes?semesterId=${semesterId}`);
      if (!res.ok) throw new Error("Failed to fetch classes");
      return res.json();
    },
    enabled: !!semesterId,
  });
}

/**
 * Fetches a single class with all relations.
 */
export function useClass(id: string) {
  return useQuery<ClassDetail>({
    queryKey: classKeys.detail(id),
    queryFn: async () => {
      const res = await fetch(`/api/classes/${id}`);
      if (!res.ok) throw new Error("Failed to fetch class");
      return res.json();
    },
    enabled: !!id,
  });
}

/**
 * Creates a new class with optimistic update.
 */
export function useCreateClass(semesterId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateClassInput & { semesterId: string }) => {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create class");
      }
      return res.json() as Promise<ClassData>;
    },
    onMutate: async (newData) => {
      await queryClient.cancelQueries({
        queryKey: classKeys.bySemester(semesterId),
      });
      const previous = queryClient.getQueryData<ClassData[]>(
        classKeys.bySemester(semesterId)
      );

      const optimistic: ClassData = {
        id: `temp-${Date.now()}`,
        semesterId,
        userId: "",
        name: newData.name,
        color: newData.color || "#a855f7",
        category: newData.category,
        credits: newData.credits,
        startDate: newData.startDate || "",
        endDate: newData.endDate || "",
        notes: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<ClassData[]>(
        classKeys.bySemester(semesterId),
        (old) => [...(old || []), optimistic]
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          classKeys.bySemester(semesterId),
          context.previous
        );
      }
      showToast("Failed to create class", "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: classKeys.bySemester(semesterId),
      });
      queryClient.invalidateQueries({ queryKey: semesterKeys.detail(semesterId) });
    },
    onSuccess: () => {
      showToast("Class created", "success");
    },
  });
}

/**
 * Updates a class with optimistic update.
 */
export function useUpdateClass(id: string, semesterId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateClassInput) => {
      const res = await fetch(`/api/classes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update class");
      }
      return res.json() as Promise<ClassData>;
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: classKeys.detail(id) });
      const previous = queryClient.getQueryData<ClassDetail>(classKeys.detail(id));

      queryClient.setQueryData<ClassDetail>(classKeys.detail(id), (old) =>
        old ? { ...old, ...updates } : old
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(classKeys.detail(id), context.previous);
      }
      showToast("Failed to update class", "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.detail(id) });
      queryClient.invalidateQueries({
        queryKey: classKeys.bySemester(semesterId),
      });
    },
  });
}

/**
 * Deletes a class with optimistic removal.
 */
export function useDeleteClass(semesterId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/classes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete class");
      return res.json();
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: classKeys.bySemester(semesterId),
      });
      const previous = queryClient.getQueryData<ClassData[]>(
        classKeys.bySemester(semesterId)
      );

      queryClient.setQueryData<ClassData[]>(
        classKeys.bySemester(semesterId),
        (old) => (old || []).filter((c) => c.id !== id)
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          classKeys.bySemester(semesterId),
          context.previous
        );
      }
      showToast("Failed to delete class", "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: classKeys.bySemester(semesterId),
      });
      queryClient.invalidateQueries({ queryKey: semesterKeys.detail(semesterId) });
    },
  });
}
