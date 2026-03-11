/**
 * Create Extra Class Modal — Schedule a one-time extra class session
 *
 * Component: CreateExtraClassModal
 * Purpose: Form for adding a non-recurring class occurrence.
 * Creates a class_occurrences record with is_extra = true.
 * Shows inline overlap warning if proposed time conflicts with existing events.
 *
 * Props:
 * - classId: The class this extra session belongs to
 * - defaultDate: Optional pre-filled date from quick-add
 * - onClose: Callback to close the modal
 *
 * Appears on: Class page (via FAB), Semester page (via quick-add)
 *
 * Reference: PRD Section 13.4 (Adding an Extra Class), Section 20.7, Section 21.9 (Overlap Warning)
 */
"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createExtraClassSchema, type CreateExtraClassInput } from "@/lib/validations/schemas";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { classKeys } from "@/lib/hooks/use-classes";
import { useClassOccurrences } from "@/lib/hooks/use-occurrences";
import { Modal } from "@/components/ui/modal";
import { FormInput } from "@/components/ui/form-inputs";
import { showToast } from "@/components/ui/toast";
import { format } from "date-fns";
import {
  checkTimeOverlap,
  formatOverlapWarnings,
  type TimeSlotEvent,
} from "@/lib/utils/time-overlap";

interface CreateExtraClassModalProps {
  classId: string;
  /** Pre-filled date from quick-add (yyyy-MM-dd) */
  defaultDate?: string;
  onClose: () => void;
}

/**
 * CreateExtraClassModal — form for scheduling an extra class session.
 */
export default function CreateExtraClassModal({
  classId,
  defaultDate,
  onClose,
}: CreateExtraClassModalProps) {
  const queryClient = useQueryClient();

  /* Fetch existing occurrences for this class to check overlaps */
  const { data: occurrences } = useClassOccurrences(classId);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateExtraClassInput>({
    resolver: zodResolver(createExtraClassSchema),
    defaultValues: {
      classId,
      date: defaultDate || format(new Date(), "yyyy-MM-dd"),
      startTime: "",
      endTime: "",
      location: "",
    },
  });

  /* Watch date/time fields for live overlap checking — PRD §21.9 */
  const watchDate = watch("date");
  const watchStart = watch("startTime");
  const watchEnd = watch("endTime");

  /** Convert existing occurrences to TimeSlotEvent for overlap check */
  const existingEvents: TimeSlotEvent[] = useMemo(
    () =>
      (occurrences || [])
        .filter((o) => o.status !== "cancelled")
        .map((o) => ({
          id: o.id,
          name: o.class_?.name || "Class",
          date: o.occurrenceDate,
          startTime: o.startTime,
          endTime: o.endTime,
        })),
    [occurrences]
  );

  /** Overlap warning message — null if no conflicts */
  const overlapWarning = useMemo(() => {
    if (!watchDate || !watchStart || !watchEnd) return null;
    const warnings = checkTimeOverlap(watchDate, watchStart, watchEnd, existingEvents);
    return formatOverlapWarnings(warnings);
  }, [watchDate, watchStart, watchEnd, existingEvents]);

  /* Mutation to create extra class occurrence */
  const createExtra = useMutation({
    mutationFn: async (data: CreateExtraClassInput) => {
      const res = await fetch("/api/occurrences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: data.classId,
          occurrenceDate: data.date,
          startTime: data.startTime,
          endTime: data.endTime,
          location: data.location,
          isExtra: true,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create extra class");
      }
      return res.json();
    },
    onSuccess: () => {
      showToast("Extra class added", "success");
      queryClient.invalidateQueries({ queryKey: classKeys.detail(classId) });
      onClose();
    },
    onError: () => {
      showToast("Failed to create extra class", "error");
    },
  });

  const onSubmit = (data: CreateExtraClassInput) => {
    createExtra.mutate(data);
  };

  return (
    <Modal isOpen={true} title="Add Extra Class" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Date */}
        <FormInput
          label="Date"
          type="date"
          {...register("date")}
          error={errors.date?.message}
          isRequired
        />

        {/* Time range */}
        <div className="grid grid-cols-2 gap-3">
          <FormInput
            label="Start Time"
            type="time"
            placeholder="e.g. 09:00"
            {...register("startTime")}
            error={errors.startTime?.message}
            isRequired
          />
          <FormInput
            label="End Time"
            type="time"
            placeholder="e.g. 10:00"
            {...register("endTime")}
            error={errors.endTime?.message}
            isRequired
          />
        </div>

        {/* Location */}
        <FormInput
          label="Location"
          placeholder="e.g. LA001, Room B204"
          {...register("location")}
          error={errors.location?.message}
        />

        {/* Overlap warning — PRD §21.9 */}
        {overlapWarning && (
          <p className="text-xs text-amber-400 bg-amber-400/10 rounded-lg px-3 py-2">
            ⚠ {overlapWarning}
          </p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || createExtra.isPending}
            className="px-4 py-2 text-sm font-medium bg-accent-purple text-white rounded-lg hover:bg-accent-purple/90 transition-colors disabled:opacity-50"
          >
            {createExtra.isPending ? "Adding…" : "Add Extra Class"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
