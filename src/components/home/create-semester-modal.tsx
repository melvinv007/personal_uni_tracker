/**
 * Create Semester Modal
 *
 * Purpose: Modal form for creating a new semester.
 * Fields: Name, Start Date, End Date, Color.
 * Uses React Hook Form + Zod validation.
 *
 * Reference: PRD Section 20.3 (Semester Form), Section 9.8 (Create Flow)
 */
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createSemesterSchema, type CreateSemesterInput } from "@/lib/validations/schemas";
import { useCreateSemester } from "@/lib/hooks/use-semesters";
import { Modal } from "@/components/ui/modal";
import { FormInput, FormColorPicker } from "@/components/ui/form-inputs";

interface CreateSemesterModalProps {
  onClose: () => void;
}

/** Default semester colors — PRD color system */
const SEMESTER_COLORS = [
  "#a855f7", /* Purple */
  "#3b82f6", /* Blue */
  "#ef4444", /* Red */
  "#f97316", /* Orange */
  "#22c55e", /* Green */
  "#06b6d4", /* Cyan */
  "#ec4899", /* Pink */
  "#eab308", /* Yellow */
  "#8b5cf6", /* Violet */
  "#14b8a6", /* Teal */
];

export default function CreateSemesterModal({
  onClose,
}: CreateSemesterModalProps) {
  const createSemester = useCreateSemester();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateSemesterInput>({
    resolver: zodResolver(createSemesterSchema),
    defaultValues: {
      name: "",
      startDate: "",
      endDate: "",
      color: SEMESTER_COLORS[0],
    },
  });

  const selectedColor = watch("color");

  const onSubmit = async (data: CreateSemesterInput) => {
    await createSemester.mutateAsync(data);
    onClose();
  };

  return (
    <Modal isOpen={true} title="New Semester" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name field */}
        <FormInput
          label="Semester Name"
          placeholder="e.g. Fall 2024"
          error={errors.name?.message}
          {...register("name")}
        />

        {/* Date fields */}
        <div className="grid grid-cols-2 gap-3">
          <FormInput
            label="Start Date"
            type="date"
            error={errors.startDate?.message}
            {...register("startDate")}
          />
          <FormInput
            label="End Date"
            type="date"
            error={errors.endDate?.message}
            {...register("endDate")}
          />
        </div>

        {/* Color picker */}
        <FormColorPicker
          label="Color"
          value={selectedColor}
          onChange={(color) => setValue("color", color)}
          error={errors.color?.message}
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
            {isSubmitting ? "Creating..." : "Create Semester"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
