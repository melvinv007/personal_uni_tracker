/**
 * Home Content — Client Component
 *
 * Purpose: Main home page content that coordinates all home page sections.
 * Layout: Desktop = 2/3 left panel + 1/3 right panel (day view)
 *         Mobile = single column, stacked
 *
 * Sections:
 * - Quote card (daily rotation)
 * - Date/time hero (real-time clock)
 * - CGPA display
 * - Semester cards grid
 * - Day view calendar (right panel)
 *
 * Reference: PRD Section 9 (Home Page)
 */
"use client";

import { useState, useEffect } from "react";
import { m } from "framer-motion";
import { format } from "date-fns";
import { useSemesters } from "@/lib/hooks/use-semesters";
import { useSemesterTasks } from "@/lib/hooks/use-tasks";
import { useNotifications } from "@/lib/hooks/use-notifications";
import QuoteCard from "./quote-card";
import DateTimeHero from "./date-time-hero";
import CgpaDisplay from "./cgpa-display";
import SemesterGrid from "./semester-grid";
import DayViewCalendar from "./day-view-calendar";
import CreateSemesterModal from "./create-semester-modal";
import NotificationPermissionCard from "./notification-permission-card";
import WeeklyAcademicSummary from "./weekly-academic-summary";
import { FAB } from "@/components/ui/fab";
import { PageLoader } from "@/components/ui/loading";
import { OfflineBanner } from "@/components/ui/offline-banner";

/**
 * HomeContent — orchestrates the full home page layout.
 */
export default function HomeContent() {
  const { data: semesters, isLoading } = useSemesters();
  const [showCreateModal, setShowCreateModal] = useState(false);

  /* Today's date for the day view calendar — defaults to today */
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );

  /* Find the active semester for notification deadline checks */
  const activeSemester = semesters?.find((s) => s.isActive);

  /* Fetch tasks for the active semester to check assignment deadlines — PRD §19.2 */
  const { data: activeTasks } = useSemesterTasks(activeSemester?.id || "");
  const { checkAssignmentDeadlines, permission } = useNotifications();

  /* Check assignment deadlines on load when notifications are granted — PRD §19.2 */
  useEffect(() => {
    if (permission === "granted" && activeTasks && activeTasks.length > 0) {
      checkAssignmentDeadlines(activeTasks);
    }
  }, [permission, activeTasks, checkAssignmentDeadlines]);

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <>
      <OfflineBanner />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 lg:pb-8">
        {/* Desktop: 2/3 + 1/3 layout | Mobile: stacked */}
        <div className="lg:grid lg:grid-cols-3 lg:gap-6">
          {/* ========== LEFT PANEL (2/3) ========== */}
          <div className="lg:col-span-2 space-y-6 pt-6">
            {/* Quote + DateTime row on desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <QuoteCard />
              <DateTimeHero />
            </div>

            {/* CGPA Display */}
            <CgpaDisplay semesters={semesters || []} />

            {/* Notification permission prompt — PRD Section 18.1 */}
            <NotificationPermissionCard />

            {/* Semester Cards Grid */}
            <SemesterGrid
              semesters={semesters || []}
              onCreateNew={() => setShowCreateModal(true)}
            />
          </div>

          {/* ========== RIGHT PANEL (1/3) — Day View Calendar ========== */}
          <div className="lg:col-span-1 pt-6">
            <m.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <DayViewCalendar
                date={selectedDate}
                onDateChange={setSelectedDate}
                activeSemesterId={activeSemester?.id}
              />

              {/* Weekly Academic Summary — Sundays only — PRD §9.8, §17.6 */}
              <WeeklyAcademicSummary activeSemesterId={activeSemester?.id} />
            </m.div>
          </div>
        </div>
      </div>

      {/* FAB for creating new semester (mobile primary action) */}
      <FAB
        actions={[
          {
            label: "New Semester",
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            ),
            onClick: () => setShowCreateModal(true),
          },
        ]}
      />

      {/* Create Semester Modal */}
      {showCreateModal && (
        <CreateSemesterModal onClose={() => setShowCreateModal(false)} />
      )}
    </>
  );
}
