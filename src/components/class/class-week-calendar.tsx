/**
 * Class Week Calendar — Interactive FullCalendar for class page
 *
 * Shows this class's occurrences, exams, and tasks on a week calendar.
 * Interactive: click events to mark attendance or cancel occurrences.
 * Click empty time slot for quick-add menu (task / exam / extra class).
 *
 * Reference: PRD Section 11.2 (Interactive Calendar), Section 12 (Calendar System)
 */
"use client";

import { useState, useMemo, useCallback } from "react";
import { format, startOfWeek, addWeeks, subWeeks, parseISO, isPast, isToday } from "date-fns";
import { m, AnimatePresence } from "framer-motion";
import DynamicWeekCalendar from "@/components/calendar/dynamic-week-calendar";
import { useClassOccurrences, useUpdateOccurrence } from "@/lib/hooks/use-occurrences";
import { useMarkAttendance, useAttendance } from "@/lib/hooks/use-attendance";

interface ClassWeekCalendarProps {
  classId: string;
  classColor: string;
  className: string;
  /** Exams for this class (shown as orange blocks) */
  exams: Array<{
    id: string;
    name: string;
    examDate: string;
  }>;
  /** Tasks with deadlines for this class (shown as deadline markers) */
  tasks: Array<{
    id: string;
    name: string;
    deadline: string | null;
  }>;
  /** Callbacks for quick-add actions */
  onCreateTask: () => void;
  onCreateExam: () => void;
  onCreateExtraClass: () => void;
}

/** Attendance action popup state */
interface AttendancePopup {
  occurrenceId: string;
  occurrenceDate: string;
  startTime: string;
  title: string;
  currentStatus: string | null;
  position: { x: number; y: number };
}

/** Quick-add popup from clicking empty slot */
interface QuickAddPopup {
  start: Date;
  end: Date;
  position: { x: number; y: number };
}

/**
 * ClassWeekCalendar — interactive calendar for the class page.
 */
