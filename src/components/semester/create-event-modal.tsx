/**
 * Create Event Modal — Form for adding a non-academic event
 *
 * Fields: Name, Date, Start Time, End Time, Location (optional), Color (optional), Notes (optional).
 * Uses React Hook Form + Zod validation. Non-academic events are excluded from all academic stats.
 *
 * Props:
 * - semesterId: optional semester to link the event to
 * - defaultDate: optional pre-filled date (from calendar quick-add click)
 * - onClose: callback to close the modal
 *
 * Reference: PRD Section 20.8 (Non-Academic Event Form)
 */
"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createNonAcademicEventSchema,
  type CreateNonAcademicEventInput,
} from "@/lib/validations/schemas";
import { useCreateEvent, useEvents } from "@/lib/hooks/use-events";
import { useDayOccurrences } from "@/lib/hooks/use-occurrences";
import { Modal } from "@/components/ui/modal";
import { FormInput } from "@/components/ui/form-inputs";
import {
  checkTimeOverlap,
  formatOverlapWarnings,
  type TimeSlotEvent,
} from "@/lib/utils/time-overlap";

interface CreateEventModalProps {
  semesterId?: string;
  defaultDate?: string;
  onClose: () => void;
}

/**
 * CreateEventModal — modal form for creating a non-academic event.
 * Pre-fills the date if provided (e.g. from calendar quick-add).
 */
export default function CreateEventModal({
  semesterId,
  defaultDate,
  onClose,
}: CreateEventModalProps) {
  const createEvent = useCreateEvent(semesterId);

  /* Fetch existing data for overlap checking — PRD §21.9 */
  const { data: existingEvents } = useEvents(semesterId);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateNonAcademicEventInput>({
    resolver: zodResolver(createNonAcademicEventSchema) as never,
    defaultValues: {
      name: "",
      eventDate: defaultDate || "",
      startTime: "",
      endTime: "",
      location: "",
      color: "",
      notes: "",
      semesterId: semesterId || null,
    },
  });

  /* Watch date/time fields for live overlap checking — PRD §21.9 */
  const watchDate = watch("eventDate");
  const watchStart = watch("startTime");
  const watchEnd = watch("endTime");

  /* Fetch class occurrences for the selected date */
  const { data: dayOccurrences } = useDayOccurrences(watchDate);

  /** Merge class occurrences + existing non-academic events into TimeSlotEvent[] */
  const allSlots: TimeSlotEvent[] = useMemo(() => {
    const slots: TimeSlotEvent[] = [];
    /* Class occurrences on that date */
    (dayOccurrences || [])
      .filter((o) => o.status !== "cancelled")
      .forEach((o) =>
        slots.push({
          id: o.id,
          name: o.class_?.name || "Class",
          date: o.occurrenceDate,
          startTime: o.startTime,
          endTime: o.endTime,
        })
      );
    /* Other non-academic events */
    (existingEvents || []).forEach((e) =>
      slots.push({
        id: e.id,
        name: e.name,
        date: e.eventDate,
        startTime: e.startTime,
        endTime: e.endTime,
      })
    );
    return slots;
  }, [dayOccurrences, existingEvents]);

  /** Overlap warning message — null if no conflicts */
  const overlapWarning = useMemo(() => {
    if (!watchDate || !watchStart || !watchEnd) return null;
    const warnings = checkTimeOverlap(watchDate, watchStart, watchEnd, allSlots);
    return formatOverlapWarnings(warnings);
  }, [watchDate, watchStart, watchEnd, allSlots]);

  /** Submit handler — creates event and closes modal */
  const onSubmit = async (data: CreateNonAcademicEventInput) => {
    await createEvent.mutateAsync({
      ...data,
      semesterId: semesterId || null,
    });
    onClose();
  };

  return (
    <Modal isOpen={true} title="New Event" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Event name */}
        <FormInput
          label="Event Name"
          placeholder="e.g. Club meeting, Gym session"
          error={errors.name?.message}
          {...register("name")}
        />

        {/* Date */}
        <FormInput
          label="Date"
          type="date"
          error={errors.eventDate?.message}
          {...register("eventDate")}
        />

        {/* Start + End time */}
        <div className="grid grid-cols-2 gap-3">
          <FormInput
            label="Start Time"
            placeholder="HH:MM (e.g. 14:00)"
            error={errors.startTime?.message}
            {...register("startTime")}
          />
          <FormInput
            label="End Time"
            placeholder="HH:MM (e.g. 15:30)"
            error={errors.endTime?.message}
            {...register("endTime")}
          />
        </div>

        {/* Location (optional) */}
        <FormInput
          label="Location (optional)"
          placeholder="e.g. Room B204, Library"
          error={errors.location?.message}
          {...register("location")}
        />

        {/* Color (optional) */}
        <FormInput
          label="Color (optional)"
          type="color"
          error={errors.color?.message}
          {...register("color")}
        />

        {/* Notes (optional) */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Notes (optional)
          </label>
          <textarea
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent-purple/50 min-h-[60px] resize-y"
            placeholder="Any additional details..."
            {...register("notes")}
          />
          {errors.notes?.message && (
            <p className="text-xs text-accent-red mt-1">
              {errors.notes.message}
            </p>
          )}
        </div>

        {/* Overlap warning — PRD §21.9 */}
        {overlapWarning && (
          <p className="text-xs text-amber-400 bg-amber-400/10 rounded-lg px-3 py-2">
            ⚠ {overlapWarning}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm text-muted hover:bg-surface-elevated transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 rounded-lg bg-accent-purple px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-purple/90 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? "Creating..." : "Create Event"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
