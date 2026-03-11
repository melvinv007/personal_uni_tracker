/**
 * Edit Semester Modal — Edit or delete an existing semester
 *
 * Component: EditSemesterModal
 * Purpose: Modal form for updating semester name, dates, color,
 * and active/completed status. Also contains the delete option.
 *
 * Props:
 * - semester: The semester to edit
 * - onClose: Callback to close the modal
 *
 * Appears on: Home page (semester card edit button)
 *
 * Reference: PRD Section 9.5 (Edit button), Section 20.3 (Form fields),
 * Section 21.5 (Edit & Delete Availability)
 */
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateSemesterSchema, type UpdateSemesterInput } from "@/lib/validations/schemas";
import { useUpdateSemester, useDeleteSemester, type Semester } from "@/lib/hooks/use-semesters";
import { Modal } from "@/components/ui/modal";
import { FormInput, FormColorPicker } from "@/components/ui/form-inputs";
import { DeleteConfirmation } from "@/components/ui/delete-confirmation";
import { useState } from "react";

interface EditSemesterModalProps {
  /** The semester being edited */
  semester: Semester;
  /** Called when the modal should close */
  onClose: () => void;
}



/**
 * EditSemesterModal — Edit semester fields, toggle active/completed, or delete.
 * Delete is inside the edit modal to prevent accidental deletion — PRD §21.5.
 */
export default function EditSemesterModal({
  semester,
  onClose,
}: EditSemesterModalProps) {
  const updateSemester = useUpdateSemester(semester.id);
  const deleteSemester = useDeleteSemester();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UpdateSemesterInput>({
    resolver: zodResolver(updateSemesterSchema),
    defaultValues: {
      name: semester.name,
      startDate: semester.startDate,
      endDate: semester.endDate,
      color: semester.color,
      isActive: semester.isActive ?? false,
      isCompleted: semester.isCompleted ?? false,
    },
  });

  const selectedColor = watch("color");

  /** Submit updated data to the API */
  const onSubmit = async (data: UpdateSemesterInput) => {
    await updateSemester.mutateAsync(data);
    onClose();
  };

  /** Delete the semester with confirmation */
  const handleDelete = async () => {
    await deleteSemester.mutateAsync(semester.id);
    onClose();
  };

  return (
    <>
      <Modal isOpen={true} title="Edit Semester" onClose={onClose}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name field */}
          <FormInput
            label="Semester Name"
            placeholder="e.g. Semester 4"
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
            value={selectedColor || semester.color}
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
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>

          {/* Delete option — inside edit modal per PRD §21.5 */}
          <div className="pt-2 border-t border-border/30">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-xs text-accent-red/70 hover:text-accent-red transition-colors"
            >
              Delete this semester
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation dialog — PRD §20.9 */}
      <DeleteConfirmation
        isOpen={showDeleteConfirm}
        itemName={semester.name}
        onConfirm={handleDelete}
        onClose={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
