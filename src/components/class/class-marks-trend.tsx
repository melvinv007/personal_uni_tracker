/**
 * Class Marks Trend — Line chart of exam scores for a single class
 *
 * Reuses the Tremor LineChart approach from semester marks-trend-graphs.
 * Shows all scored exams chronologically with an animated draw-in.
 *
 * Reference: PRD Section 11.12 (Marks Trend)
 */
"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { format, parseISO } from "date-fns";

/** Lazy-load Tremor LineChart to reduce initial bundle — PRD §22 (Performance) */
const LineChart = dynamic(
  () => import("@tremor/react").then((mod) => mod.LineChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-48 animate-pulse rounded-lg bg-surface-elevated" />
    ),
  }
);

interface Exam {
  id: string;
  name: string;
  examDate: string;
  marksScored: string | null;
  totalMarks: string;
  weightage: string;
}

interface ClassMarksTrendProps {
  exams: Exam[];
  classColor: string;
}

/**
 * ClassMarksTrend — Tremor LineChart showing exam score percentages over time.
 */
export default function ClassMarksTrend({
  exams,
  classColor,
}: ClassMarksTrendProps) {
  /* Build chart data from scored exams, sorted chronologically */
  const chartData = useMemo(() => {
    return exams
      .filter((e) => e.marksScored != null)
      .sort((a, b) => a.examDate.localeCompare(b.examDate))
      .map((e) => ({
        date: format(parseISO(e.examDate), "MMM d"),
        name: e.name,
        Score: Math.round(
          (parseFloat(e.marksScored!) / parseFloat(e.totalMarks)) * 100
        ),
      }));
  }, [exams]);

  /* Don't render if fewer than 2 scored exams */
  if (chartData.length < 2) return null;

  return (
    <div>
      <h3 className="text-sm font-medium text-muted mb-3">Marks Trend</h3>
      <div className="rounded-xl border border-border bg-surface-elevated/30 p-4">
        <LineChart
          data={chartData}
          index="date"
          categories={["Score"]}
          colors={[classColor]}
          valueFormatter={(v: number) => `${v}%`}
          showXAxis
          showYAxis
          yAxisWidth={40}
          minValue={0}
          maxValue={100}
          showAnimation
          animationDuration={800}
          curveType="monotone"
          connectNulls
          customTooltip={({ payload, active }) => {
            if (!active || !payload?.length) return null;
            const data = payload[0].payload;
            return (
              <div className="rounded-lg border border-border bg-surface p-2 shadow-lg">
                <p className="text-xs font-semibold text-foreground">{data.name}</p>
                <p className="text-xs text-muted">{data.date}</p>
                <p className="text-sm font-bold mt-1" style={{ color: classColor }}>
                  {data.Score}%
                </p>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}
