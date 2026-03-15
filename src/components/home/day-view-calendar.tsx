/**
 * Day View Calendar — Right panel on Home page
 *
 * Shows a day view of today's schedule (classes, events, tasks).
 * Navigation: Previous Day / Today / Next Day.
 * Shows "No classes today" empty state.
 * If no active semester is set, shows a prompt to activate one.
 *
 * Reference: PRD Section 9.7 (Day View Calendar — Right Panel)
 */
"use client";

import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { format, addDays, subDays, isToday, parseISO } from "date-fns";
import { useDayOccurrences } from "@/lib/hooks/use-occurrences";
import { useSemesterTasks } from "@/lib/hooks/use-tasks";
import { useEvents } from "@/lib/hooks/use-events";

interface DayViewCalendarProps {
  date: string;
  onDateChange: (date: string) => void;
  activeSemesterId?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  activeSemester?: any; // Pass the active semester to extract exams
}

/** Unified schedule item type for DayViewCalendar */
type ScheduleItem = {
  id: string;
  type: "class" | "task" | "exam" | "event";
  title: string;
  subtitle: string;
  startTime: string; // HH:mm for sorting
  color: string;
  isExtra?: boolean;
  attendanceStatus?: string | null;
  isCompleted?: boolean;
};

/**
 * DayViewCalendar — compact day schedule for the home page.
 */
