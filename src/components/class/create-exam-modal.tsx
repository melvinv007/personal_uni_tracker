/**
 * Create Exam Modal — Form for adding a new exam to a class
 *
 * Fields: Name, Exam Date, Total Marks, Weightage (%), Marks Scored (optional).
 * Uses React Hook Form + Zod validation.
 *
 * Reference: PRD Section 20.6 (Exam Form)
 */
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createExamSchema, type CreateExamInput } from "@/lib/validations/schemas";
import { useCreateExam } from "@/lib/hooks/use-exams";
import { Modal } from "@/components/ui/modal";
import { FormInput } from "@/components/ui/form-inputs";

interface CreateExamModalProps {
  classId: string;
  /** Pre-filled exam date from quick-add (yyyy-MM-dd) */
  defaultDate?: string;
  onClose: () => void;
}

export default function CreateExamModal({
  classId,
  defaultDate,
  onClose,
}: CreateExamModalProps) {
  const createExam = useCreateExam(classId);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateExamInput>({
    resolver: zodResolver(createExamSchema),
    defaultValues: {
      name: "",
      examDate: defaultDate || "",
      totalMarks: 100,
      weightage: 0,
      marksScored: null,
      classId,
    },
  });

  const onSubmit = async (data: CreateExamInput) => {
    await createExam.mutateAsync(data);
    onClose();
  };

  return (
    <Modal isOpen={true} title="New Exam" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Exam name */}
        <FormInput
          label="Exam Name"
          placeholder="e.g. Midterm, Quiz 1"
          error={errors.name?.message}
          {...register("name")}
        />

        {/* Date */}
        <FormInput
          label="Exam Date"
          type="date"
          error={errors.examDate?.message}
          {...register("examDate")}
        />

        {/* Total Marks + Weightage */}
        <div className="grid grid-cols-2 gap-3">
          <FormInput
            label="Total Marks"
            type="number"
            min={1}
            error={errors.totalMarks?.message}
            {...register("totalMarks", { valueAsNumber: true })}
          />
          <FormInput
            label="Weightage (%)"
            type="number"
            min={0}
            max={100}
            error={errors.weightage?.message}
            {...register("weightage", { valueAsNumber: true })}
          />
        </div>

        {/* Marks Scored (optional — can add later) */}
        <FormInput
          label="Marks Scored (optional)"
          type="number"
          placeholder="Add after exam"
          error={errors.marksScored?.message}
          {...register("marksScored", { valueAsNumber: true })}
        />

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
            {isSubmitting ? "Creating..." : "Create Exam"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
