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
import { useForm, useFieldArray } from "react-hook-form";
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
  scheduleSlots?: Array<{
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    location: string | null;
  }>;
}

interface EditClassModalProps {
  cls: ClassForEdit;
  semesterId: string;
  onClose: () => void;
}

/** Day of week options */
const DAY_OPTIONS = [
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
];

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
    control,
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
      scheduleSlots: cls.scheduleSlots?.map((s) => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        location: s.location || "",
      })) || [],
    },
  });

  /* Dynamic schedule slots array */
  const { fields, append, remove } = useFieldArray({
    control,
    name: "scheduleSlots",
  });

  const selectedColor = watch("color");

  /** Add a new schedule slot */
  const addSlot = () => {
    append({
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "10:00",
      location: "",
    });
  };

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
      <Modal isOpen={true} title={`Edit ${cls.name}`} onClose={onClose} maxWidth="max-w-xl">
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
            onChange={(color) => setValue("color", color, { shouldDirty: true, shouldValidate: true })}
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

          {/* Schedule Slots — BF-13 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-foreground">
                Schedule
              </label>
              <button
                type="button"
                onClick={addSlot}
                className="text-xs text-accent-purple hover:text-accent-purple/80 transition-colors"
              >
                + Add Slot
              </button>
            </div>

            {fields.length === 0 ? (
              <p className="text-xs text-muted">
                No schedule slots
              </p>
            ) : (
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex items-end gap-2 p-3 rounded-lg bg-surface/50 border border-border/30"
                  >
                    {/* Day */}
                    <div className="flex-1">
                      <label className="text-[10px] text-muted block mb-1">
                        Day
                      </label>
                      <select
                        className="w-full px-2 py-1.5 rounded bg-surface border border-border text-xs text-foreground"
                        {...register(`scheduleSlots.${index}.dayOfWeek`, {
                          valueAsNumber: true,
                        })}
                      >
                        {DAY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Start Time */}
                    <div className="w-24">
                      <label className="text-[10px] text-muted block mb-1">
                        From
                      </label>
                      <input
                        type="time"
                        className="w-full px-2 py-1.5 rounded bg-surface border border-border text-xs text-foreground"
                        {...register(`scheduleSlots.${index}.startTime`)}
                      />
                    </div>

                    {/* End Time */}
                    <div className="w-24">
                      <label className="text-[10px] text-muted block mb-1">
                        To
                      </label>
                      <input
                        type="time"
                        className="w-full px-2 py-1.5 rounded bg-surface border border-border text-xs text-foreground"
                        {...register(`scheduleSlots.${index}.endTime`)}
                      />
                    </div>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="p-1.5 rounded hover:bg-accent-red/10 text-muted hover:text-accent-red transition-colors shrink-0"
                      aria-label="Remove slot"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
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
