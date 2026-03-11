/**
 * Edit Class Modal — Form for editing existing class details
 *
 * Purpose: Allows users to modify class name, category, credits, color,
 * and dates. Includes delete option within modal per PRD §21.5.
 *
 * Reference: PRD Section 10.5 (Class Card Edit), Section 21.5 (Edit Modals)
 */
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateClassSchema, type UpdateClassInput } from "@/lib/validations/schemas";
import { useUpdateClass, useDeleteClass } from "@/lib/hooks/use-classes";
import { Modal } from "@/components/ui/modal";
import {
  FormInput,
  FormSelect,
  FormColorPicker,
} from "@/components/ui/form-inputs";
import { DeleteConfirmation } from "@/components/ui/delete-confirmation";
import { showToast } from "@/components/ui/toast";

interface ClassForEdit {
  id: string;
  name: string;
  color: string;
  category: string;
  credits: number;
  startDate: string;
  endDate: string;
}

interface EditClassModalProps {
  cls: ClassForEdit;
  semesterId: string;
  onClose: () => void;
}

/** Category options matching the schema enum */
const CATEGORY_OPTIONS = [
  { value: "Core", label: "Core" },
  { value: "Minor", label: "Minor" },
  { value: "Elective", label: "Elective" },
  { value: "Other", label: "Other" },
];

/**
 * EditClassModal — modal form for editing a class.
 */
export default function EditClassModal({
  cls,
  semesterId,
  onClose,
}: EditClassModalProps) {
  const updateClass = useUpdateClass(cls.id, semesterId);
  const deleteClass = useDeleteClass(semesterId);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UpdateClassInput>({
    resolver: zodResolver(updateClassSchema),
    defaultValues: {
      name: cls.name,
      category: cls.category as UpdateClassInput["category"],
      credits: cls.credits,
      color: cls.color,
      startDate: cls.startDate,
      endDate: cls.endDate,
    },
  });

  const selectedColor = watch("color");

  /* Submit updated fields */
  const onSubmit = (data: UpdateClassInput) => {
    updateClass.mutate(data, {
      onSuccess: () => {
        showToast("Class updated", "success");
        onClose();
      },
    });
  };

  /* Delete the class */
  const handleDelete = () => {
    deleteClass.mutate(cls.id, {
      onSuccess: () => {
        showToast("Class deleted", "success");
        onClose();
      },
    });
  };

  return (
    <>
      <Modal isOpen={true} title={`Edit ${cls.name}`} onClose={onClose}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Class name */}
          <FormInput
            label="Class Name"
            {...register("name")}
            error={errors.name?.message}
            isRequired
          />

          {/* Category */}
          <FormSelect
            label="Category"
            options={CATEGORY_OPTIONS}
            {...register("category")}
            error={errors.category?.message}
          />

          {/* Credits */}
          <FormInput
            label="Credits"
            type="number"
            {...register("credits", { valueAsNumber: true })}
            error={errors.credits?.message}
          />

          {/* Color picker */}
          <FormColorPicker
            label="Color"
            value={selectedColor || cls.color}
            onChange={(color) => setValue("color", color)}
            error={errors.color?.message}
          />

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <FormInput
              label="Start Date"
              type="date"
              {...register("startDate")}
              error={errors.startDate?.message}
            />
            <FormInput
              label="End Date"
              type="date"
              {...register("endDate")}
              error={errors.endDate?.message}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            {/* Delete button — left side */}
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-xs text-accent-red hover:text-accent-red/80 transition-colors"
            >
              Delete Class
            </button>

            {/* Save / Cancel — right side */}
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
                disabled={isSubmitting || updateClass.isPending}
                className="px-4 py-2 text-sm font-medium bg-accent-purple text-white rounded-lg hover:bg-accent-purple/90 transition-colors disabled:opacity-50"
              >
                {updateClass.isPending ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation dialog — PRD §20.9 */}
      <DeleteConfirmation
        isOpen={showDeleteConfirm}
        itemName={cls.name}
        onConfirm={handleDelete}
        onClose={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
