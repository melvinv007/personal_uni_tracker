/**
 * FullCalendar Week View — Reusable calendar component
 *
 * Purpose: Wraps @fullcalendar/react with dark theme styling.
 * Supports week view (timeGridWeek) and shows class occurrences,
 * exams, tasks, and events as calendar events.
 *
 * Features:
 * - Auto-centers on current time
 * - Current time indicator (white line)
 * - Proportional block heights
 * - Color-coded events by class/type
 * - Click handlers for attendance marking and event viewing
 *
 * Reference: PRD Section 12 (Calendar System)
 */
"use client";

import { useRef, useMemo, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventInput, EventClickArg, DateSelectArg } from "@fullcalendar/core";
import type { Occurrence } from "@/lib/hooks/use-occurrences";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  color: string;
  /** Event type for visual styling */
  type: "class" | "cancelled" | "extra" | "exam" | "task" | "event";
  /** Whether attendance has been marked for this occurrence */
  hasAttendance?: boolean;
  /** Attendance status if marked */
  attendanceStatus?: string;
}

interface WeekCalendarProps {
  events: CalendarEvent[];
  /** Initial date to center the calendar on */
  initialDate?: string;
  /** Called when an event is clicked */
  onEventClick?: (eventId: string, eventType: string) => void;
  /** Called when an empty time slot is clicked */
  onDateSelect?: (start: Date, end: Date) => void;
  /** Calendar height (default: auto) */
  height?: string | number;
  /** Show header toolbar (default: true) */
  showToolbar?: boolean;
}

/**
 * WeekCalendar — FullCalendar wrapper with dark theme.
 */
export default function WeekCalendar({
  events,
  initialDate,
  onEventClick,
  onDateSelect,
  height = "auto",
  showToolbar = true,
}: WeekCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null);

  /* Convert events to FullCalendar format */
  const fcEvents: EventInput[] = useMemo(
    () =>
      events.map((event) => ({
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end,
        backgroundColor: getEventColor(event),
        borderColor: "transparent",
        textColor: "#ededed",
        classNames: [
          `fc-event-${event.type}`,
          event.type === "cancelled" ? "fc-event-cancelled" : "",
        ].filter(Boolean),
        extendedProps: {
          type: event.type,
          hasAttendance: event.hasAttendance,
          attendanceStatus: event.attendanceStatus,
        },
      })),
    [events]
  );

  /* Handle event click */
  const handleEventClick = useCallback(
    (info: EventClickArg) => {
      onEventClick?.(info.event.id, info.event.extendedProps.type);
    },
    [onEventClick]
  );

  /* Handle empty slot selection */
  const handleDateSelect = useCallback(
    (info: DateSelectArg) => {
      onDateSelect?.(info.start, info.end);
    },
    [onDateSelect]
  );

  return (
    <div className="fc-dark-wrapper rounded-xl border border-border overflow-hidden">
      <FullCalendar
        ref={calendarRef}
        plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        initialDate={initialDate}
        /* Time grid settings — PRD Section 12.2 */
        slotMinTime="06:00:00"
        slotMaxTime="23:00:00"
        slotDuration="00:30:00"
        slotLabelInterval="01:00:00"
        allDaySlot={false}
        /* Week settings */
        firstDay={1} /* Monday first */
        weekends={true}
        dayHeaderFormat={{ weekday: "short", day: "numeric" }}
        /* Now indicator — white line — PRD Section 12.3 */
        nowIndicator={true}
        /* Scroll to current time on load */
        scrollTime={getCurrentScrollTime()}
        /* Event display */
        events={fcEvents}
        eventClick={handleEventClick}
        selectable={!!onDateSelect}
        select={handleDateSelect}
        /* Visual */
        height={height}
        stickyHeaderDates={true}
        /* Toolbar */
        headerToolbar={
          showToolbar
            ? {
                left: "prev,next today",
                center: "title",
                right: "timeGridWeek,timeGridDay",
              }
            : false
        }
        /* Button text */
        buttonText={{
          today: "Today",
          week: "Week",
          day: "Day",
        }}
      />
    </div>
  );
}

/**
 * Get event background color based on type.
 * Cancelled events are semi-transparent with strikethrough styling.
 */
function getEventColor(event: CalendarEvent): string {
  switch (event.type) {
    case "cancelled":
      return `${event.color}40`; /* 25% opacity */
    case "extra":
      return event.color;
    case "exam":
      return "#f97316"; /* orange */
    case "task":
      return "#22c55e"; /* green */
    case "event":
      return "#a855f7"; /* purple */
    default:
      return event.color;
  }
}

/**
 * Calculate scroll time to center on current time.
 * Shows 1 hour before current time as the scroll position.
 */
function getCurrentScrollTime(): string {
  const now = new Date();
  const hours = Math.max(0, now.getHours() - 1);
  return `${String(hours).padStart(2, "0")}:00:00`;
}

/**
 * Utility: Convert occurrences to CalendarEvent format.
 * Used by semester and class pages to prepare data for WeekCalendar.
 */
export function occurrencesToCalendarEvents(
  occurrences: Occurrence[]
): CalendarEvent[] {
  return occurrences.map((occ) => {
    const className = occ.class_?.name || "Class";
    const color = occ.class_?.color || "#3b82f6";
    const date = occ.occurrenceDate;
    const hasAttendance =
      occ.attendance && occ.attendance.length > 0;
    const attendanceStatus = hasAttendance
      ? occ.attendance![0].status
      : undefined;

    /* Determine event type */
    let type: CalendarEvent["type"] = "class";
    if (occ.status === "cancelled") type = "cancelled";
    else if (occ.isExtra) type = "extra";

    return {
      id: occ.id,
      title: `${className}${occ.isExtra ? " (Extra)" : ""}`,
      start: `${date}T${occ.startTime}`,
      end: `${date}T${occ.endTime}`,
      color,
      type,
      hasAttendance,
      attendanceStatus,
    };
  });
}
