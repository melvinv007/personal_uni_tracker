/**
 * TanStack Query Hooks — Tasks & Assignments
 *
 * Purpose: Custom hooks for fetching and mutating tasks/assignments.
 * Implements optimistic updates + completion animation support.
 *
 * Reference: PRD Section 14 (Tasks & Assignments)
 */
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { showToast } from "@/components/ui/toast";
import { classKeys } from "./use-classes";
import { semesterKeys } from "./use-semesters";
import type { CreateTaskInput, UpdateTaskInput } from "@/lib/validations/schemas";

/** Query key factory for tasks */
export const taskKeys = {
  bySemester: (semesterId: string) => ["tasks", { semesterId }] as const,
  byClass: (classId: string) => ["tasks", { classId }] as const,
};

/** Task shape from the API */
export interface Task {
  id: string;
  classId: string | null;
  semesterId: string;
  userId: string;
  name: string;
  deadline: string | null;
  isCompleted: boolean | null;
  completedAt: string | null;
  marksScored: string | null;
  totalMarks: string | null;
  isAssignment: boolean | null;
  isSubmitted: boolean | null;
  linkedExamId: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Fetches tasks for a semester.
 */
export function useSemesterTasks(semesterId: string) {
  return useQuery<Task[]>({
    queryKey: taskKeys.bySemester(semesterId),
    queryFn: async () => {
      const res = await fetch(`/api/tasks?semesterId=${semesterId}`);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
    enabled: !!semesterId,
  });
}

/**
 * Fetches tasks for a class.
 */
export function useClassTasks(classId: string) {
  return useQuery<Task[]>({
    queryKey: taskKeys.byClass(classId),
    queryFn: async () => {
      const res = await fetch(`/api/tasks?classId=${classId}`);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
    enabled: !!classId,
  });
}

/**
 * Creates a new task with optimistic update.
 */
export function useCreateTask(semesterId: string, classId?: string) {
  const queryClient = useQueryClient();
  const queryKey = classId
    ? taskKeys.byClass(classId)
    : taskKeys.bySemester(semesterId);

  return useMutation({
    mutationFn: async (data: CreateTaskInput) => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create task");
      }
      return res.json() as Promise<Task>;
    },
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Task[]>(queryKey);

      const optimistic: Task = {
        id: `temp-${Date.now()}`,
        classId: newData.classId || null,
        semesterId: newData.semesterId,
        userId: "",
        name: newData.name,
        deadline: newData.deadline || null,
        isCompleted: false,
        completedAt: null,
        marksScored: newData.marksScored != null ? String(newData.marksScored) : null,
        totalMarks: newData.totalMarks != null ? String(newData.totalMarks) : null,
        isAssignment: newData.isAssignment ?? false,
        isSubmitted: newData.isSubmitted ?? false,
        linkedExamId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<Task[]>(queryKey, (old) => [
        ...(old || []),
        optimistic,
      ]);

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      showToast("Failed to create task", "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      if (classId) {
        queryClient.invalidateQueries({ queryKey: classKeys.detail(classId) });
      }
      queryClient.invalidateQueries({ queryKey: semesterKeys.detail(semesterId) });
    },
    onSuccess: () => {
      showToast("Task created", "success");
    },
  });
}

/**
 * Updates a task with optimistic update.
 * Handles completion toggle with timestamp.
 */
export function useUpdateTask(semesterId: string, classId?: string) {
  const queryClient = useQueryClient();
  const queryKey = classId
    ? taskKeys.byClass(classId)
    : taskKeys.bySemester(semesterId);

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTaskInput }) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update task");
      }
      return res.json() as Promise<Task>;
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Task[]>(queryKey);

      /* Cast numeric fields to strings for optimistic cache consistency */
      const optimisticData: Partial<Task> = {
        ...data,
        marksScored: data.marksScored != null ? String(data.marksScored) : undefined,
        totalMarks: data.totalMarks != null ? String(data.totalMarks) : undefined,
      };

      queryClient.setQueryData<Task[]>(queryKey, (old) =>
        (old || []).map((t) => (t.id === id ? { ...t, ...optimisticData } : t))
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      showToast("Failed to update task", "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

/**
 * Deletes a task with optimistic removal + undo support.
 */
export function useDeleteTask(semesterId: string, classId?: string) {
  const queryClient = useQueryClient();
  const queryKey = classId
    ? taskKeys.byClass(classId)
    : taskKeys.bySemester(semesterId);

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete task");
      return res.json();
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Task[]>(queryKey);

      queryClient.setQueryData<Task[]>(queryKey, (old) =>
        (old || []).filter((t) => t.id !== id)
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      showToast("Failed to delete task", "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
