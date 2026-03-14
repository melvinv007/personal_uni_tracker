/**
 * Assignments Section — Filtered view of assignment tasks
 *
 * Separate from the Tasks section. Shows only tasks where isAssignment=true.
 * Includes submission toggle, marks display, deadline indicators.
 *
 * Reference: PRD Section 11.10 (Assignments Section),
 * Section 14.4 (Assignment Submission)
 */
"use client";

import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { format, differenceInDays, parseISO } from "date-fns";
import { useUpdateTask } from "@/lib/hooks/use-tasks";
import type { Task } from "@/lib/hooks/use-tasks";
import { EmptyState } from "@/components/ui/empty-state";
import EditTaskModal from "./edit-task-modal";

interface AssignmentsSectionProps {
  /** All tasks for this class (component filters to assignments only) */
  tasks: Task[];
  classId: string;
  semesterId: string;
  onCreateNew: () => void;
}

/**
 * AssignmentsSection — Shows assignments with submission toggles and marks.
 */
export default function AssignmentsSection({
  tasks,
  classId,
  semesterId,
  onCreateNew,
}: AssignmentsSectionProps) {
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  /* Filter to assignment tasks only */
  const assignments = tasks.filter((t) => t.isAssignment);
  const pending = assignments.filter((t) => !t.isCompleted);
  const completed = assignments.filter((t) => t.isCompleted);
  const [showCompleted, setShowCompleted] = useState(false);

  if (assignments.length === 0) {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Assignments</h2>
          <button
            onClick={onCreateNew}
            className="text-xs text-muted hover:text-foreground transition-colors"
          >
            + New
          </button>
        </div>
        <EmptyState message="No assignments yet" onAction={onCreateNew} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Assignments</h2>
        <button
          onClick={onCreateNew}
          className="text-xs text-muted hover:text-foreground transition-colors"
        >
          + New
        </button>
      </div>

      <div className="space-y-2">
        {/* Pending assignments */}
        <AnimatePresence>
          {pending.map((task, index) => (
            <AssignmentCard
              key={task.id}
              task={task}
              classId={classId}
              semesterId={semesterId}
              index={index}
              onEdit={() => setEditingTask(task)}
            />
          ))}
        </AnimatePresence>

        {/* Completed toggle */}
        {completed.length > 0 && (
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="text-xs text-muted hover:text-foreground transition-colors mt-2"
          >
            {showCompleted
              ? `Hide completed (${completed.length})`
              : `Show completed (${completed.length})`}
          </button>
        )}

        {/* Completed assignments */}
        <AnimatePresence>
          {showCompleted &&
            completed.map((task, index) => (
              <AssignmentCard
                key={task.id}
                task={task}
                classId={classId}
                semesterId={semesterId}
                index={index}
                onEdit={() => setEditingTask(task)}
              />
            ))}
        </AnimatePresence>
      </div>

      {/* Edit modal */}
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          semesterId={semesterId}
          classId={classId}
          onClose={() => setEditingTask(null)}
        />
      )}
    </div>
  );
}

/**
 * AssignmentCard — Single assignment with submission toggle, marks, deadline.
 */
function AssignmentCard({
  task,
  classId,
  semesterId,
  index,
  onEdit,
}: {
  task: Task;
  classId: string;
  semesterId: string;
  index: number;
  onEdit: () => void;
}) {
  const updateTask = useUpdateTask(semesterId, classId);

  const deadline = task.deadline ? parseISO(task.deadline) : null;
  const today = new Date();
  const daysUntil = deadline ? differenceInDays(deadline, today) : null;

  /* Deadline color coding — PRD Section 14.3 */
  const getDeadlineBg = () => {
    if (task.isCompleted) return "";
    if (daysUntil != null && daysUntil < 0) return "border-accent-red/30";
    if (daysUntil != null && daysUntil <= 1) return "border-accent-amber/30";
    return "";
  };

  /* Toggle submission status — optimistic */
  const handleSubmissionToggle = () => {
    updateTask.mutate({
      id: task.id,
      data: { isSubmitted: !task.isSubmitted },
    });
  };

  /* Toggle completion */
  const handleCompletionToggle = () => {
    updateTask.mutate({
      id: task.id,
      data: { isCompleted: !task.isCompleted },
    });
  };

  return (
    <m.div
      layout
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: task.isCompleted ? 0.5 : 1, y: 0 }}
      exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
      transition={{ delay: index * 0.03 }}
      className={`group flex items-center gap-3 p-3 rounded-lg bg-surface-elevated/50 hover:bg-surface-elevated transition-colors border border-transparent ${getDeadlineBg()}`}
    >
      {/* Completion checkbox */}
      <button
        onClick={handleCompletionToggle}
        disabled={updateTask.isPending}
        className={`
          w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center
          transition-all duration-200
          ${
            task.isCompleted
              ? "bg-accent-green border-accent-green"
              : "border-border hover:border-accent-green/50"
          }
        `}
      >
        {task.isCompleted && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Assignment info */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm truncate ${
            task.isCompleted ? "line-through text-muted" : "text-foreground"
          }`}
        >
          {task.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {/* Marks display */}
          {task.marksScored != null && task.totalMarks != null && (
            <span className="text-[10px] text-muted">
              {task.marksScored}/{task.totalMarks}
            </span>
          )}
          {/* Deadline */}
          {deadline && (
            <span
              className={`text-[10px] ${
                task.isCompleted
                  ? "text-muted"
                  : daysUntil != null && daysUntil < 0
                    ? "text-accent-red"
                    : daysUntil != null && daysUntil <= 1
                      ? "text-accent-amber"
                      : "text-muted"
              }`}
            >
              {daysUntil != null && daysUntil < 0
                ? `${Math.abs(daysUntil)}d overdue`
                : format(deadline, "MMM d, HH:mm")}
            </span>
          )}
        </div>
      </div>

      {/* Submission toggle — PRD Section 14.4 */}
      <button
        onClick={handleSubmissionToggle}
        disabled={updateTask.isPending}
        className={`text-[10px] font-medium px-2 py-1 rounded-full transition-colors shrink-0 ${
          task.isSubmitted
            ? "bg-accent-green/20 text-accent-green"
            : "bg-accent-amber/20 text-accent-amber"
        }`}
      >
        {task.isSubmitted ? "Submitted" : "Not Submitted"}
      </button>

      {/* Edit button */}
      <button
        onClick={onEdit}
        className="opacity-0 group-hover:opacity-100 text-muted hover:text-foreground transition-all p-1 shrink-0"
        aria-label="Edit assignment"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>
    </m.div>
  );
}
