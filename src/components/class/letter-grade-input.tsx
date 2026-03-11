/**
 * Post-Semester Letter Grade Input
 *
 * Visible only when the parent semester is marked as completed.
 * Dropdown to select official letter grade per class (AA–FF).
 * Triggers SPI/CGPA recalculation on change.
 *
 * Reference: PRD Section 11.18, Section 16.3
 */
"use client";

import { useState } from "react";
import { m } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { showToast } from "@/components/ui/toast";
import { LETTER_GRADES, GRADE_POINTS } from "@/lib/utils/grades";
import { semesterKeys } from "@/lib/hooks/use-semesters";
import { classKeys } from "@/lib/hooks/use-classes";

interface LetterGradeInputProps {
  classId: string;
  semesterId: string;
  className: string;
  currentGrade: string | null;
  classColor: string;
}

/**
 * LetterGradeInput — dropdown for setting the official letter grade
 * after the semester is completed.
 */
export default function LetterGradeInput({
  classId,
  semesterId,
  className: classTitle,
  currentGrade,
  classColor,
}: LetterGradeInputProps) {
  const [grade, setGrade] = useState(currentGrade ?? "");
  const queryClient = useQueryClient();

  /* Mutation to set/update letter grade */
  const setLetterGrade = useMutation({
    mutationFn: async (newGrade: string) => {
      const res = await fetch("/api/letter-grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId, semesterId, grade: newGrade }),
      });
      if (!res.ok) throw new Error("Failed to set grade");
      return res.json();
    },
    onSuccess: () => {
      /* Invalidate semester + class queries to recalculate SPI/CGPA */
      queryClient.invalidateQueries({ queryKey: semesterKeys.all });
      queryClient.invalidateQueries({ queryKey: classKeys.detail(classId) });
      showToast("Grade saved", "success");
    },
    onError: () => {
      showToast("Failed to save grade", "error");
      /* Revert optimistic change */
      setGrade(currentGrade ?? "");
    },
  });

  const handleChange = (newGrade: string) => {
    setGrade(newGrade);
    if (newGrade) {
      setLetterGrade.mutate(newGrade);
    }
  };

  const gradePoints = grade ? GRADE_POINTS[grade] : null;

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-surface-elevated/30 p-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Official Grade
          </h3>
          <p className="text-xs text-muted mt-0.5">
            {classTitle} — Semester completed
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Grade points display */}
          {gradePoints != null && (
            <span
              className="text-lg font-bold"
              style={{ color: classColor }}
            >
              {gradePoints}/10
            </span>
          )}

          {/* Grade dropdown */}
          <select
            value={grade}
            onChange={(e) => handleChange(e.target.value)}
            disabled={setLetterGrade.isPending}
            className="text-sm bg-surface border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1"
            style={{ ["--tw-ring-color" as string]: classColor }}
          >
            <option value="">Select grade</option>
            {LETTER_GRADES.map((g) => (
              <option key={g} value={g}>
                {g} ({GRADE_POINTS[g]})
              </option>
            ))}
          </select>
        </div>
      </div>
    </m.div>
  );
}
