/**
 * Syllabus Rubric + Grade Calculator — Collapsed section
 *
 * Allows user to input grading components (e.g. Midsem 30%, Endsem 50%).
 * Grade calculator shows required scores for AA/AB/BB targets.
 * Updates dynamically as exam marks are entered.
 *
 * Reference: PRD Section 11.17, Section 17.5
 */
"use client";

import { useState, useMemo } from "react";
import { m, AnimatePresence } from "framer-motion";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { showToast } from "@/components/ui/toast";
import { classKeys } from "@/lib/hooks/use-classes";
import { GRADE_POINTS } from "@/lib/utils/grades";

/** Rubric component shape */
interface RubricComponent {
  name: string;
  weightage_percent: number;
}

interface SyllabusRubricProps {
  classId: string;
  classColor: string;
  /** Existing rubric components (if saved previously) */
  existingRubric: RubricComponent[] | null;
  /** All exams for this class (to calculate current standing) */
  exams: Array<{
    name: string;
    marksScored: string | null;
    totalMarks: string;
    weightage: string;
  }>;
}

/* Validation schema for the rubric form */
const rubricFormSchema = z.object({
  components: z
    .array(
      z.object({
        name: z.string().min(1, "Name required"),
        weightage_percent: z.coerce.number().min(0).max(100),
      })
    )
    .min(1, "At least one component needed"),
});

type RubricFormValues = z.infer<typeof rubricFormSchema>;

/**
 * SyllabusRubric — collapsible rubric entry + grade calculator.
 */
