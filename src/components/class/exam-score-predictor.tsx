/**
 * Exam Score Predictor — Calculate required score for target grade
 *
 * Interactive widget: Select an upcoming exam, enter target percentage,
 * and see the minimum marks needed on that exam to achieve it.
 *
 * Reference: PRD Section 11.13 (Score Predictor)
 */
"use client";

import { useState, useMemo } from "react";
import { m } from "framer-motion";
import { isPast, parseISO } from "date-fns";

interface Exam {
  id: string;
  name: string;
  examDate: string;
  marksScored: string | null;
  totalMarks: string;
  weightage: string;
}

interface ExamScorePredictorProps {
  exams: Exam[];
  classColor: string;
}

/**
 * ExamScorePredictor — what score do I need on the next exam?
 */
export default function ExamScorePredictor({
  exams,
  classColor,
}: ExamScorePredictorProps) {
  /* Separate scored and upcoming exams */
  const { scoredExams, upcomingExams } = useMemo(() => {
    const scored = exams.filter((e) => e.marksScored != null);
    const upcoming = exams.filter(
      (e) => e.marksScored == null && !isPast(parseISO(e.examDate))
    );
    return { scoredExams: scored, upcomingExams: upcoming };
  }, [exams]);

  const [selectedExamId, setSelectedExamId] = useState(
    upcomingExams[0]?.id ?? ""
  );
  const [targetPercentage, setTargetPercentage] = useState(75);

  const selectedExam = upcomingExams.find((e) => e.id === selectedExamId);

  /* Calculate currently earned weighted score */
  const currentWeighted = scoredExams.reduce((acc, e) => {
    const pct = parseFloat(e.marksScored!) / parseFloat(e.totalMarks);
    return acc + pct * parseFloat(e.weightage);
  }, 0);

  /* Total weightage of scored exams */
  const scoredWeightage = scoredExams.reduce(
    (acc, e) => acc + parseFloat(e.weightage),
    0
  );

  /* Calculate required marks on selected exam */
  const requiredInfo = useMemo(() => {
    if (!selectedExam) return null;

    const examWeightage = parseFloat(selectedExam.weightage);
    const examTotal = parseFloat(selectedExam.totalMarks);

    /* target = (currentWeighted + (requiredPct × examWeightage)) / (scoredWeightage + examWeightage) */
    /* Solve for requiredPct: */
    /* requiredPct = (target × (scoredWeightage + examWeightage) - currentWeighted) / examWeightage */
    const totalTargetWeighted =
      (targetPercentage / 100) * (scoredWeightage + examWeightage);
    const requiredPct = (totalTargetWeighted - currentWeighted) / examWeightage;
    const requiredMarks = Math.ceil(requiredPct * examTotal);

    return {
      requiredMarks: Math.max(0, requiredMarks),
      examTotal,
      achievable: requiredMarks <= examTotal && requiredMarks >= 0,
      requiredPct: Math.round(requiredPct * 100),
    };
  }, [selectedExam, targetPercentage, currentWeighted, scoredWeightage]);

  /* Don't render without upcoming exams */
  if (upcomingExams.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-medium text-muted mb-3">Score Predictor</h3>
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-surface-elevated/30 p-4 space-y-4"
      >
        {/* Exam selector */}
        <div>
          <label className="text-xs text-muted block mb-1">
            Select upcoming exam
          </label>
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1"
            style={{ ["--tw-ring-color" as string]: classColor }}
          >
            {upcomingExams.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.weightage}%)
              </option>
            ))}
          </select>
        </div>

        {/* Target percentage */}
        <div>
          <label className="text-xs text-muted block mb-1">
            Target overall percentage: <span className="font-bold text-foreground">{targetPercentage}%</span>
          </label>
          <input
            type="range"
            min={30}
            max={100}
            value={targetPercentage}
            onChange={(e) => setTargetPercentage(parseInt(e.target.value, 10))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-surface-elevated"
            style={{ accentColor: classColor }}
          />
        </div>

        {/* Result */}
        {requiredInfo && (
          <m.div
            key={`${selectedExamId}-${targetPercentage}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center pt-2 border-t border-border"
          >
            {requiredInfo.achievable ? (
              <>
                <p className="text-xs text-muted">You need at least</p>
                <p className="text-2xl font-bold mt-1" style={{ color: classColor }}>
                  {requiredInfo.requiredMarks} / {requiredInfo.examTotal}
                </p>
                <p className="text-xs text-muted mt-1">
                  ({requiredInfo.requiredPct}% on this exam)
                </p>
              </>
            ) : (
              <p className="text-xs text-accent-red">
                {requiredInfo.requiredPct > 100
                  ? "Target not achievable with this exam alone"
                  : "Target already met — any score works!"}
              </p>
            )}
          </m.div>
        )}
      </m.div>
    </div>
  );
}
