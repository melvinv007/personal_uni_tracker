/**
 * Exams Section — Exam list for a class
 *
 * Shows all exams with date, marks (if available), weightage,
 * and countdown for upcoming exams.
 * Color-coded by score status and exam proximity.
 *
 * Reference: PRD Section 15 (Exams & Grades), Section 11.6
 */
"use client";

import { useState } from "react";
import { m } from "framer-motion";
import { format, differenceInDays, parseISO, isPast } from "date-fns";
import { GlowingCard } from "@/components/ui/glowing-card";
import { EmptyState } from "@/components/ui/empty-state";
import EditExamModal from "./edit-exam-modal";
import type { Exam as FullExam } from "@/lib/hooks/use-exams";

/** Local exam shape matching ClassDetail.exams */
interface Exam {
  id: string;
  name: string;
  examDate: string;
  marksScored: string | null;
  totalMarks: string;
  weightage: string;
}

interface ExamsSectionProps {
  exams: Exam[];
  classId: string;
  classColor: string;
  onCreateNew: () => void;
}

/**
 * ExamsSection — Shows all exams for a class.
 */
export default function ExamsSection({
  exams,
  classId,
  classColor,
  onCreateNew,
}: ExamsSectionProps) {
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  /* Sort: upcoming first (by date), then past */
  const sortedExams = [...exams].sort((a, b) => {
    const aUpcoming = !isPast(parseISO(a.examDate));
    const bUpcoming = !isPast(parseISO(b.examDate));
    if (aUpcoming && !bUpcoming) return -1;
    if (!aUpcoming && bUpcoming) return 1;
    return a.examDate.localeCompare(b.examDate);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Exams</h2>
        <button
          onClick={onCreateNew}
          className="text-xs text-muted hover:text-foreground transition-colors"
        >
          + New
        </button>
      </div>

      {exams.length === 0 ? (
        <EmptyState
          message="No exams yet — add your first exam"
          onAction={onCreateNew}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sortedExams.map((exam, index) => (
            <ExamCard
              key={exam.id}
              exam={exam}
              classColor={classColor}
              index={index}
              onEdit={() => setEditingExam(exam)}
            />
          ))}
        </div>
      )}
      
      {/* Edit Exam Modal */}
      {editingExam && (
        <EditExamModal
          exam={editingExam as FullExam}
          classId={classId}
          onClose={() => setEditingExam(null)}
        />
      )}
    </div>
  );
}

/**
 * ExamCard — Individual exam with marks, date, and countdown.
 */
function ExamCard({
  exam,
  classColor,
  index,
  onEdit,
}: {
  exam: Exam;
  classColor: string;
  index: number;
  onEdit: () => void;
}) {
  const examDate = parseISO(exam.examDate);
  const isUpcoming = !isPast(examDate);
  const daysUntil = differenceInDays(examDate, new Date());
  const hasScore = exam.marksScored != null;
  const percentage = hasScore
    ? (parseFloat(exam.marksScored!) / parseFloat(exam.totalMarks)) * 100
    : null;

  /* Score color based on percentage */
  const getScoreColor = () => {
    if (percentage == null) return "text-muted";
    if (percentage >= 80) return "text-accent-green";
    if (percentage >= 60) return "text-accent-amber";
    return "text-accent-red";
  };

  return (
    <GlowingCard color={classColor} index={index} className="p-4 cursor-pointer group" onClick={onEdit}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-foreground truncate group-hover:text-accent-purple transition-colors">
            {exam.name}
          </h4>
          <p className="text-xs text-muted mt-0.5">
            {format(examDate, "MMM d, yyyy")}
          </p>
        </div>

        {/* Countdown or score */}
        {isUpcoming && !hasScore ? (
          <span
            className={`
              text-xs font-bold px-2 py-0.5 rounded shrink-0
              ${daysUntil <= 3 ? "bg-accent-red/20 text-accent-red" : "bg-accent-orange/20 text-accent-orange"}
            `}
          >
            {daysUntil === 0 ? "Today" : `${daysUntil}d`}
          </span>
        ) : hasScore ? (
          <span className={`text-sm font-bold shrink-0 ${getScoreColor()}`}>
            {exam.marksScored}/{exam.totalMarks}
          </span>
        ) : (
          <span className="text-xs text-muted shrink-0">Past</span>
        )}
      </div>

      {/* Weightage + score bar */}
      <div className="flex items-center justify-between text-xs text-muted">
        <span>Weightage: {exam.weightage}%</span>
        {percentage != null && (
          <span className={getScoreColor()}>
            {percentage.toFixed(1)}%
          </span>
        )}
      </div>

      {/* Score progress bar (only if scored) */}
      {percentage != null && (
        <div className="w-full h-1.5 rounded-full bg-surface-elevated mt-2 overflow-hidden">
          <m.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(percentage, 100)}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ backgroundColor: classColor }}
          />
        </div>
      )}
    </GlowingCard>
  );
}
