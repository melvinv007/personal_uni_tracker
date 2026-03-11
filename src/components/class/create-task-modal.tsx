/**
 * Create Task Modal — Form for adding a new task to a class
 *
 * Fields: Name, Deadline (optional), Is Assignment toggle,
 *         Total Marks (optional, for graded assignments).
 * Uses React Hook Form + Zod validation.
 *
 * Reference: PRD Section 20.5 (Task Form)
 */
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTaskSchema, type CreateTaskInput } from "@/lib/validations/schemas";
import { useCreateTask } from "@/lib/hooks/use-tasks";
import { Modal } from "@/components/ui/modal";
import { FormInput } from "@/components/ui/form-inputs";

interface CreateTaskModalProps {
  classId: string;
  semesterId: string;
  /** Pre-filled deadline date from quick-add (yyyy-MM-dd) */
  defaultDate?: string;
  onClose: () => void;
}

export default function CreateTaskModal({
  classId,
  semesterId,
  defaultDate,
  onClose,
}: CreateTaskModalProps) {
  const createTask = useCreateTask(semesterId, classId);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema) as never,
    defaultValues: {
      name: "",
      deadline: defaultDate ? `${defaultDate}T23:59` : null,
      isAssignment: false,
      totalMarks: null,
      marksScored: null,
      isSubmitted: false,
      classId,
      semesterId,
    },
  });

  const isAssignment = watch("isAssignment");

  const onSubmit = async (data: CreateTaskInput) => {
    await createTask.mutateAsync(data);
    onClose();
  };

  return (
    <Modal isOpen={true} title="New Task" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit as never)} className="space-y-4">
        {/* Name */}
        <FormInput
          label="Task Name"
          placeholder="e.g. Assignment 3, Lab Report"
          error={errors.name?.message}
          {...register("name")}
        />

        {/* Deadline */}
        <FormInput
          label="Deadline"
          type="date"
          error={errors.deadline?.message}
          {...register("deadline")}
        />

        {/* Assignment toggle */}
        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              {...register("isAssignment")}
            />
            <div className="w-9 h-5 bg-surface-elevated rounded-full peer peer-checked:bg-accent-purple transition-colors">
              <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full peer-checked:translate-x-4 transition-transform" />
            </div>
          </label>
          <span className="text-sm text-foreground">This is an assignment</span>
        </div>

        {/* Marks fields (shown if assignment) */}
        {isAssignment && (
          <div className="grid grid-cols-2 gap-3">
            <FormInput
              label="Total Marks"
              type="number"
              placeholder="100"
              error={errors.totalMarks?.message}
              {...register("totalMarks", { valueAsNumber: true })}
            />
            <FormInput
              label="Marks Scored"
              type="number"
              placeholder="—"
              error={errors.marksScored?.message}
              {...register("marksScored", { valueAsNumber: true })}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm text-muted hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="
              flex-1 px-4 py-2.5 rounded-lg
              bg-accent-purple text-white text-sm font-medium
              hover:bg-accent-purple/90
              disabled:opacity-50
              transition-colors
            "
          >
            {isSubmitting ? "Creating..." : "Create Task"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
