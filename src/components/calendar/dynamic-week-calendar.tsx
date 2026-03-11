/**
 * Dynamic Calendar Loader — Lazy-loaded FullCalendar wrapper
 *
 * Purpose: Dynamically imports the WeekCalendar component to avoid
 * bundling @fullcalendar (~200KB) in the initial page load.
 * Shows a loading skeleton while the calendar loads.
 *
 * Reference: PRD Section 22.3 (Dynamic imports for heavy components)
 */
import dynamic from "next/dynamic";

/** Loading skeleton shown while FullCalendar loads */
function CalendarSkeleton() {
  return (
    <div className="rounded-xl border border-border overflow-hidden bg-surface/30 animate-pulse">
      {/* Header row skeleton */}
      <div className="flex border-b border-border/30 p-3 gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex-1 h-6 rounded bg-surface-elevated" />
        ))}
      </div>
      {/* Time grid skeleton */}
      <div className="p-2 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-2">
            <div className="w-12 h-4 rounded bg-surface-elevated" />
            <div className="flex-1 h-12 rounded bg-surface-elevated/50" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * DynamicWeekCalendar — Lazy-loaded version of WeekCalendar.
 * Use this instead of importing WeekCalendar directly on pages.
 */
const DynamicWeekCalendar = dynamic(
  () => import("@/components/calendar/week-calendar"),
  {
    loading: () => <CalendarSkeleton />,
    ssr: false, /* FullCalendar requires browser APIs */
  }
);

export default DynamicWeekCalendar;
