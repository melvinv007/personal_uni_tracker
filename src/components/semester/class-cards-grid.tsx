/**
 * Class Cards Grid — Grid of class cards on the semester page
 *
 * Shows all classes in a responsive grid (3 col desktop, 2 col tablet, 1 col mobile).
 * Each card is a GlowingCard with class color, showing name, category, credits,
 * schedule summary, and exam/task counts.
 * Includes edit button and quick peek preview on hover.
 * Empty state shows dashed border with "+" action.
 *
 * Reference: PRD Section 10.5 (Class Cards), Section 3.4 (Card Design Rules)
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import { GlowingCard } from "@/components/ui/glowing-card";
import { EmptyState } from "@/components/ui/empty-state";
import { QuickPeekPreview, ClassPeekContent } from "@/components/ui/quick-peek";
import EditClassModal from "./edit-class-modal";

interface ClassCardData {
  id: string;
  name: string;
  color: string;
  category: string;
  credits: number;
  scheduleSlots: Array<{
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    location: string | null;
  }>;
  exams: Array<{ id: string; name: string; examDate: string; marksScored: string | null; totalMarks: string; weightage: string }>;
  letterGrade: Array<{ grade: string }>;
}

interface ClassCardsGridProps {
  classes: ClassCardData[];
  semesterId: string;
  onCreateNew: () => void;
}

/** Maps day number (0–6) to abbreviated name */
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * ClassCardsGrid — responsive grid of class cards.
 */
export default function ClassCardsGrid({
  classes,
  semesterId,
  onCreateNew,
}: ClassCardsGridProps) {
  /* Track which class is being edited */
  const [editingClass, setEditingClass] = useState<ClassCardData | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Classes</h2>
        <button
          onClick={onCreateNew}
          className="text-xs text-muted hover:text-foreground transition-colors"
        >
          + New
        </button>
      </div>

      {classes.length === 0 ? (
        <EmptyState
          message="Add your first class to this semester"
          onAction={onCreateNew}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls, index) => (
            <ClassCard
              key={cls.id}
              cls={cls}
              semesterId={semesterId}
              index={index}
              onEdit={() => setEditingClass(cls)}
            />
          ))}
        </div>
      )}

      {/* Edit class modal */}
      {editingClass && (
        <EditClassModal
          cls={{
            id: editingClass.id,
            name: editingClass.name,
            color: editingClass.color,
            category: editingClass.category,
            credits: editingClass.credits,
            startDate: "",
            endDate: "",
          }}
          semesterId={semesterId}
          onClose={() => setEditingClass(null)}
        />
      )}
    </div>
  );
}

/**
 * Individual class card with color-coded glowing border.
 * Includes edit button and desktop quick peek on hover.
 */
function ClassCard({
  cls,
  semesterId,
  index,
  onEdit,
}: {
  cls: ClassCardData;
  semesterId: string;
  index: number;
  onEdit: () => void;
}) {
  /* Generate schedule summary — e.g. "Mon, Wed, Fri" */
  const scheduleSummary = cls.scheduleSlots
    .map((slot) => DAY_NAMES[slot.dayOfWeek])
    .filter((v, i, a) => a.indexOf(v) === i)
    .join(", ");

  /* Format time range from first slot */
  const firstSlot = cls.scheduleSlots[0];
  const timeRange = firstSlot
    ? `${formatCompactTime(firstSlot.startTime)} – ${formatCompactTime(firstSlot.endTime)}`
    : null;

  /* Letter grade if assigned */
  const letterGrade = cls.letterGrade?.[0]?.grade;

  /* Build next exam info for quick peek */
  const now = new Date();
  const nextExam = cls.exams
    .filter((e) => new Date(e.examDate) >= now)
    .sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime())[0];

  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Quick peek preview — desktop only */}
      <div className="hidden lg:block">
        <QuickPeekPreview isVisible={isHovered}>
          <ClassPeekContent
            attendancePct={undefined}
            nextExam={
              nextExam
                ? `${nextExam.name} — ${new Date(nextExam.examDate).toLocaleDateString()}`
                : undefined
            }
            nextClass={scheduleSummary || undefined}
          />
        </QuickPeekPreview>
      </div>

      <Link href={`/semester/${semesterId}/class/${cls.id}`}>
          <GlowingCard color={cls.color} index={index} className="p-4 h-full">
            {/* Header: Name + Category */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-foreground truncate">
                  {cls.name}
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  {cls.category} · {cls.credits} cr
                </p>
              </div>

              {/* Letter grade badge if available */}
              {letterGrade && (
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded shrink-0"
                  style={{
                    backgroundColor: `${cls.color}20`,
                    color: cls.color,
                  }}
                >
                  {letterGrade}
                </span>
              )}
            </div>

            {/* Schedule summary */}
            {scheduleSummary && (
              <p className="text-xs text-muted">
                {scheduleSummary}
                {timeRange && ` · ${timeRange}`}
              </p>
            )}

            {/* Stats row */}
            <div className="flex items-center gap-3 mt-3 pt-2 border-t border-border/30">
              <Stat label="Exams" value={cls.exams.length} color={cls.color} />
              <Stat label="Slots/wk" value={cls.scheduleSlots.length} color={cls.color} />
            </div>
          </GlowingCard>
        </Link>

        {/* Edit button — overlaid on top-right, stops link propagation */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEdit();
          }}
          className="absolute top-3 right-3 p-1.5 rounded-md bg-surface/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-surface-elevated"
          title="Edit class"
        >
          <svg
            className="w-3.5 h-3.5 text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
        </button>
      </div>
  );
}

/** Compact stat display */
function Stat({
  label,
  value,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="text-center">
      <p className="text-sm font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted">{label}</p>
    </div>
  );
}

/** Format time compactly (e.g. "9:00a") */
function formatCompactTime(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "p" : "a";
  return `${hour % 12 || 12}:${m}${ampm}`;
}