export default function SyllabusRubric({
  classId,
  classColor,
  existingRubric,
  exams,
}: SyllabusRubricProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(!existingRubric);
  const queryClient = useQueryClient();

  /* Calculate current weighted score from exams */
  const currentStanding = useMemo(() => {
    const scored = exams.filter((e) => e.marksScored != null);
    if (scored.length === 0) return { earnedWeighted: 0, totalWeightage: 0 };

    let earnedWeighted = 0;
    let totalWeightage = 0;
    for (const e of scored) {
      const pct = parseFloat(e.marksScored!) / parseFloat(e.totalMarks);
      const w = parseFloat(e.weightage);
      earnedWeighted += pct * w;
      totalWeightage += w;
    }
    return { earnedWeighted, totalWeightage };
  }, [exams]);

  /* Calculate required percentage on remaining assessments for each target grade */
  const gradeTargets = useMemo(() => {
    const { earnedWeighted, totalWeightage } = currentStanding;
    const remaining = 100 - totalWeightage;
    if (remaining <= 0) return null;

    /* Target grades and their required percentages (grade points / 10 * 100) */
    const targets = [
      { grade: "AA", points: 10, targetPct: 90 },
      { grade: "AB", points: 9, targetPct: 80 },
      { grade: "BB", points: 8, targetPct: 70 },
    ];

    return targets.map(({ grade, targetPct }) => {
      /* Required total weighted = targetPct */
      /* earnedWeighted + requiredPct × remaining = targetPct */
      /* requiredPct = (targetPct - earnedWeighted) / remaining */
      const requiredPct = ((targetPct - earnedWeighted) / remaining) * 100;
      return {
        grade,
        requiredPct: Math.round(requiredPct * 10) / 10,
        achievable: requiredPct <= 100 && requiredPct >= 0,
      };
    });
  }, [currentStanding]);

  /* Mutation to save rubric */
  const saveRubric = useMutation({
    mutationFn: async (data: RubricFormValues) => {
      const res = await fetch("/api/syllabus-rubric", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId, components: data.components }),
      });
      if (!res.ok) throw new Error("Failed to save rubric");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.detail(classId) });
      showToast("Rubric saved", "success");
      setIsEditing(false);
    },
    onError: () => {
      showToast("Failed to save rubric", "error");
    },
  });

  /* Form */
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RubricFormValues>({
    resolver: zodResolver(rubricFormSchema) as never,
    defaultValues: {
      components: existingRubric || [{ name: "", weightage_percent: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "components",
  });

  /* Calculate total weightage in rubric */
  const totalWeightage = existingRubric
    ? existingRubric.reduce((sum, c) => sum + c.weightage_percent, 0)
    : 0;

  return (
    <div>
      {/* Toggle header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm font-medium text-muted hover:text-foreground transition-colors mb-3"
      >
        <svg
          className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        Syllabus Rubric &amp; Grade Calculator
        {existingRubric && (
          <span className="text-[10px] text-accent-green">({totalWeightage}% defined)</span>
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden space-y-4"
          >
            {/* Rubric Editor */}
            {isEditing ? (
              <form
                onSubmit={handleSubmit((data) => saveRubric.mutate(data as RubricFormValues))}
                className="rounded-xl border border-border bg-surface-elevated/30 p-4 space-y-3"
              >
                <h4 className="text-xs font-medium text-muted">
                  Define grading components
                </h4>

                {fields.map((field, i) => (
                  <div key={field.id} className="flex gap-2 items-start">
                    <input
                      {...register(`components.${i}.name`)}
                      placeholder="e.g. Midsem"
                      className="flex-1 text-sm bg-surface border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-1"
                      style={{ ["--tw-ring-color" as string]: classColor }}
                    />
                    <div className="flex items-center gap-1">
                      <input
                        {...register(`components.${i}.weightage_percent`, {
                          valueAsNumber: true,
                        })}
                        type="number"
                        min={0}
                        max={100}
                        placeholder="30"
                        className="w-16 text-sm bg-surface border border-border rounded-lg px-2 py-2 text-foreground text-center focus:outline-none focus:ring-1"
                        style={{ ["--tw-ring-color" as string]: classColor }}
                      />
                      <span className="text-xs text-muted">%</span>
                    </div>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(i)}
                        className="p-2 text-muted hover:text-accent-red transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}

                {errors.components && (
                  <p className="text-xs text-accent-red">{errors.components.message}</p>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => append({ name: "", weightage_percent: 0 })}
                    className="text-xs text-muted hover:text-foreground transition-colors"
                  >
                    + Add component
                  </button>
                </div>

                <div className="flex gap-2 pt-2 border-t border-border">
                  <button
                    type="submit"
                    disabled={saveRubric.isPending}
                    className="text-xs px-4 py-2 rounded-lg text-white transition-colors"
                    style={{ backgroundColor: classColor }}
                  >
                    {saveRubric.isPending ? "Saving..." : "Save Rubric"}
                  </button>
                  {existingRubric && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="text-xs px-4 py-2 rounded-lg text-muted hover:text-foreground transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            ) : (
              /* Rubric display + edit button */
              <div className="rounded-xl border border-border bg-surface-elevated/30 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-medium text-muted">
                    Grading Components
                  </h4>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-xs text-muted hover:text-foreground transition-colors"
                  >
                    Edit
                  </button>
                </div>
                <div className="space-y-1">
                  {existingRubric?.map((c, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-foreground">{c.name}</span>
                      <span className="text-muted">{c.weightage_percent}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Grade Calculator — requires some exam scores */}
            {gradeTargets && currentStanding.totalWeightage > 0 && (
              <m.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border bg-surface-elevated/30 p-4"
              >
                <h4 className="text-xs font-medium text-muted mb-3">
                  Grade Calculator
                </h4>
                <p className="text-[10px] text-muted mb-3">
                  Current standing: {currentStanding.earnedWeighted.toFixed(1)}% earned out of{" "}
                  {currentStanding.totalWeightage}% assessed. Remaining: {(100 - currentStanding.totalWeightage).toFixed(0)}%.
                </p>
                <div className="space-y-2">
                  {gradeTargets.map((t) => (
                    <div
                      key={t.grade}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="font-medium text-foreground">
                        {t.grade} ({GRADE_POINTS[t.grade]}/10)
                      </span>
                      {t.achievable ? (
                        <span
                          className={`font-bold ${
                            t.requiredPct <= 60
                              ? "text-accent-green"
                              : t.requiredPct <= 80
                                ? "text-accent-amber"
                                : "text-accent-red"
                          }`}
                        >
                          Need {t.requiredPct}% on remaining
                        </span>
                      ) : (
                        <span className="text-muted line-through">
                          {t.requiredPct > 100 ? "Not achievable" : "Already secured"}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </m.div>
            )}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
