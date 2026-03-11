/**
 * Edit Task Modal — Edit or delete an existing task
 *
 * Component: EditTaskModal
 * Purpose: Modal form for updating task name, deadline, assignment toggle,
 * marks, and submission status. Delete option inside modal per PRD §21.5.
 *
 * Props:
 * - task: The task to edit
 * - classId: Current class ID
 * - semesterId: Current semester ID
 * - onClose: Callback to close the modal
 *
 * Appears on: Class page (tasks section)
 *
 * Reference: PRD Section 14 (Tasks & Assignments), Section 21.5 (Edit Modals)
 */
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateTaskSchema, type UpdateTaskInput } from "@/lib/validations/schemas";
import { useUpdateTask, useDeleteTask } from "@/lib/hooks/use-tasks";
import type { Task } from "@/lib/hooks/use-tasks";
import { Modal } from "@/components/ui/modal";
import { FormInput } from "@/components/ui/form-inputs";
import { DeleteConfirmation } from "@/components/ui/delete-confirmation";
import { showToast } from "@/components/ui/toast";

interface EditTaskModalProps {
  task: Task;
  classId: string;
  semesterId: string;
  onClose: () => void;
}

/**
 * EditTaskModal — edit form for tasks/assignments with delete option.
 */
export default function EditTaskModal({
  task,
  classId,
  semesterId,
  onClose,
}: EditTaskModalProps) {
  const updateTask = useUpdateTask(semesterId, classId);
  const deleteTask = useDeleteTask(semesterId, classId);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UpdateTaskInput>({
    resolver: zodResolver(updateTaskSchema),
    defaultValues: {
      name: task.name,
      deadline: task.deadline || "",
      isAssignment: task.isAssignment ?? false,
      marksScored: task.marksScored != null ? parseFloat(task.marksScored) : null,
      totalMarks: task.totalMarks != null ? parseFloat(task.totalMarks) : null,
      isSubmitted: task.isSubmitted ?? false,
    },
  });

  const isAssignment = watch("isAssignment");

  /* Submit updated fields */
  const onSubmit = (data: UpdateTaskInput) => {
    updateTask.mutate(
      { id: task.id, data },
      {
        onSuccess: () => {
          showToast("Task updated", "success");
          onClose();
        },
      }
    );
  };

  /* Delete the task */
  const handleDelete = () => {
    deleteTask.mutate(task.id, {
      onSuccess: () => {
        showToast("Task deleted", "success");
        onClose();
      },
    });
  };

  return (
    <>
      <Modal isOpen={true} title={`Edit ${task.name}`} onClose={onClose}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Task name */}
          <FormInput
            label="Name"
            placeholder="e.g. Submit lab report"
            {...register("name")}
            error={errors.name?.message}
            isRequired
          />

          {/* Deadline */}
          <FormInput
            label="Deadline"
            type="datetime-local"
            {...register("deadline")}
            error={errors.deadline?.message}
          />

          {/* Assignment toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isAssignment"
              {...register("isAssignment")}
              className="rounded border-border bg-surface text-accent-purple focus:ring-accent-purple"
            />
            <label htmlFor="isAssignment" className="text-sm text-foreground">
              This is an assignment
            </label>
          </div>

          {/* Assignment-specific fields */}
          {isAssignment && (
            <div className="space-y-3 pl-4 border-l-2 border-accent-purple/30">
              <div className="grid grid-cols-2 gap-3">
                <FormInput
                  label="Marks Scored"
                  type="number"
                  step="0.01"
                  {...register("marksScored", { valueAsNumber: true })}
                  error={errors.marksScored?.message}
                />
                <FormInput
                  label="Total Marks"
                  type="number"
                  step="0.01"
                  {...register("totalMarks", { valueAsNumber: true })}
                  error={errors.totalMarks?.message}
                />
              </div>

              {/* Submission toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isSubmitted"
                  {...register("isSubmitted")}
                  className="rounded border-border bg-surface text-accent-green focus:ring-accent-green"
                />
                <label htmlFor="isSubmitted" className="text-sm text-foreground">
                  Submitted
                </label>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-xs text-accent-red hover:text-accent-red/80 transition-colors"
            >
              Delete Task
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || updateTask.isPending}
                className="px-4 py-2 text-sm font-medium bg-accent-purple text-white rounded-lg hover:bg-accent-purple/90 transition-colors disabled:opacity-50"
              >
                {updateTask.isPending ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation — PRD §20.9 */}
      <DeleteConfirmation
        isOpen={showDeleteConfirm}
        itemName={task.name}
        onConfirm={handleDelete}
        onClose={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
