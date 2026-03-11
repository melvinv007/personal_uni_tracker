/**
 * Semester Header — Sticky top bar on semester detail page
 *
 * Shows: Back button, semester name, color indicator, projected SPI,
 * official SPI (if completed), active/completed badges.
 *
 * Sticky behavior: Sticks to top on scroll with blur backdrop.
 *
 * Reference: PRD Section 10.1 (Sticky Header)
 */
"use client";

import { m } from "framer-motion";
import type { SemesterDetail } from "@/lib/hooks/use-semesters";
import { BackButton } from "@/components/ui/back-button";

interface SemesterHeaderProps {
  semester: SemesterDetail;
  projectedSPI: number | null;
  officialSPI: number | null;
}

/**
 * SemesterHeader — Sticky header with semester info and navigation.
 */
export default function SemesterHeader({
  semester,
  projectedSPI,
  officialSPI,
}: SemesterHeaderProps) {
  /* Display SPI — prefer official, fall back to projected */
  const displaySPI = officialSPI ?? projectedSPI;
  const spiLabel = officialSPI != null ? "Official SPI" : "Projected SPI";

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Left: Back button + semester info */}
          <div className="flex items-center gap-3 min-w-0">
            <BackButton label="Home" />

            {/* Color dot */}
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: semester.color }}
            />

            {/* Name + badges */}
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-base font-semibold text-foreground truncate">
                {semester.name}
              </h1>

              {semester.isActive && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-accent-green/20 text-accent-green text-[10px] font-bold shrink-0">
                  A
                </span>
              )}
              {semester.isCompleted && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted/20 text-muted shrink-0">
                  Done
                </span>
              )}
            </div>
          </div>

          {/* Right: SPI display */}
          <div className="flex items-center gap-2 shrink-0">
            {displaySPI != null ? (
              <div className="text-right">
                <p className="text-sm font-bold text-foreground">
                  {displaySPI.toFixed(2)}
                </p>
                <p className="text-[10px] text-muted">{spiLabel}</p>
              </div>
            ) : (
              <div className="text-right">
                <p className="text-sm text-muted">—</p>
                <p className="text-[10px] text-muted">No scores yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </m.header>
  );
}
