/**
 * TanStack Query Hooks — Exams
 *
 * Purpose: Custom hooks for fetching and mutating exam data.
 * Implements optimistic updates.
 *
 * Reference: PRD Section 15 (Exams & Grades)
 */
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { showToast } from "@/components/ui/toast";
import { useUndoToast } from "./use-undo-toast";
import type { CreateExamInput, UpdateExamInput } from "@/lib/validations/schemas";

/** Query key factory for exams */
export const examKeys = {
  byClass: (classId: string) => ["exams", { classId }] as const,
};

/** Exam shape from the API */
export interface Exam {
  id: string;
  classId: string;
  userId: string;
  name: string;
  examDate: string;
  marksScored: string | null;
  totalMarks: string;
  weightage: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Fetches all exams for a class.
 */
export function useExams(classId: string) {
  return useQuery<Exam[]>({
    queryKey: examKeys.byClass(classId),
    queryFn: async () => {
      const res = await fetch(`/api/exams?classId=${classId}`);
      if (!res.ok) throw new Error("Failed to fetch exams");
      return res.json();
    },
    enabled: !!classId,
  });
}

/**
 * Creates an exam with optimistic update.
 */
export function useCreateExam(classId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateExamInput) => {
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create exam");
      }
      return res.json() as Promise<Exam>;
    },
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: examKeys.byClass(classId) });
      const previous = queryClient.getQueryData<Exam[]>(
        examKeys.byClass(classId)
      );

      const optimistic: Exam = {
        id: `temp-${Date.now()}`,
        classId: newData.classId,
        userId: "",
        name: newData.name,
        examDate: newData.examDate,
        marksScored: newData.marksScored != null ? String(newData.marksScored) : null,
        totalMarks: String(newData.totalMarks),
        weightage: String(newData.weightage),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<Exam[]>(examKeys.byClass(classId), (old) => [
        ...(old || []),
        optimistic,
      ]);

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(examKeys.byClass(classId), context.previous);
      }
      showToast("Failed to create exam", "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["semesters"] });
      queryClient.invalidateQueries({ queryKey: ["occurrences"] });
    },
    onSuccess: () => {
      showToast("Exam created", "success");
    },
  });
}

/**
 * Updates an exam with optimistic update.
 */
export function useUpdateExam(classId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateExamInput }) => {
      const res = await fetch(`/api/exams/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update exam");
      }
      return res.json() as Promise<Exam>;
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: examKeys.byClass(classId) });
      const previous = queryClient.getQueryData<Exam[]>(
        examKeys.byClass(classId)
      );

      // Cast numeric fields to strings for optimistic cache (DB stores decimals as strings)
      const optimisticData: Partial<Exam> = {
        ...data,
        marksScored:
          data.marksScored != null ? String(data.marksScored) : undefined,
        totalMarks:
          data.totalMarks != null ? String(data.totalMarks) : undefined,
        weightage: data.weightage != null ? String(data.weightage) : undefined,
      };

      queryClient.setQueryData<Exam[]>(examKeys.byClass(classId), (old) =>
        (old || []).map((e) =>
          e.id === id ? { ...e, ...optimisticData } : e
        )
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(examKeys.byClass(classId), context.previous);
      }
      showToast("Failed to update exam", "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["semesters"] });
      queryClient.invalidateQueries({ queryKey: ["occurrences"] });
    },
  });
}

/**
 * Deletes an exam with optimistic removal.
 */
export function useDeleteExam(classId: string) {
  const queryClient = useQueryClient();
  const { showUndoToast } = useUndoToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/exams/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete exam");
      return res.json();
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: examKeys.byClass(classId) });
      const previous = queryClient.getQueryData<Exam[]>(
        examKeys.byClass(classId)
      );

      queryClient.setQueryData<Exam[]>(examKeys.byClass(classId), (old) =>
        (old || []).filter((e) => e.id !== id)
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(examKeys.byClass(classId), context.previous);
      }
      showToast("Failed to delete exam", "error");
    },
    onSuccess: (_data, id) => {
      showUndoToast({
        id,
        entityName: "Exam",
        apiPath: "/api/exams",
        invalidateKeys: [["exams"], ["classes"], ["semesters"], ["occurrences"]],
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["semesters"] });
      queryClient.invalidateQueries({ queryKey: ["occurrences"] });
    },
  });
}
