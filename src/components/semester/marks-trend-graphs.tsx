/**
 * Marks Trend Graphs — Tremor line charts per class
 *
 * Purpose: Displays a line chart per class showing exam marks over time.
 * X-axis: Exam dates (chronological), Y-axis: Marks percentage (0-100%).
 * Line color matches the class color.
 *
 * Reference: PRD Section 10.6 (Marks Trend Graphs)
 */
"use client";

import { useMemo, useRef } from "react";
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
import { m, useInView } from "framer-motion";
import { GlowingCard } from "@/components/ui/glowing-card";

interface ExamData {
  id: string;
  name: string;
  examDate: string;
  marksScored: string | null;
  totalMarks: string;
  weightage: string;
}

interface ClassWithExams {
  id: string;
  name: string;
  color: string;
  exams: ExamData[];
}

interface MarksTrendGraphsProps {
  classes: ClassWithExams[];
}

/**
 * MarksTrendGraphs — renders one Tremor LineChart per class.
 * Animates in when the section scrolls into view.
 */
export default function MarksTrendGraphs({ classes }: MarksTrendGraphsProps) {
  /* Filter to classes that have at least one scored exam */
  const classesWithScores = useMemo(
    () =>
      classes.filter((cls) =>
        cls.exams.some((e) => e.marksScored !== null)
      ),
    [classes]
  );

  if (classesWithScores.length === 0) return null;

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-4">
        Marks Trend
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {classesWithScores.map((cls) => (
          <ClassMarksTrend key={cls.id} cls={cls} />
        ))}
      </div>
    </div>
  );
}

/**
 * Single class marks trend line chart.
 * Uses Tremor's LineChart with custom tooltip formatting.
 */
function ClassMarksTrend({ cls }: { cls: ClassWithExams }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  /* Build chart data — sorted chronologically, scored exams only */
  const chartData = useMemo(() => {
    return cls.exams
      .filter((e) => e.marksScored !== null)
      .sort(
        (a, b) =>
          new Date(a.examDate).getTime() - new Date(b.examDate).getTime()
      )
      .map((exam) => {
        const scored = parseFloat(exam.marksScored!);
        const total = parseFloat(exam.totalMarks);
        const percentage = total > 0 ? (scored / total) * 100 : 0;

        return {
          /* Date label for X-axis */
          date: format(parseISO(exam.examDate), "MMM d"),
          /* Percentage value for the line */
          [cls.name]: Math.round(percentage * 10) / 10,
          /* Extra fields for tooltip */
          _examName: exam.name,
          _scored: scored,
          _total: total,
        };
      });
  }, [cls.exams, cls.name]);

  if (chartData.length === 0) return null;

  return (
    <m.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <GlowingCard color={cls.color} className="p-4">
        {/* Chart title with class color dot */}
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: cls.color }}
          />
          <h3 className="text-sm font-semibold text-foreground">
            {cls.name}
          </h3>
        </div>

        {/* Tremor LineChart */}
        <LineChart
          data={chartData}
          index="date"
          categories={[cls.name]}
          colors={[cls.color]}
          valueFormatter={(v) => `${v}%`}
          showLegend={false}
          showYAxis={true}
          showXAxis={true}
          yAxisWidth={45}
          minValue={0}
          maxValue={100}
          showAnimation={isInView}
          animationDuration={800}
          className="h-48"
          customTooltip={({ payload, active }) => {
            if (!active || !payload?.length) return null;
            const entry = payload[0]?.payload;
            if (!entry) return null;

            return (
              <div className="bg-surface-elevated border border-border rounded-lg p-2.5 shadow-lg text-xs">
                <p className="font-semibold text-foreground mb-1">
                  {entry._examName}
                </p>
                <p className="text-muted">{entry.date}</p>
                <p className="text-foreground mt-1">
                  {entry._scored} / {entry._total} ({entry[cls.name]}%)
                </p>
              </div>
            );
          }}
        />
      </GlowingCard>
    </m.div>
  );
}
