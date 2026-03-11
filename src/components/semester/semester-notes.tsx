/**
 * Semester Notes — Auto-saving notes area
 *
 * Rich text area that auto-saves after 1 second of inactivity.
 * Uses debounced PATCH to update semester notes.
 *
 * Reference: PRD Section 10.6 (Notes Area)
 */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { m } from "framer-motion";
import { useUpdateSemester } from "@/lib/hooks/use-semesters";

interface SemesterNotesProps {
  semesterId: string;
  initialNotes: string;
}

/**
 * SemesterNotes — Auto-saving notes textarea.
 * Debounces writes by 1 second after last keystroke.
 */
export default function SemesterNotes({
  semesterId,
  initialNotes,
}: SemesterNotesProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const updateSemester = useUpdateSemester(semesterId);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();

  /* Auto-save with 1s debounce after typing stops */
  const debouncedSave = useCallback(
    (value: string) => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(async () => {
        setIsSaving(true);
        try {
          await updateSemester.mutateAsync({ notes: value });
          setLastSaved(new Date());
        } finally {
          setIsSaving(false);
        }
      }, 1000);
    },
    [updateSemester]
  );

  /* Handle note changes */
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNotes(value);
    debouncedSave(value);
  };

  /* Cleanup timer on unmount */
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-foreground">Notes</h2>
        {/* Save indicator */}
        <p className="text-xs text-muted">
          {isSaving
            ? "Saving..."
            : lastSaved
              ? `Saved ${lastSaved.toLocaleTimeString()}`
              : ""}
        </p>
      </div>

      <div className="rounded-xl border border-border dotted-surface-elevated overflow-hidden">
        <textarea
          value={notes}
          onChange={handleChange}
          placeholder="Add notes for this semester..."
          className="
            w-full min-h-[150px] p-4
            bg-transparent text-sm text-foreground
            placeholder:text-muted/50
            focus:outline-none
            resize-y
          "
        />
      </div>
    </m.div>
  );
}
