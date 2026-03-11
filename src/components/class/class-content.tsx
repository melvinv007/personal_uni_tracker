/**
 * Class Content — Main Client Component for Class Detail Page
 *
 * Purpose: Orchestrates all sections of the class detail page.
 * Fetches class data via useClass() and attendance via useAttendance().
 *
 * Layout:
 * - Sticky header (name, attendance %, next exam, back button)
 * - Today's attendance prompt (if class today + not yet marked)
 * - Attendance stats card
 * - Weekly schedule card
 * - Tasks section
 * - Exams section
 * - Notes area (auto-save)
 *
 * Reference: PRD Section 11 (Class Detail Page)
 */
"use client";

import { useState, useMemo } from "react";
import { format, isToday, parseISO, isPast } from "date-fns";
import { useClass } from "@/lib/hooks/use-classes";
import { useAttendance } from "@/lib/hooks/use-attendance";
import { useClassTasks } from "@/lib/hooks/use-tasks";
import { useSemester } from "@/lib/hooks/use-semesters";
import { calculateAttendanceStats } from "@/lib/utils/attendance";
import { PageLoader } from "@/components/ui/loading";
import { FAB } from "@/components/ui/fab";
import { OfflineBanner } from "@/components/ui/offline-banner";
import ClassHeader from "./class-header";
import AttendancePrompt from "./attendance-prompt";
import AttendanceStatsCard from "./attendance-stats-card";
import WeeklyScheduleCard from "./weekly-schedule-card";
import TasksSection from "./tasks-section";
import ExamsSection from "./exams-section";
import ClassNotes from "./class-notes";
import CreateTaskModal from "./create-task-modal";
import CreateExamModal from "./create-exam-modal";
import CreateExtraClassModal from "./create-extra-class-modal";
import PendingAttendance from "./pending-attendance";
import AttendanceCalculator from "./attendance-calculator";
import AttendanceHistory from "./attendance-history";
import AssignmentsSection from "./assignments-section";
import ClassMarksTrend from "./class-marks-trend";
import ExamScorePredictor from "./exam-score-predictor";
import LetterGradeInput from "./letter-grade-input";
import SyllabusRubric from "./syllabus-rubric";
import FilesSection from "./files-section";
import ClassWeekCalendar from "./class-week-calendar";

interface ClassContentProps {
  classId: string;
  semesterId: string;
}

/**
 * ClassContent — orchestrates the full class detail page.
 */
