/**
 * Class Notes — Auto-saving notes area for a class
 *
 * Same pattern as SemesterNotes but patches class instead.
 * Debounces writes by 1 second after last keystroke.
 *
 * Reference: PRD Section 11.7 (Notes Area)
 */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { m } from "framer-motion";
import { useUpdateClass } from "@/lib/hooks/use-classes";

interface ClassNotesProps {
  classId: string;
  semesterId: string;
  initialNotes: string;
}

/**
 * ClassNotes — Auto-saving notes textarea for a class.
 */
export default function ClassNotes({
  classId,
  semesterId,
  initialNotes,
}: ClassNotesProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const updateClass = useUpdateClass(classId, semesterId);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();

  /* Auto-save with 1s debounce */
  const debouncedSave = useCallback(
    (value: string) => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(async () => {
        setIsSaving(true);
        try {
          await updateClass.mutateAsync({ notes: value });
          setLastSaved(new Date());
        } finally {
          setIsSaving(false);
        }
      }, 1000);
    },
    [updateClass]
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNotes(value);
    debouncedSave(value);
  };

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
          placeholder="Add notes for this class..."
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
