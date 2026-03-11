/**
 * Upcoming Section — Exams & Tasks sorted by date
 *
 * Shows upcoming exams (with countdown chips for 8-day window)
 * and pending tasks sorted by nearest deadline.
 * Smart deadline risk banner for overdue/close items.
 *
 * Reference: PRD Section 10.3 (Upcoming Section),
 * Section 10.4 (Exam Countdown Chips),
 * Section 10.5 (Smart Deadline Risk Banner)
 */
"use client";

import { useMemo } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  format,
  differenceInDays,
  parseISO,
} from "date-fns";
import type { Task } from "@/lib/hooks/use-tasks";

interface SemesterClass {
  id: string;
  name: string;
  color: string;
  exams: Array<{
    id: string;
    name: string;
    examDate: string;
    marksScored: string | null;
    totalMarks: string;
    weightage: string;
  }>;
}

interface UpcomingSectionProps {
  classes: SemesterClass[];
  tasks: Task[];
}

/**
 * UpcomingSection — Shows upcoming exams and pending tasks.
 */
export default function UpcomingSection({
  classes,
  tasks,
}: UpcomingSectionProps) {
  /* Wrap today in useMemo so it doesn't change on every render */
  const today = useMemo(() => new Date(), []);

  /* Collect upcoming exams (within 30 days) from all classes */
  const upcomingExams = useMemo(() => {
    const exams: Array<{
      id: string;
      name: string;
      examDate: string;
      className: string;
      classColor: string;
      daysUntil: number;
    }> = [];

    for (const cls of classes) {
      for (const exam of cls.exams) {
        const examDate = parseISO(exam.examDate);
        const daysUntil = differenceInDays(examDate, today);
        /* Show exams coming up in next 30 days or today */
        if (daysUntil >= 0 && daysUntil <= 30) {
          exams.push({
            id: exam.id,
            name: exam.name,
            examDate: exam.examDate,
            className: cls.name,
            classColor: cls.color,
            daysUntil,
          });
        }
      }
    }

    return exams.sort((a, b) => a.daysUntil - b.daysUntil);
  }, [classes, today]);

  /* Pending tasks — not completed, sorted by deadline closeness */
  const pendingTasks = useMemo(() => {
    return (tasks || [])
      .filter((t) => !t.isCompleted)
      .sort((a, b) => {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return a.deadline.localeCompare(b.deadline);
      });
  }, [tasks]);

  /* Deadline risk items — overdue or due within 2 days */
  const riskItems = useMemo(() => {
    return pendingTasks.filter((t) => {
      if (!t.deadline) return false;
      const daysUntilDeadline = differenceInDays(parseISO(t.deadline), today);
      return daysUntilDeadline <= 2;
    });
  }, [pendingTasks, today]);

  const hasContent =
    upcomingExams.length > 0 || pendingTasks.length > 0;

  if (!hasContent) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Upcoming</h2>

      {/* Smart Deadline Risk Banner — PRD Section 10.5 */}
      {riskItems.length > 0 && (
        <m.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-accent-red/30 bg-accent-red/5 p-3"
        >
          <div className="flex items-center gap-2 mb-1">
            <svg
              className="w-4 h-4 text-accent-red"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <p className="text-sm font-medium text-accent-red">
              {riskItems.length} item{riskItems.length > 1 ? "s" : ""} need
              attention
            </p>
          </div>
          <ul className="space-y-1">
            {riskItems.slice(0, 3).map((task) => {
              const daysUntil = differenceInDays(
                parseISO(task.deadline!),
                today
              );
              const isOverdue = daysUntil < 0;
              return (
                <li key={task.id} className="text-xs text-muted">
                  <span className="text-foreground">{task.name}</span>
                  {" — "}
                  {isOverdue ? (
                    <span className="text-accent-red">
                      Overdue by {Math.abs(daysUntil)} day
                      {Math.abs(daysUntil) !== 1 ? "s" : ""}
                    </span>
                  ) : daysUntil === 0 ? (
                    <span className="text-accent-orange">Due today</span>
                  ) : (
                    <span className="text-accent-amber">
                      Due in {daysUntil} day{daysUntil !== 1 ? "s" : ""}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </m.div>
      )}

      {/* Exam Countdown Chips — PRD Section 10.4 (8-day window) */}
      {upcomingExams.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted mb-2">Exams</h3>
          <div className="flex flex-wrap gap-2">
            {upcomingExams.map((exam) => (
              <ExamCountdownChip key={exam.id} exam={exam} />
            ))}
          </div>
        </div>
      )}

      {/* Pending Tasks List */}
      {pendingTasks.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted mb-2">Tasks</h3>
          <div className="space-y-2">
            <AnimatePresence>
              {pendingTasks.slice(0, 8).map((task, index) => (
                <TaskItem key={task.id} task={task} index={index} />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * ExamCountdownChip — Compact chip showing exam name + days until.
 * Color intensity increases as exam gets closer (8-day window).
 */
function ExamCountdownChip({
  exam,
}: {
  exam: {
    name: string;
    examDate: string;
    className: string;
    classColor: string;
    daysUntil: number;
  };
}) {
  /* Urgency level based on days until exam — PRD Section 10.4 */
  const getUrgencyStyle = () => {
    if (exam.daysUntil <= 1)
      return "bg-accent-red/20 border-accent-red/40 text-accent-red";
    if (exam.daysUntil <= 3)
      return "bg-accent-orange/20 border-accent-orange/40 text-accent-orange";
    if (exam.daysUntil <= 8)
      return "bg-accent-amber/20 border-accent-amber/40 text-accent-amber";
    return "bg-surface-elevated border-border text-muted";
  };

  return (
    <m.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        inline-flex items-center gap-2 px-3 py-1.5
        rounded-full border text-xs font-medium
        ${getUrgencyStyle()}
      `}
    >
      {/* Class color dot */}
      <div
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: exam.classColor }}
      />
      <span className="truncate max-w-[120px]">{exam.name}</span>
      <span className="shrink-0 font-bold">
        {exam.daysUntil === 0
          ? "Today"
          : `${exam.daysUntil}d`}
      </span>
    </m.div>
  );
}

/**
 * TaskItem — Individual pending task with deadline indicator.
 */
function TaskItem({ task, index }: { task: Task; index: number }) {
  const today = new Date();
  const deadline = task.deadline ? parseISO(task.deadline) : null;
  const daysUntil = deadline ? differenceInDays(deadline, today) : null;

  /* Deadline color — PRD Section 14.3 */
  const getDeadlineColor = () => {
    if (daysUntil == null) return "text-muted";
    if (daysUntil < 0) return "text-accent-red";
    if (daysUntil <= 2) return "text-accent-amber";
    return "text-muted";
  };

  return (
    <m.div
      layout
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
      transition={{ delay: index * 0.03 }}
      className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-elevated/50 hover:bg-surface-elevated transition-colors"
    >
      {/* Checkbox circle */}
      <div className="w-4 h-4 rounded-full border-2 border-border shrink-0" />

      {/* Task info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground truncate">{task.name}</p>
        {task.isAssignment && (
          <span className="text-[10px] text-accent-blue">Assignment</span>
        )}
      </div>

      {/* Deadline */}
      {deadline && (
        <p className={`text-xs shrink-0 ${getDeadlineColor()}`}>
          {daysUntil != null && daysUntil < 0
            ? `${Math.abs(daysUntil)}d overdue`
            : daysUntil === 0
              ? "Today"
              : format(deadline, "MMM d")}
        </p>
      )}
    </m.div>
  );
}
