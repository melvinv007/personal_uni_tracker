/**
 * Create Assignment Modal — Form for adding a new assignment to a class
 *
 * Fields: Name (required), Deadline (optional datetime),
 * Marks Scored (optional), Total Marks (optional), Submitted toggle.
 * Always creates with isAssignment=true.
 */
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTaskSchema, type CreateTaskInput } from "@/lib/validations/schemas";
import { useCreateTask } from "@/lib/hooks/use-tasks";
import { Modal } from "@/components/ui/modal";
import { FormInput } from "@/components/ui/form-inputs";

interface CreateAssignmentModalProps {
  classId: string;
  semesterId: string;
  onClose: () => void;
}

export default function CreateAssignmentModal({
  classId,
  semesterId,
  onClose,
}: CreateAssignmentModalProps) {
  const createTask = useCreateTask(semesterId, classId);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema) as never,
    defaultValues: {
      name: "",
      deadline: null,
      isAssignment: true,
      marksScored: null,
      totalMarks: null,
      isSubmitted: false,
      classId,
      semesterId,
    },
  });

  const onSubmit = async (data: CreateTaskInput) => {
    await createTask.mutateAsync({
      ...data,
      isAssignment: true,
      classId,
      semesterId,
    });
    onClose();
  };

  return (
    <Modal isOpen={true} title="New Assignment" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit as never)} className="space-y-4">
        <FormInput
          label="Name"
          placeholder="e.g. Assignment 3"
          error={errors.name?.message}
          {...register("name")}
        />

        <FormInput
          label="Deadline"
          type="datetime-local"
          error={errors.deadline?.message}
          {...register("deadline")}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormInput
            label="Marks Scored"
            type="number"
            step="0.01"
            placeholder="—"
            error={errors.marksScored?.message}
            {...register("marksScored", { valueAsNumber: true })}
          />
          <FormInput
            label="Total Marks"
            type="number"
            step="0.01"
            placeholder="—"
            error={errors.totalMarks?.message}
            {...register("totalMarks", { valueAsNumber: true })}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="assignmentSubmitted"
            type="checkbox"
            {...register("isSubmitted")}
            className="rounded border-border bg-surface text-accent-green focus:ring-accent-green"
          />
          <label htmlFor="assignmentSubmitted" className="text-sm text-foreground">
            Submitted
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm text-muted transition-colors hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 rounded-lg bg-accent-purple px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-purple/90 disabled:opacity-50"
          >
            {isSubmitting ? "Creating..." : "Create Assignment"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
