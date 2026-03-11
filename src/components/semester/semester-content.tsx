/**
 * Semester Content — Main Client Component
 *
 * Purpose: Orchestrates all sections of the semester detail page.
 * Fetches semester data via useSemester() hook and distributes to children.
 *
 * Layout:
 * - Sticky header (name, projected SPI, color, back button)
 * - Week calendar (desktop) / mobile week strip
 * - Upcoming section (exams, tasks sorted by date)
 * - Attendance overview (per-class stats)
 * - Class cards grid
 * - Notes area (auto-save)
 *
 * Reference: PRD Section 10 (Semester Page)
 */
"use client";

import { useState, useMemo, useCallback } from "react";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { useSemester } from "@/lib/hooks/use-semesters";
import { useSemesterTasks } from "@/lib/hooks/use-tasks";
import { useWeekOccurrences } from "@/lib/hooks/use-occurrences";
import { calculateProjectedSPI } from "@/lib/utils/grades";
import { PageLoader } from "@/components/ui/loading";
import { FAB } from "@/components/ui/fab";
import { OfflineBanner } from "@/components/ui/offline-banner";
import SemesterHeader from "./semester-header";
import SemesterWeekCalendar from "./semester-week-calendar";
import UpcomingSection from "./upcoming-section";
import AttendanceOverview from "./attendance-overview";
import ClassCardsGrid from "./class-cards-grid";
import SemesterNotes from "./semester-notes";
import MarksTrendGraphs from "./marks-trend-graphs";
import WeeklyScheduleSummary from "./weekly-schedule-summary";
import SemesterInsights from "./semester-insights";
import CreateClassModal from "./create-class-modal";
import SemesterQuickAddMenu, {
  type QuickAddAction,
} from "./semester-quick-add-menu";
import CreateEventModal from "./create-event-modal";
import CreateTaskModal from "@/components/class/create-task-modal";
import CreateExamModal from "@/components/class/create-exam-modal";
import CreateExtraClassModal from "@/components/class/create-extra-class-modal";

interface SemesterContentProps {
  semesterId: string;
}

/**
 * SemesterContent — orchestrates the full semester detail page.
 */
