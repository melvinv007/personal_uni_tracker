/**
 * Semester Cards Grid — Displays all semesters as interactive cards
 *
 * Layout: 2 columns on desktop, 1 column on mobile.
 * Active semester has green glowing border + "A" badge.
 * Each card has: "A" toggle button, edit button, quick peek on hover.
 * Empty state shows dashed border with "+" button.
 * Cards link to /semester/[id] on click.
 *
 * Reference: PRD Section 9.5 (Semester Cards), Section 9.6 (Active Semester Marker),
 * Section 21.5 (Edit button), Section 21.11 (Quick Peek Previews)
 */
"use client";

import { useState, useCallback } from "react";
import { m } from "framer-motion";
import Link from "next/link";
import { format } from "date-fns";
import { useUpdateSemester, type Semester } from "@/lib/hooks/use-semesters";
import { GlowingCard } from "@/components/ui/glowing-card";
import { EmptyState } from "@/components/ui/empty-state";
import { QuickPeekPreview, SemesterPeekContent } from "@/components/ui/quick-peek";
import EditSemesterModal from "./edit-semester-modal";

interface SemesterGridProps {
  semesters: Semester[];
  onCreateNew: () => void;
}

/**
 * SemesterGrid — grid of semester cards with staggered entrance.
 */
export default function SemesterGrid({
  semesters,
  onCreateNew,
}: SemesterGridProps) {
  /* Track which semester is being edited */
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null);

  if (semesters.length === 0) {
    return (
      <EmptyState
        message="Create your first semester to start tracking"
        onAction={onCreateNew}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Semesters</h2>
        <button
          onClick={onCreateNew}
          className="text-xs text-muted hover:text-foreground transition-colors"
        >
          + New
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {semesters.map((semester, index) => (
          <SemesterCard
            key={semester.id}
            semester={semester}
            index={index}
            onEdit={() => setEditingSemester(semester)}
          />
        ))}
      </div>

      {/* Edit Semester Modal — PRD §21.5 */}
      {editingSemester && (
        <EditSemesterModal
          semester={editingSemester}
          onClose={() => setEditingSemester(null)}
        />
      )}
    </div>
  );
}

/**
 * Individual semester card with:
 * - Glowing border (green for active, semester color otherwise)
 * - "A" toggle button to mark as active — PRD §9.5
 * - Edit button — PRD §21.5
 * - Quick peek on desktop hover — PRD §21.11
 */
function SemesterCard({
  semester,
  index,
  onEdit,
}: {
  semester: Semester;
  index: number;
  onEdit: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const updateSemester = useUpdateSemester(semester.id);

  /* Format date range */
  const dateRange = `${format(new Date(semester.startDate), "MMM yyyy")} — ${format(new Date(semester.endDate), "MMM yyyy")}`;

  /**
   * Toggle active status — PRD §9.5:
   * "A small button with just the text A is present on each non-active semester card
   * to mark it as active. Only one semester can be active at a time."
   * The useUpdateSemester hook handles deactivating others optimistically.
   */
  const handleToggleActive = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault(); /* Prevent link navigation */
      e.stopPropagation();
      updateSemester.mutate({ isActive: !semester.isActive });
    },
    [semester.isActive, updateSemester]
  );

  /** Open edit modal — prevent link navigation */
  const handleEdit = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onEdit();
    },
    [onEdit]
  );

  return (
    <Link href={`/semester/${semester.id}`}>
      <div
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Quick peek preview on hover — desktop only — PRD §21.11 */}
        <div className="hidden lg:block">
          <QuickPeekPreview isVisible={isHovered}>
            <SemesterPeekContent
              classCount={0}
              attendanceStr="—"
            />
          </QuickPeekPreview>
        </div>

        <GlowingCard
          color={semester.isActive ? "#22c55e" : semester.color}
          index={index}
          className="p-4 h-full"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground truncate">
                  {semester.name}
                </h3>
                {/* Active semester badge — always visible when active */}
                {semester.isActive && (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-accent-green/20 text-accent-green text-[10px] font-bold shrink-0">
                    A
                  </span>
                )}
                {/* Completed badge */}
                {semester.isCompleted && (
                  <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted/20 text-muted shrink-0">
                    Done
                  </span>
                )}
              </div>
              <p className="text-xs text-muted mt-1">{dateRange}</p>
            </div>

            {/* Action buttons — A toggle + edit */}
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              {/* "A" toggle button — PRD §9.5 */}
              <m.button
                whileTap={{ scale: 0.9 }}
                onClick={handleToggleActive}
                title={semester.isActive ? "Remove active status" : "Set as active"}
                className={`
                  w-6 h-6 rounded-full text-[10px] font-bold
                  flex items-center justify-center transition-colors
                  ${
                    semester.isActive
                      ? "bg-accent-green/20 text-accent-green"
                      : "bg-surface-elevated text-muted hover:text-foreground hover:bg-surface-elevated/80"
                  }
                `}
              >
                A
              </m.button>

              {/* Edit button — PRD §9.5, §21.5 */}
              <m.button
                whileTap={{ scale: 0.9 }}
                onClick={handleEdit}
                title="Edit semester"
                className="w-6 h-6 rounded-md flex items-center justify-center text-muted hover:text-foreground transition-colors bg-surface-elevated/50 hover:bg-surface-elevated"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </m.button>
            </div>
          </div>

          {/* Credits if available */}
          {semester.credits != null && semester.credits > 0 && (
            <p className="text-xs text-muted mt-2">
              {semester.credits} credits
            </p>
          )}
        </GlowingCard>
      </div>
    </Link>
  );
}
