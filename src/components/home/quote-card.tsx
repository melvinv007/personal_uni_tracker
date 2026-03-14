/**
 * Quote Card — Motivational quote
 *
 * Displays a random quote on each render/page load.
 * Fade-up entrance animation.
 *
 * Reference: PRD Section 9.2 (Motivational Quote Card)
 */
"use client";

import { m } from "framer-motion";
import { QUOTES } from "@/lib/data/quotes";

export default function QuoteCard() {
  const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];

  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="
        rounded-xl border border-border 
        dotted-surface-elevated p-5
        flex flex-col justify-between
        min-h-[120px]
      "
    >
      <p className="text-sm text-foreground/90 italic leading-relaxed">
        &ldquo;{quote.text}&rdquo;
      </p>
      <p className="text-xs text-muted mt-3">— {quote.author}</p>
    </m.div>
  );
}