export default function SemesterContent({ semesterId }: SemesterContentProps) {
  const { data: semester, isLoading, error } = useSemester(semesterId);
  const { data: tasks } = useSemesterTasks(semesterId);
  const [showCreateClass, setShowCreateClass] = useState(false);

  /* Quick-add state — tracks which date was clicked and which modal to open */
  const [quickAddDate, setQuickAddDate] = useState<string | null>(null);
  const [quickAddModal, setQuickAddModal] = useState<{
    action: QuickAddAction;
    classId?: string;
    date: string;
  } | null>(null);

  /* Week calendar date range — defaults to current week */
  const [weekStart, setWeekStart] = useState(() =>
    format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd")
  );
  const weekEnd = useMemo(
    () =>
      format(
        endOfWeek(new Date(weekStart), { weekStartsOn: 1 }),
        "yyyy-MM-dd"
      ),
    [weekStart]
  );
  const { data: weekOccurrences } = useWeekOccurrences(weekStart, weekEnd);

  /** Handle quick-add action selection from the quick-add menu */
  const handleQuickAddAction = useCallback(
    (action: QuickAddAction, classId?: string) => {
      if (!quickAddDate) return;
      setQuickAddModal({ action, classId, date: quickAddDate });
      setQuickAddDate(null); // Close the quick-add menu
    },
    [quickAddDate]
  );

  /** Close whichever creation modal is open from quick-add */
  const closeQuickAddModal = useCallback(() => {
    setQuickAddModal(null);
  }, []);

  if (isLoading) return <PageLoader />;

  if (error || !semester) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted">Semester not found</p>
      </div>
    );
  }

  /* Calculate projected SPI from all scored exams across all classes */
  const allExams = semester.classes.flatMap((cls) =>
    cls.exams.map((exam) => ({
      marksScored:
        exam.marksScored != null ? parseFloat(exam.marksScored) : null,
      totalMarks: parseFloat(exam.totalMarks),
      weightage: parseFloat(exam.weightage),
    }))
  );
  const projectedSPI = calculateProjectedSPI(allExams);

  /* Official SPI from officialGrades if available */
  const officialSPI =
    semester.officialGrades?.[0]?.spi != null
      ? parseFloat(semester.officialGrades[0].spi)
      : null;

  return (
    <>
      <OfflineBanner />

      {/* Sticky Header — PRD Section 10.1 */}
      <SemesterHeader
        semester={semester}
        projectedSPI={projectedSPI}
        officialSPI={officialSPI}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 lg:pb-8 pt-4">
        <div className="space-y-8">
          {/* Week Calendar — PRD Section 10.2 */}
          <SemesterWeekCalendar
            occurrences={weekOccurrences || []}
            weekStart={weekStart}
            onWeekChange={setWeekStart}
            semesterColor={semester.color}
            onQuickAdd={(date) => setQuickAddDate(date)}
          />

          {/* Upcoming Exams & Tasks — PRD Section 10.3 */}
          <UpcomingSection
            classes={semester.classes}
            tasks={tasks || []}
          />

          {/* Attendance Overview — PRD Section 10.4 */}
          <AttendanceOverview classes={semester.classes} />

          {/* Class Cards Grid — PRD Section 10.5 */}
          <ClassCardsGrid
            classes={semester.classes}
            semesterId={semesterId}
            onCreateNew={() => setShowCreateClass(true)}
          />

          {/* Marks Trend Graphs — PRD Section 10.6 */}
          <MarksTrendGraphs classes={semester.classes} />

          {/* Weekly Schedule Summary — PRD Section 10.7 */}
          <WeeklyScheduleSummary classes={semester.classes} />

          {/* Semester Insights — PRD Section 10.8 */}
          <SemesterInsights classes={semester.classes} />

          {/* Notes — PRD Section 10.9 */}
          <SemesterNotes
            semesterId={semesterId}
            initialNotes={semester.notes || ""}
          />
        </div>
      </div>

      {/* FAB for creating new class */}
      <FAB
        actions={[
          {
            label: "New Class",
            icon: (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            ),
            onClick: () => setShowCreateClass(true),
          },
        ]}
      />

      {/* Create Class Modal */}
      {showCreateClass && (
        <CreateClassModal
          semesterId={semesterId}
          semesterColor={semester.color}
          semesterStartDate={semester.startDate}
          semesterEndDate={semester.endDate}
          onClose={() => setShowCreateClass(false)}
        />
      )}

      {/* Quick-Add Menu — appears when clicking empty day cell on calendar */}
      {quickAddDate && (
        <SemesterQuickAddMenu
          date={quickAddDate}
          classes={semester.classes.map((c) => ({
            id: c.id,
            name: c.name,
            color: c.color,
          }))}
          onAction={handleQuickAddAction}
          onClose={() => setQuickAddDate(null)}
        />
      )}

      {/* Quick-Add: Task creation modal */}
      {quickAddModal?.action === "task" && quickAddModal.classId && (
        <CreateTaskModal
          classId={quickAddModal.classId}
          semesterId={semesterId}
          defaultDate={quickAddModal.date}
          onClose={closeQuickAddModal}
        />
      )}

      {/* Quick-Add: Exam creation modal */}
      {quickAddModal?.action === "exam" && quickAddModal.classId && (
        <CreateExamModal
          classId={quickAddModal.classId}
          defaultDate={quickAddModal.date}
          onClose={closeQuickAddModal}
        />
      )}

      {/* Quick-Add: Extra class creation modal */}
      {quickAddModal?.action === "extra-class" && quickAddModal.classId && (
        <CreateExtraClassModal
          classId={quickAddModal.classId}
          defaultDate={quickAddModal.date}
          onClose={closeQuickAddModal}
        />
      )}

      {/* Quick-Add: Non-academic event creation modal */}
      {quickAddModal?.action === "event" && (
        <CreateEventModal
          semesterId={semesterId}
          defaultDate={quickAddModal.date}
          onClose={closeQuickAddModal}
        />
      )}
    </>
  );
}
