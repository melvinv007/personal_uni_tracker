/**
 * Tasks Section — Task list for a class
 *
 * Shows tasks with checkbox toggle, deadline indicators,
 * assignment badge, completion animation (5s fade).
 * Supports inline completion toggle via useUpdateTask.
 *
 * Reference: PRD Section 14 (Tasks & Assignments),
 * Section 11.5 (Class Tasks Section)
 */
"use client";

import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { format, differenceInDays, parseISO } from "date-fns";
import { useUpdateTask } from "@/lib/hooks/use-tasks";
import type { Task } from "@/lib/hooks/use-tasks";
import { EmptyState } from "@/components/ui/empty-state";
import EditTaskModal from "./edit-task-modal";

interface TasksSectionProps {
  tasks: Task[];
  classId: string;
  semesterId: string;
  onCreateNew: () => void;
}

/**
 * TasksSection — Interactive task list with completion support.
 */
export default function TasksSection({
  tasks,
  classId,
  semesterId,
  onCreateNew,
}: TasksSectionProps) {
  /* Separate pending and completed tasks */
  const pendingTasks = tasks.filter((t) => !t.isCompleted);
  const completedTasks = tasks.filter((t) => t.isCompleted);
  const [showCompleted, setShowCompleted] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Tasks</h2>
        <button
          onClick={onCreateNew}
          className="text-xs text-muted hover:text-foreground transition-colors"
        >
          + New
        </button>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          message="No tasks yet — add one to track deadlines"
          onAction={onCreateNew}
        />
      ) : (
        <div className="space-y-2">
          {/* Pending tasks */}
          <AnimatePresence>
            {pendingTasks.map((task, index) => (
              <TaskItem
                key={task.id}
                task={task}
                classId={classId}
                semesterId={semesterId}
                index={index}
                onEdit={() => setEditingTask(task)}
              />
            ))}
          </AnimatePresence>

          {/* Completed tasks toggle */}
          {completedTasks.length > 0 && (
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="text-xs text-muted hover:text-foreground transition-colors mt-2"
            >
              {showCompleted
                ? `Hide completed (${completedTasks.length})`
                : `Show completed (${completedTasks.length})`}
            </button>
          )}

          {/* Completed tasks */}
          <AnimatePresence>
            {showCompleted &&
              completedTasks.map((task, index) => (
                <TaskItem
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
      )}

      {/* Edit Task Modal */}
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
 * TaskItem — Single task with completion toggle and deadline indicator.
 * Completion animation: checkmark appears, text fades to muted, then item
 * fades out after 5 seconds — PRD Section 14.2.
 */
function TaskItem({
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
  const [justCompleted, setJustCompleted] = useState(false);

  const today = new Date();
  const deadline = task.deadline ? parseISO(task.deadline) : null;
  const daysUntil = deadline ? differenceInDays(deadline, today) : null;

  /** Toggle completion status */
  const handleToggle = () => {
    const newCompleted = !task.isCompleted;
    updateTask.mutate({ id: task.id, data: { isCompleted: newCompleted } });

    if (newCompleted) {
      setJustCompleted(true);
    }
  };

  /* Deadline color — PRD Section 14.3 */
  const getDeadlineColor = () => {
    if (task.isCompleted) return "text-muted";
    if (daysUntil == null) return "text-muted";
    if (daysUntil < 0) return "text-accent-red";
    if (daysUntil <= 2) return "text-accent-amber";
    return "text-muted";
  };

  return (
    <m.div
      layout
      initial={{ opacity: 0, y: 5 }}
      animate={{
        opacity: justCompleted ? 0.5 : 1,
        y: 0,
      }}
      exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
      transition={{ delay: index * 0.03 }}
      className="group flex items-center gap-3 p-3 rounded-lg bg-surface-elevated/50 hover:bg-surface-elevated transition-colors"
    >
      {/* Checkbox */}
      <button
        onClick={handleToggle}
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
          <svg
            className="w-3 h-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </button>

      {/* Task info */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm truncate ${
            task.isCompleted
              ? "line-through text-muted"
              : "text-foreground"
          }`}
        >
          {task.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {task.isAssignment && (
            <span className="text-[10px] text-accent-blue">Assignment</span>
          )}
          {task.marksScored != null && task.totalMarks != null && (
            <span className="text-[10px] text-muted">
              {task.marksScored}/{task.totalMarks}
            </span>
          )}
        </div>
      </div>

      {/* Deadline */}
      {deadline && (
        <p className={`text-xs shrink-0 ${getDeadlineColor()}`}>
          {task.isCompleted
            ? format(deadline, "MMM d")
            : daysUntil != null && daysUntil < 0
              ? `${Math.abs(daysUntil)}d overdue`
              : daysUntil === 0
                ? "Today"
                : format(deadline, "MMM d")}
        </p>
      )}

      {/* Edit button */}
      <button
        onClick={onEdit}
        className="opacity-0 group-hover:opacity-100 text-muted hover:text-foreground transition-all p-1 shrink-0"
        aria-label="Edit task"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>
    </m.div>
  );
}
