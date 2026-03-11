/**
 * Edit Exam Modal — Edit or delete an existing exam
 *
 * Component: EditExamModal
 * Purpose: Modal form for updating exam name, date, marks, weightage.
 * Delete option inside modal per PRD §21.5.
 *
 * Props:
 * - exam: The exam to edit
 * - classId: Current class ID
 * - onClose: Callback to close the modal
 *
 * Appears on: Class page (exams section)
 *
 * Reference: PRD Section 15 (Exams & Grades), Section 21.5
 */
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateExamSchema, type UpdateExamInput } from "@/lib/validations/schemas";
import { useUpdateExam, useDeleteExam } from "@/lib/hooks/use-exams";
import type { Exam } from "@/lib/hooks/use-exams";
import { Modal } from "@/components/ui/modal";
import { FormInput } from "@/components/ui/form-inputs";
import { DeleteConfirmation } from "@/components/ui/delete-confirmation";
import { showToast } from "@/components/ui/toast";

interface EditExamModalProps {
  exam: Exam;
  classId: string;
  onClose: () => void;
}

/**
 * EditExamModal — edit form for exams with delete option.
 */
export default function EditExamModal({
  exam,
  classId,
  onClose,
}: EditExamModalProps) {
  const updateExam = useUpdateExam(classId);
  const deleteExam = useDeleteExam(classId);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateExamInput>({
    resolver: zodResolver(updateExamSchema),
    defaultValues: {
      name: exam.name,
      examDate: exam.examDate,
      marksScored: exam.marksScored != null ? parseFloat(exam.marksScored) : null,
      totalMarks: parseFloat(exam.totalMarks),
      weightage: parseFloat(exam.weightage),
    },
  });

  /* Submit updated fields */
  const onSubmit = (data: UpdateExamInput) => {
    updateExam.mutate(
      { id: exam.id, data },
      {
        onSuccess: () => {
          showToast("Exam updated", "success");
          onClose();
        },
      }
    );
  };

  /* Delete the exam */
  const handleDelete = () => {
    deleteExam.mutate(exam.id, {
      onSuccess: () => {
        showToast("Exam deleted", "success");
        onClose();
      },
    });
  };

  return (
    <>
      <Modal isOpen={true} title={`Edit ${exam.name}`} onClose={onClose}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Exam name */}
          <FormInput
            label="Exam Name"
            placeholder="e.g. CAT 1, Final Exam"
            {...register("name")}
            error={errors.name?.message}
            isRequired
          />

          {/* Date */}
          <FormInput
            label="Date"
            type="date"
            {...register("examDate")}
            error={errors.examDate?.message}
            isRequired
          />

          {/* Marks row */}
          <div className="grid grid-cols-2 gap-3">
            <FormInput
              label="Marks Scored"
              type="number"
              step="0.01"
              placeholder="–"
              {...register("marksScored", { valueAsNumber: true })}
              error={errors.marksScored?.message}
            />
            <FormInput
              label="Total Marks"
              type="number"
              step="0.01"
              {...register("totalMarks", { valueAsNumber: true })}
              error={errors.totalMarks?.message}
              isRequired
            />
          </div>

          {/* Weightage */}
          <FormInput
            label="Weightage (%)"
            type="number"
            step="0.1"
            {...register("weightage", { valueAsNumber: true })}
            error={errors.weightage?.message}
            isRequired
          />

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-xs text-accent-red hover:text-accent-red/80 transition-colors"
            >
              Delete Exam
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
                disabled={isSubmitting || updateExam.isPending}
                className="px-4 py-2 text-sm font-medium bg-accent-purple text-white rounded-lg hover:bg-accent-purple/90 transition-colors disabled:opacity-50"
              >
                {updateExam.isPending ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation — PRD §20.9 */}
      <DeleteConfirmation
        isOpen={showDeleteConfirm}
        itemName={exam.name}
        onConfirm={handleDelete}
        onClose={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