export default function DayViewCalendar({
  date,
  onDateChange,
  activeSemesterId,
  activeSemester,
}: DayViewCalendarProps) {
  const { data: occurrences, isLoading: isLoadingOccurrences } = useDayOccurrences(date);
  const { data: tasks, isLoading: isLoadingTasks } = useSemesterTasks(activeSemesterId || "");
  const { data: events, isLoading: isLoadingEvents } = useEvents(activeSemesterId);

  const isLoading = isLoadingOccurrences || isLoadingTasks || isLoadingEvents;
  const [direction, setDirection] = useState(0);

  const dateObj = parseISO(date);
  const isCurrentDay = isToday(dateObj);

  /** Navigate to previous day */
  const goToPrev = () => {
    setDirection(-1);
    onDateChange(format(subDays(dateObj, 1), "yyyy-MM-dd"));
  };

  /** Navigate to next day */
  const goToNext = () => {
    setDirection(1);
    onDateChange(format(addDays(dateObj, 1), "yyyy-MM-dd"));
  };

  /** Jump to today */
  const goToToday = () => {
    setDirection(0);
    onDateChange(format(new Date(), "yyyy-MM-dd"));
  };

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = `${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`;

  /* Compile all items for the day */
  const combinedItems: ScheduleItem[] = [];

  /* 1. Classes */
  (occurrences || []).forEach((o) => {
    if (o.status === "cancelled") return;
    
    // BF-14: Hide if the class has already ended today
    if (isCurrentDay && o.endTime < currentTime) return;

    combinedItems.push({
      id: `class-${o.id}`,
      type: "class",
      title: o.class_?.name || "Unknown Class",
      subtitle: `${formatTime(o.startTime)} — ${formatTime(o.endTime)}`,
      startTime: o.startTime,
      color: o.class_?.color || "#a855f7",
      isExtra: o.isExtra,
      attendanceStatus: o.attendance && o.attendance.length > 0 ? o.attendance[0].status : null,
    });
  });

  /* 2. Tasks & Assignments */
  (tasks || []).forEach((t) => {
    // Only include tasks due on this date
    if (!t.deadline || !t.deadline.startsWith(date)) return;

    // BF-14: Hide completed tasks
    if (t.isCompleted || t.isSubmitted) return;

    // Extract time from deadline (e.g. 2023-10-25T14:30:00Z -> local time)
    const deadlineDate = new Date(t.deadline);
    const timeString = `${deadlineDate.getHours().toString().padStart(2, "0")}:${deadlineDate.getMinutes().toString().padStart(2, "0")}`;

    // BF-14: Hide past deadlines if viewing today
    if (isCurrentDay && timeString < currentTime) return;

    combinedItems.push({
      id: `task-${t.id}`,
      type: "task",
      title: t.name,
      subtitle: `Due at ${formatTime(timeString)}`,
      startTime: timeString,
      color: "#f59e0b", // Amber for tasks
    });
  });

  /* 3. Non-Academic Events */
  (events || []).forEach((e) => {
    if (e.eventDate !== date) return;

    // BF-14: Hide if event has already ended today
    if (isCurrentDay && e.endTime < currentTime) return;

    combinedItems.push({
      id: `event-${e.id}`,
      type: "event",
      title: e.name,
      subtitle: `${formatTime(e.startTime)} — ${formatTime(e.endTime)}`,
      startTime: e.startTime,
      color: e.color || "#3b82f6", // Blue default
    });
  });

  /* 4. Exams */
  if (activeSemester?.classes) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    activeSemester.classes.forEach((cls: any) => {
      if (cls.exams) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cls.exams.forEach((exam: any) => {
          if (!exam.examDate.startsWith(date)) return;

          const examDate = new Date(exam.examDate);
          const timeString = `${examDate.getHours().toString().padStart(2, "0")}:${examDate.getMinutes().toString().padStart(2, "0")}`;

          // BF-14: Hide passed exams if viewing today
          if (isCurrentDay && timeString < currentTime) return;

          combinedItems.push({
            id: `exam-${exam.id}`,
            type: "exam",
            title: `${exam.name} (${cls.name})`,
            subtitle: `At ${formatTime(timeString)}`,
            startTime: timeString,
            color: "#ef4444", // Red for exams
          });
        });
      }
    });
  }

  /* Sort all items chronologically by start time */
  combinedItems.sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="rounded-xl border border-border dotted-surface-elevated overflow-hidden">
      {/* Header — Date + Navigation */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <button
            onClick={goToPrev}
            className="p-1 rounded hover:bg-surface-elevated transition-colors"
            aria-label="Previous day"
          >
            <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">
              {format(dateObj, "EEEE")}
            </p>
            <p className="text-xs text-muted">
              {format(dateObj, "MMMM d, yyyy")}
            </p>
          </div>

          <button
            onClick={goToNext}
            className="p-1 rounded hover:bg-surface-elevated transition-colors"
            aria-label="Next day"
          >
            <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Today button — only shown when not viewing today */}
        {!isCurrentDay && (
          <button
            onClick={goToToday}
            className="w-full mt-2 text-xs text-accent-purple hover:text-accent-purple/80 transition-colors"
          >
            Jump to Today
          </button>
        )}
      </div>

      {/* Schedule list */}
      <div className="p-4 min-h-[200px]">
        {!activeSemesterId ? (
          /* No active semester state */
          <div className="flex flex-col items-center justify-center h-[200px] text-center">
            <p className="text-sm text-muted">No active semester</p>
            <p className="text-xs text-muted/60 mt-1">
              Set a semester as active to see your schedule
            </p>
          </div>
        ) : isLoading ? (
          /* Loading state */
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-14 rounded-lg bg-surface-elevated animate-pulse"
              />
            ))}
          </div>
        ) : combinedItems.length === 0 ? (
          /* BF-14: Nothing coming up */
          <div className="flex flex-col items-center justify-center h-[200px] text-center">
            <p className="text-sm text-muted">Nothing coming up. Enjoy the calm.</p>
          </div>
        ) : (
          /* Occurrence list */
          <AnimatePresence mode="popLayout" custom={direction}>
            <m.div
              key={date}
              custom={direction}
              initial={{ opacity: 0, x: direction * 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-2"
            >
              {combinedItems.map((item) => (
                <ScheduleItemCard key={item.id} item={item} />
              ))}
            </m.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

/** Helper to format time */
function formatTime(time: string) {
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${ampm}`;
}

/**
 * Single schedule item in the day view.
 */
function ScheduleItemCard({ item }: { item: ScheduleItem }) {
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg bg-surface-elevated/50 hover:bg-surface-elevated transition-colors"
    >
      {/* Color bar */}
      <div
        className="w-1 h-10 rounded-full shrink-0"
        style={{ backgroundColor: item.color }}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-foreground truncate">
            {item.title}
          </p>
          {item.isExtra && (
            <span className="text-[10px] px-1 py-0.5 rounded bg-accent-blue/20 text-accent-blue">
              Extra
            </span>
          )}
          {item.type === "exam" && (
            <span className="text-[10px] px-1 py-0.5 rounded bg-accent-red/20 text-accent-red">
              Exam
            </span>
          )}
          {item.type === "task" && (
            <span className="text-[10px] px-1 py-0.5 rounded bg-accent-amber/20 text-accent-amber">
              Task
            </span>
          )}
          {item.type === "event" && (
            <span className="text-[10px] px-1 py-0.5 rounded bg-accent-blue/20 text-accent-blue">
              Event
            </span>
          )}
        </div>
        <p className="text-xs text-muted">{item.subtitle}</p>
      </div>

      {/* Attendance indicator for classes */}
      {item.type === "class" && item.attendanceStatus && (
        <div className="shrink-0">
          {item.attendanceStatus === "present" && (
            <div className="w-5 h-5 rounded-full bg-accent-green/20 flex items-center justify-center">
              <svg className="w-3 h-3 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          {item.attendanceStatus === "absent" && (
            <div className="w-5 h-5 rounded-full bg-accent-red/20 flex items-center justify-center">
              <svg className="w-3 h-3 text-accent-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
