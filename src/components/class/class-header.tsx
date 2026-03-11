/**
 * Class Header — Sticky top bar on class detail page
 *
 * Shows: Back button, class name, color dot, attendance %, next exam countdown.
 * Sticks to top on scroll with blur backdrop.
 *
 * Reference: PRD Section 11.1 (Class Sticky Header)
 */
"use client";

import { m } from "framer-motion";
import { differenceInDays, parseISO } from "date-fns";
import type { ClassDetail } from "@/lib/hooks/use-classes";
import { BackButton } from "@/components/ui/back-button";

interface ClassHeaderProps {
  classData: ClassDetail;
  attendancePercentage: number | null;
  nextExam: {
    id: string;
    name: string;
    examDate: string;
  } | null;
}

/**
 * ClassHeader — Sticky header for the class detail page.
 */
export default function ClassHeader({
  classData,
  attendancePercentage,
  nextExam,
}: ClassHeaderProps) {
  /* Attendance color based on percentage */
  const getAttendanceColor = () => {
    if (attendancePercentage == null) return "text-muted";
    if (attendancePercentage >= 75) return "text-accent-green";
    if (attendancePercentage >= 60) return "text-accent-amber";
    return "text-accent-red";
  };

  /* Next exam countdown */
  const examCountdown = nextExam
    ? differenceInDays(parseISO(nextExam.examDate), new Date())
    : null;

  return (
    <m.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="
        sticky top-0 z-40
        bg-background/80 backdrop-blur-xl
        border-b border-border
      "
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Left: Back + class info */}
          <div className="flex items-center gap-3 min-w-0">
            <BackButton label={classData.semester.name} />

            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: classData.color }}
            />

            <h1 className="text-base font-semibold text-foreground truncate">
              {classData.name}
            </h1>
          </div>

          {/* Right: Stats */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Attendance percentage */}
            {attendancePercentage != null && (
              <div className="text-right">
                <p className={`text-sm font-bold ${getAttendanceColor()}`}>
                  {attendancePercentage.toFixed(1)}%
                </p>
                <p className="text-[10px] text-muted">Attendance</p>
              </div>
            )}

            {/* Next exam countdown */}
            {nextExam && examCountdown != null && examCountdown >= 0 && (
              <div className="text-right">
                <p className="text-sm font-bold text-accent-orange">
                  {examCountdown === 0 ? "Today" : `${examCountdown}d`}
                </p>
                <p className="text-[10px] text-muted truncate max-w-[80px]">
                  {nextExam.name}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </m.header>
  );
}