export default function ClassWeekCalendar({
  classId,
  classColor,
  className: classDisplayName,
  exams,
  tasks,
  onCreateTask,
  onCreateExam,
  onCreateExtraClass,
}: ClassWeekCalendarProps) {
  const [weekStart, setWeekStart] = useState(() =>
    format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd")
  );
  const [attendancePopup, setAttendancePopup] = useState<AttendancePopup | null>(null);
  const [quickAddPopup, setQuickAddPopup] = useState<QuickAddPopup | null>(null);

  const { data: occurrences } = useClassOccurrences(classId);
  const { data: attendance } = useAttendance(classId);
  const markAttendance = useMarkAttendance(classId);
  const updateOccurrence = useUpdateOccurrence();

  /* Build a lookup of attendance by occurrence ID */
  const attendanceMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of attendance || []) {
      map.set(a.occurrenceId, a.status);
    }
    return map;
  }, [attendance]);

  /* Convert occurrences to calendar events, filtering to this class only */
  const calendarEvents = useMemo(() => {
    if (!occurrences) return [];

    /* Class occurrences — with attendance info */
    const classEvents = occurrences.map((occ) => ({
      id: occ.id,
      title: `${classDisplayName}${occ.isExtra ? " (Extra)" : ""}`,
      start: `${occ.occurrenceDate}T${occ.startTime}`,
      end: `${occ.occurrenceDate}T${occ.endTime}`,
      color: classColor,
      type: occ.status === "cancelled"
        ? "cancelled" as const
        : occ.isExtra
        ? "extra" as const
        : "class" as const,
      hasAttendance: attendanceMap.has(occ.id),
      attendanceStatus: attendanceMap.get(occ.id),
    }));

    /* Exam events — orange blocks */
    const examEvents = exams.map((exam) => ({
      id: `exam-${exam.id}`,
      title: exam.name,
      start: `${exam.examDate}T09:00`,
      end: `${exam.examDate}T10:00`,
      color: "#f97316",
      type: "exam" as const,
    }));

    /* Task deadline markers */
    const taskEvents = tasks
      .filter((t) => t.deadline)
      .map((task) => ({
        id: `task-${task.id}`,
        title: task.name,
        start: task.deadline!,
        end: task.deadline!,
        color: "#ef4444",
        type: "task" as const,
      }));

    return [...classEvents, ...examEvents, ...taskEvents];
  }, [occurrences, exams, tasks, attendanceMap, classColor, classDisplayName]);

  /* Handle clicking a calendar event — PRD §11.2 interactivity */
  const handleEventClick = useCallback(
    (eventId: string, eventType: string) => {
      /* Only class/extra/cancelled occurrences are interactive */
      if (eventType !== "class" && eventType !== "extra" && eventType !== "cancelled") return;

      const occurrence = occurrences?.find((o) => o.id === eventId);
      if (!occurrence) return;

      const currentAttStatus = attendanceMap.get(eventId) ?? null;
      setQuickAddPopup(null);
      setAttendancePopup({
        occurrenceId: eventId,
        occurrenceDate: occurrence.occurrenceDate,
        startTime: occurrence.startTime,
        title: classDisplayName,
        currentStatus: currentAttStatus,
        /* Position center of viewport for simplicity */
        position: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
      });
    },
    [occurrences, attendanceMap, classDisplayName]
  );

  /* Handle clicking empty time slot — PRD §11.2 quick-add */
  const handleDateSelect = useCallback(
    (start: Date, end: Date) => {
      setAttendancePopup(null);
      setQuickAddPopup({
        start,
        end,
        position: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
      });
    },
    []
  );

  /* Mark attendance action */
  const handleMarkAttendance = useCallback(
    (status: "present" | "absent") => {
      if (!attendancePopup) return;
      markAttendance.mutate({
        occurrenceId: attendancePopup.occurrenceId,
        classId,
        status,
      });
      setAttendancePopup(null);
    },
    [attendancePopup, markAttendance, classId]
  );

  /* Cancel occurrence action — PRD §13.5 */
  const handleCancelOccurrence = useCallback(() => {
    if (!attendancePopup) return;
    updateOccurrence.mutate({
      id: attendancePopup.occurrenceId,
      data: { status: "cancelled" },
    });
    setAttendancePopup(null);
  }, [attendancePopup, updateOccurrence]);

  /* Week navigation */
  const weekStartDate = parseISO(weekStart);
  const goToPrevWeek = () =>
    setWeekStart(format(subWeeks(weekStartDate, 1), "yyyy-MM-dd"));
  const goToNextWeek = () =>
    setWeekStart(format(addWeeks(weekStartDate, 1), "yyyy-MM-dd"));
  const goToThisWeek = () =>
    setWeekStart(format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"));

  return (
    <div className="relative">
      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-foreground">
          Week Calendar
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevWeek}
            className="p-1.5 rounded hover:bg-surface-elevated transition-colors"
            aria-label="Previous week"
          >
            <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToThisWeek}
            className="text-xs font-medium text-muted hover:text-foreground transition-colors px-2 py-1"
          >
            Today
          </button>
          <button
            onClick={goToNextWeek}
            className="p-1.5 rounded hover:bg-surface-elevated transition-colors"
            aria-label="Next week"
          >
            <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* FullCalendar (lazy-loaded) — PRD §11.2 */}
      <DynamicWeekCalendar
        events={calendarEvents}
        initialDate={weekStart}
        onEventClick={handleEventClick}
        onDateSelect={handleDateSelect}
        height={500}
        showToolbar={false}
      />

      {/* Attendance Action Popup — appears when clicking a class event */}
      <AnimatePresence>
        {attendancePopup && (
          <AttendanceActionPopup
            popup={attendancePopup}
            onMarkPresent={() => handleMarkAttendance("present")}
            onMarkAbsent={() => handleMarkAttendance("absent")}
            onCancel={handleCancelOccurrence}
            onClose={() => setAttendancePopup(null)}
          />
        )}
      </AnimatePresence>

      {/* Quick-Add Popup — appears when clicking empty time slot */}
      <AnimatePresence>
        {quickAddPopup && (
          <QuickAddMenu
            popup={quickAddPopup}
            onCreateTask={() => {
              onCreateTask();
              setQuickAddPopup(null);
            }}
            onCreateExam={() => {
              onCreateExam();
              setQuickAddPopup(null);
            }}
            onCreateExtraClass={() => {
              onCreateExtraClass();
              setQuickAddPopup(null);
            }}
            onClose={() => setQuickAddPopup(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * AttendanceActionPopup — Floating popup for attendance marking + cancel.
 * Shows when a class occurrence is clicked on the calendar.
 */
function AttendanceActionPopup({
  popup,
  onMarkPresent,
  onMarkAbsent,
  onCancel,
  onClose,
}: {
  popup: AttendancePopup;
  onMarkPresent: () => void;
  onMarkAbsent: () => void;
  onCancel: () => void;
  onClose: () => void;
}) {
  const occDate = parseISO(popup.occurrenceDate);
  const isFuture = !isPast(occDate) && !isToday(occDate);
  const currentlyMarked = popup.currentStatus;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Popup */}
      <m.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed z-50 w-64 rounded-xl border border-border bg-surface-elevated shadow-xl p-4 space-y-3"
        style={{
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        {/* Header */}
        <div>
          <p className="text-sm font-semibold text-foreground">{popup.title}</p>
          <p className="text-xs text-muted">
            {format(occDate, "EEE, MMM d")} at {popup.startTime.slice(0, 5)}
          </p>
          {currentlyMarked && (
            <span
              className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                currentlyMarked === "present"
                  ? "bg-accent-green/20 text-accent-green"
                  : currentlyMarked === "absent"
                  ? "bg-accent-red/20 text-accent-red"
                  : "bg-muted/20 text-muted"
              }`}
            >
              Currently: {currentlyMarked}
            </span>
          )}
        </div>

        {/* Attendance buttons — not available for future classes (PRD §13.2) */}
        {!isFuture && (
          <div className="flex gap-2">
            <button
              onClick={onMarkPresent}
              className="flex-1 text-xs font-medium py-2 rounded-lg bg-accent-green/20 text-accent-green hover:bg-accent-green/30 transition-colors"
            >
              Present
            </button>
            <button
              onClick={onMarkAbsent}
              className="flex-1 text-xs font-medium py-2 rounded-lg bg-accent-red/20 text-accent-red hover:bg-accent-red/30 transition-colors"
            >
              Absent
            </button>
          </div>
        )}

        {/* Cancel occurrence — PRD §13.5 */}
        <button
          onClick={onCancel}
          className="w-full text-xs font-medium py-2 rounded-lg bg-muted/10 text-muted hover:bg-muted/20 transition-colors"
        >
          Cancel This Class
        </button>

        {/* Close */}
        <button
          onClick={onClose}
          className="w-full text-[10px] text-muted/60 hover:text-muted transition-colors"
        >
          Dismiss
        </button>
      </m.div>
    </>
  );
}

/**
 * QuickAddMenu — Floating menu for creating items from an empty time slot.
 * Shows when an empty calendar slot is clicked/selected.
 */
function QuickAddMenu({
  popup,
  onCreateTask,
  onCreateExam,
  onCreateExtraClass,
  onClose,
}: {
  popup: QuickAddPopup;
  onCreateTask: () => void;
  onCreateExam: () => void;
  onCreateExtraClass: () => void;
  onClose: () => void;
}) {
  const actions = [
    {
      label: "New Task",
      icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
      onClick: onCreateTask,
    },
    {
      label: "New Exam",
      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
      onClick: onCreateExam,
    },
    {
      label: "Extra Class",
      icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
      onClick: onCreateExtraClass,
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Menu */}
      <m.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        className="fixed z-50 w-48 rounded-xl border border-border bg-surface-elevated shadow-xl p-2"
        style={{
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <p className="text-[10px] text-muted px-2 pb-1 mb-1 border-b border-border/50">
          {format(popup.start, "EEE, MMM d · HH:mm")}
        </p>
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className="w-full flex items-center gap-2 px-2 py-2 text-xs text-foreground hover:bg-surface rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
            </svg>
            {action.label}
          </button>
        ))}
      </m.div>
    </>
  );
}
