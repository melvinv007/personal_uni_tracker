/**
 * Date/Time Hero — Real-time clock display
 *
 * Shows the current date (full format) and a real-time clock.
 * Updates every second. Also shows a greeting based on time of day.
 *
 * Reference: PRD Section 9.3 (Date/Time Hero)
 */
"use client";

import { useState, useEffect } from "react";
import { m } from "framer-motion";
import { format } from "date-fns";

/**
 * Returns a time-of-day greeting.
 */
function getGreeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function DateTimeHero() {
  const [now, setNow] = useState(new Date());

  /* Update clock every second */
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const greeting = getGreeting(now.getHours());
  const dateStr = format(now, "EEEE, MMMM d, yyyy");
  const timeStr = format(now, "h:mm:ss a");

  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
      className="
        rounded-xl border border-border
        dotted-surface-elevated p-5
        flex flex-col justify-between
        min-h-[120px]
      "
    >
      <p className="text-sm text-muted">{greeting}</p>
      <div>
        <p className="text-2xl font-bold text-foreground tabular-nums">
          {timeStr}
        </p>
        <p className="text-xs text-muted mt-1">{dateStr}</p>
      </div>
    </m.div>
  );
}
