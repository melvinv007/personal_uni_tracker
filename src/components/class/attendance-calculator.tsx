/**
 * Attendance Calculator — Survival Calculator + Bunk Planner
 *
 * Interactive widgets placed below the AttendanceStatsCard:
 * 1. Survival Calculator: "If I miss X more classes, my attendance will be Y%"
 * 2. Bunk Planner: "To stay above X%, I can miss Y more classes"
 *
 * Reference: PRD Section 17.1 (Survival Calculator),
 * Section 17.2 (Bunk Planner)
 */
"use client";

import { useState, useMemo } from "react";
import { m, AnimatePresence } from "framer-motion";
import type { AttendanceStats } from "@/lib/utils/attendance";
import {
  calculateSurvival,
  calculateBunkAllowance,
} from "@/lib/utils/attendance";

interface AttendanceCalculatorProps {
  stats: AttendanceStats;
  classColor: string;
}

/**
 * AttendanceCalculator — interactive what-if scenarios for attendance.
 */
export default function AttendanceCalculator({
  stats,
  classColor,
}: AttendanceCalculatorProps) {
  const [activeTab, setActiveTab] = useState<"survival" | "bunk">("survival");

  /* BF-10: Don't show calculators when no classes have occurred yet */
  if (stats.totalOccurred === 0) return null;

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-surface-elevated/30 overflow-hidden"
    >
      {/* Tab header */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("survival")}
          className={`flex-1 text-xs font-medium py-2.5 px-3 transition-colors ${
            activeTab === "survival"
              ? "text-foreground border-b-2"
              : "text-muted hover:text-foreground"
          }`}
          style={activeTab === "survival" ? { borderColor: classColor } : undefined}
        >
          Survival Calculator
        </button>
        <button
          onClick={() => setActiveTab("bunk")}
          className={`flex-1 text-xs font-medium py-2.5 px-3 transition-colors ${
            activeTab === "bunk"
              ? "text-foreground border-b-2"
              : "text-muted hover:text-foreground"
          }`}
          style={activeTab === "bunk" ? { borderColor: classColor } : undefined}
        >
          Bunk Planner
        </button>
      </div>

      {/* Tab content */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {activeTab === "survival" ? (
            <SurvivalTab key="survival" stats={stats} classColor={classColor} />
          ) : (
            <BunkTab key="bunk" stats={stats} classColor={classColor} />
          )}
        </AnimatePresence>
      </div>
    </m.div>
  );
}

/**
 * SurvivalTab — "If I miss N more classes..." slider
 */
function SurvivalTab({
  stats,
  classColor,
}: {
  stats: AttendanceStats;
  classColor: string;
}) {
  const [classesToMiss, setClassesToMiss] = useState(1);

  /* Calculate resulting percentage */
  const resultPercentage = useMemo(
    () => calculateSurvival(stats, classesToMiss),
    [stats, classesToMiss]
  );

  /* Color of result */
  const getResultColor = () => {
    if (resultPercentage >= 75) return "text-accent-green";
    if (resultPercentage >= 60) return "text-accent-amber";
    return "text-accent-red";
  };

  return (
    <m.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
    >
      <p className="text-xs text-muted mb-3">
        If I miss <span className="font-bold text-foreground">{classesToMiss}</span> more
        class{classesToMiss !== 1 ? "es" : ""}...
      </p>

      {/* Slider */}
      <input
        type="range"
        min={0}
        max={20}
        value={classesToMiss}
        onChange={(e) => setClassesToMiss(parseInt(e.target.value, 10))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-surface-elevated mb-4"
        style={{
          accentColor: classColor,
        }}
      />

      {/* Result display */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">Attendance will be:</p>
        <m.p
          key={resultPercentage}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`text-lg font-bold ${getResultColor()}`}
        >
          {resultPercentage.toFixed(1)}%
        </m.p>
      </div>

      {/* Warning below 75% */}
      {resultPercentage < 75 && (
        <m.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-accent-red mt-2"
        >
          ⚠️ Below the 75% attendance threshold
        </m.p>
      )}
    </m.div>
  );
}

/**
 * BunkTab — "To stay above X%..." with target input
 */
function BunkTab({
  stats,
  classColor,
}: {
  stats: AttendanceStats;
  classColor: string;
}) {
  const [targetPercentage, setTargetPercentage] = useState(75);

  /* Calculate allowed misses */
  const allowedMisses = useMemo(
    () => calculateBunkAllowance(stats, targetPercentage),
    [stats, targetPercentage]
  );

  /* Color based on how many can be missed */
  const getMissColor = () => {
    if (allowedMisses >= 5) return "text-accent-green";
    if (allowedMisses >= 2) return "text-accent-amber";
    return "text-accent-red";
  };

  return (
    <m.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
    >
      <p className="text-xs text-muted mb-3">
        To stay above{" "}
        <span className="font-bold text-foreground">{targetPercentage}%</span>...
      </p>

      {/* Target percentage presets */}
      <div className="flex gap-2 mb-4">
        {[60, 65, 70, 75, 80, 85].map((pct) => (
          <button
            key={pct}
            onClick={() => setTargetPercentage(pct)}
            className={`text-[10px] px-2 py-1 rounded-md transition-colors ${
              targetPercentage === pct
                ? "text-white"
                : "bg-surface-elevated text-muted hover:text-foreground"
            }`}
            style={
              targetPercentage === pct
                ? { backgroundColor: classColor }
                : undefined
            }
          >
            {pct}%
          </button>
        ))}
      </div>

      {/* Result display */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">You can miss:</p>
        <m.div
          key={allowedMisses}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-baseline gap-1"
        >
          <span className={`text-lg font-bold ${getMissColor()}`}>
            {allowedMisses}
          </span>
          <span className="text-xs text-muted">
            class{allowedMisses !== 1 ? "es" : ""}
          </span>
        </m.div>
      </div>

      {allowedMisses === 0 && (
        <m.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-accent-red mt-2"
        >
          🚫 Cannot miss any more classes at this target
        </m.p>
      )}
    </m.div>
  );
}
