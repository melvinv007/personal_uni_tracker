/**
 * Create Class Modal — Form for adding a new class to a semester
 *
 * Fields: Name, Category (Core/Minor/Elective/Other), Credits,
 *         Schedule Slots (day + time + location), Color.
 * Uses React Hook Form + Zod validation.
 * Auto-fills start/end dates from semester dates.
 *
 * Reference: PRD Section 20.4 (Class Form)
 */
"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClassSchema, type CreateClassInput } from "@/lib/validations/schemas";
import { useCreateClass } from "@/lib/hooks/use-classes";
import { Modal } from "@/components/ui/modal";
import {
  FormInput,
  FormSelect,
  FormColorPicker,
} from "@/components/ui/form-inputs";

interface CreateClassModalProps {
  semesterId: string;
  semesterColor: string;
  semesterStartDate: string;
  semesterEndDate: string;
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

/** Category options */
const CATEGORY_OPTIONS = [
  { value: "Core", label: "Core" },
  { value: "Minor", label: "Minor" },
  { value: "Elective", label: "Elective" },
  { value: "Other", label: "Other" },
];

export default function CreateClassModal({
  semesterId,
  semesterColor,
  semesterStartDate,
  semesterEndDate,
  onClose,
}: CreateClassModalProps) {
  const createClass = useCreateClass(semesterId);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateClassInput>({
    resolver: zodResolver(createClassSchema),
    defaultValues: {
      name: "",
      category: "Core",
      credits: 3,
      color: semesterColor,
      startDate: semesterStartDate,
      endDate: semesterEndDate,
      scheduleSlots: [],
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

  const onSubmit = async (data: CreateClassInput) => {
    /* Attach semesterId (not in zod schema but needed by API) */
    await createClass.mutateAsync({
      ...data,
      semesterId,
    } as CreateClassInput & { semesterId: string });
    onClose();
  };

  return (
    <Modal isOpen={true} title="New Class" onClose={onClose} maxWidth="max-w-xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name */}
        <FormInput
          label="Class Name"
          placeholder="e.g. Data Structures"
          error={errors.name?.message}
          {...register("name")}
        />

        {/* Category + Credits */}
        <div className="grid grid-cols-2 gap-3">
          <FormSelect
            label="Category"
            options={CATEGORY_OPTIONS}
            error={errors.category?.message}
            {...register("category")}
          />
          <FormInput
            label="Credits"
            type="number"
            min={1}
            max={20}
            error={errors.credits?.message}
            {...register("credits", { valueAsNumber: true })}
          />
        </div>

        {/* Date range */}
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
          value={selectedColor || semesterColor}
          onChange={(color) => setValue("color", color)}
          error={errors.color?.message}
        />

        {/* Schedule Slots */}
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
              No schedule slots — add slots to auto-generate class occurrences
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
            {isSubmitting ? "Creating..." : "Create Class"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