export default function ClassContent({
  classId,
  semesterId,
}: ClassContentProps) {
  const { data: classData, isLoading, error } = useClass(classId);
  const { data: attendance } = useAttendance(classId);
  const { data: tasks } = useClassTasks(classId);
  const { data: semesterData } = useSemester(semesterId);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showCreateExam, setShowCreateExam] = useState(false);
  const [showCreateExtraClass, setShowCreateExtraClass] = useState(false);

  /* Calculate attendance stats */
  const attendanceStats = useMemo(() => {
    if (!classData?.occurrences) return null;
    return calculateAttendanceStats(
      classData.occurrences,
      (attendance || []).map((a) => ({
        occurrenceId: a.occurrenceId,
        status: a.status,
      }))
    );
  }, [classData?.occurrences, attendance]);

  /* Find today's occurrence (if any) — for the attendance prompt */
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayOccurrences = useMemo(() => {
    return (classData?.occurrences || []).filter(
      (o) => o.occurrenceDate === todayStr && o.status !== "cancelled"
    );
  }, [classData?.occurrences, todayStr]);

  /* Check which today's occurrences don't have attendance marked */
  const unmarkedToday = useMemo(() => {
    const markedIds = new Set(
      (attendance || []).map((a) => a.occurrenceId)
    );
    return todayOccurrences.filter((o) => !markedIds.has(o.id));
  }, [todayOccurrences, attendance]);

  /* Find next upcoming exam */
  const nextExam = useMemo(() => {
    if (!classData) return null;
    const upcoming = classData.exams
      .filter((e) => !isPast(parseISO(e.examDate)) || isToday(parseISO(e.examDate)))
      .sort((a, b) => a.examDate.localeCompare(b.examDate));
    return upcoming[0] || null;
  }, [classData]);

  if (isLoading) return <PageLoader />;

  if (error || !classData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted">Class not found</p>
      </div>
    );
  }

  return (
    <>
      <OfflineBanner />

      {/* Sticky Header — PRD Section 11.1 */}
      <ClassHeader
        classData={classData}
        attendancePercentage={attendanceStats?.attendancePercentage ?? null}
        nextExam={nextExam}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 lg:pb-8 pt-4">
        <div className="space-y-8">
          {/* Today's Attendance Prompt — PRD Section 11.2 */}
          {unmarkedToday.length > 0 && (
            <AttendancePrompt
              classId={classId}
              occurrences={unmarkedToday}
              classColor={classData.color}
            />
          )}

          {/* Pending Attendance — PRD Section 11.4 (unmarked past sessions) */}
          <PendingAttendance
            classId={classId}
            occurrences={classData.occurrences || []}
            attendance={attendance || []}
            classColor={classData.color}
          />

          {/* Attendance Stats — PRD Section 11.3 */}
          {attendanceStats && (
            <AttendanceStatsCard
              stats={attendanceStats}
              classColor={classData.color}
              totalRemaining={
                (classData.occurrences || []).filter(
                  (o) =>
                    o.occurrenceDate > todayStr &&
                    o.status !== "cancelled"
                ).length
              }
            />
          )}

          {/* Attendance Calculator (Survival + Bunk Planner) — PRD Section 11.7 */}
          {attendanceStats && (
            <AttendanceCalculator
              stats={attendanceStats}
              classColor={classData.color}
            />
          )}

          {/* Interactive Week Calendar — PRD Section 11.2 */}
          <ClassWeekCalendar
            classId={classId}
            classColor={classData.color}
            className={classData.name}
            exams={classData.exams.map(e => ({ id: e.id, name: e.name, examDate: e.examDate }))}
            tasks={(tasks || []).map(t => ({ id: t.id, name: t.name, deadline: t.deadline }))}
            onCreateTask={() => setShowCreateTask(true)}
            onCreateExam={() => setShowCreateExam(true)}
            onCreateExtraClass={() => setShowCreateExtraClass(true)}
          />

          {/* Weekly Schedule — PRD Section 11.4 */}
          <WeeklyScheduleCard
            scheduleSlots={classData.scheduleSlots}
            classColor={classData.color}
          />

          {/* Tasks Section — PRD Section 11.5 */}
          <TasksSection
            tasks={tasks || []}
            classId={classId}
            semesterId={semesterId}
            onCreateNew={() => setShowCreateTask(true)}
          />

          {/* Exams Section — PRD Section 11.6 */}
          <ExamsSection
            exams={classData.exams}
            classId={classId}
            classColor={classData.color}
            onCreateNew={() => setShowCreateExam(true)}
          />

          {/* Assignments Section — PRD Section 11.10 */}
          <AssignmentsSection
            tasks={tasks || []}
            classId={classId}
            semesterId={semesterId}
          />

          {/* Marks Trend Graph — PRD Section 11.12 */}
          <ClassMarksTrend
            exams={classData.exams}
            classColor={classData.color}
          />

          {/* Exam Score Predictor — PRD Section 11.13 */}
          <ExamScorePredictor
            exams={classData.exams}
            classColor={classData.color}
          />

          {/* Notes — PRD Section 11.15 */}
          <ClassNotes
            classId={classId}
            semesterId={semesterId}
            initialNotes={classData.notes || ""}
          />

          {/* Attendance History — PRD Section 11.14 */}
          <AttendanceHistory
            classId={classId}
            occurrences={classData.occurrences || []}
            attendance={attendance || []}
          />

          {/* Files Section — PRD Section 11.16 (desktop only) */}
          <FilesSection
            classId={classId}
            files={classData.files || []}
            classColor={classData.color}
          />

          {/* Syllabus Rubric + Grade Calculator — PRD Section 11.17 */}
          <SyllabusRubric
            classId={classId}
            classColor={classData.color}
            existingRubric={classData.syllabusRubric?.[0]?.components ?? null}
            exams={classData.exams}
          />

          {/* Post-Semester Letter Grade — PRD Section 11.18 */}
          {semesterData?.isCompleted && (
            <LetterGradeInput
              classId={classId}
              semesterId={semesterId}
              className={classData.name}
              currentGrade={classData.letterGrade?.[0]?.grade ?? null}
              classColor={classData.color}
            />
          )}
        </div>
      </div>

      {/* FAB with multiple actions */}
      <FAB
        actions={[
          {
            label: "New Task",
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
            onClick: () => setShowCreateTask(true),
          },
          {
            label: "New Exam",
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            ),
            onClick: () => setShowCreateExam(true),
          },
          {
            label: "Extra Class",
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            ),
            onClick: () => setShowCreateExtraClass(true),
          },
        ]}
      />

      {/* Create Task Modal */}
      {showCreateTask && (
        <CreateTaskModal
          classId={classId}
          semesterId={semesterId}
          onClose={() => setShowCreateTask(false)}
        />
      )}

      {/* Create Exam Modal */}
      {showCreateExam && (
        <CreateExamModal
          classId={classId}
          onClose={() => setShowCreateExam(false)}
        />
      )}

      {/* Create Extra Class Modal */}
      {showCreateExtraClass && (
        <CreateExtraClassModal
          classId={classId}
          onClose={() => setShowCreateExtraClass(false)}
        />
      )}
    </>
  );
}
