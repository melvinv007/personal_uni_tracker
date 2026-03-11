/**
 * Glowing Card Component
 *
 * Component: GlowingCard
 * Purpose: Base card component used throughout the entire app.
 * Every card has a gradient fill, Aceternity-inspired glowing border,
 * spring-physics hover animation, and staggered entrance animation.
 *
 * Props:
 * - color: Hex color string for gradient and glow (from semester/class color)
 * - children: Card content
 * - onClick: Optional click handler
 * - className: Additional CSS classes
 * - index: Position in list (for staggered entrance delay)
 * - interactive: Whether hover/press animations are enabled
 * - href: Optional link destination (renders as anchor)
 *
 * Appears on: Every page — semester cards, class cards, stats cards, etc.
 *
 * Reference: https://21st.dev/aceternity/glowing-effect/default
 * PRD Section 3.4 (Card Design Rules), Section 5.2 (Card Animations)
 */
"use client";

import { type ReactNode, forwardRef } from "react";
import { m } from "framer-motion";

interface GlowingCardProps {
  /** Hex color for gradient and glow border (e.g. "#a855f7") */
  color?: string;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  /** Index in list for staggered entrance animation — delay = index × 60ms */
  index?: number;
  /** Enable hover/press animations (default: true) */
  interactive?: boolean;
}

/**
 * GlowingCard — Premium card component with gradient + glow + animations.
 *
 * Design rules (PRD Section 3.4):
 * - Subtle gradient fill (never flat/solid)
 * - Glowing border that inherits from semester/class color
 * - Spring-physics hover: Y-axis lift + glow intensifies
 * - Scale-down on press (0.97)
 * - Staggered entrance: fade-up with 60ms delay per card
 */
export const GlowingCard = forwardRef<HTMLDivElement, GlowingCardProps>(
  function GlowingCard(
    { color = "#a855f7", children, onClick, className = "", index = 0, interactive = true },
    ref
  ) {
    /* Parse hex color to RGB for CSS custom properties */
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);

    return (
      <m.div
        ref={ref}
        /* Staggered fade-up entrance — PRD Section 5.2 */
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: index * 0.06, // 60ms stagger
          duration: 0.4,
          ease: "easeOut",
        }}
        /* Spring hover: Y-lift + glow — PRD Section 5.2 */
        whileHover={
          interactive
            ? {
                y: -5,
                transition: { type: "spring", stiffness: 300, damping: 20 },
              }
            : undefined
        }
        /* Press: scale-down 0.97 — PRD Section 5.2 */
        whileTap={interactive ? { scale: 0.97 } : undefined}
        onClick={onClick}
        className={`
          relative group rounded-xl overflow-hidden
          cursor-${onClick ? "pointer" : "default"}
          ${className}
        `}
        style={
          {
            "--card-r": r,
            "--card-g": g,
            "--card-b": b,
          } as React.CSSProperties
        }
      >
        {/* Glowing border effect — Aceternity inspired */}
        <div
          className="absolute inset-0 rounded-xl opacity-40 group-hover:opacity-70 transition-opacity duration-300"
          style={{
            boxShadow: `0 0 15px 1px rgba(${r}, ${g}, ${b}, 0.3), inset 0 0 15px 1px rgba(${r}, ${g}, ${b}, 0.1)`,
          }}
        />

        {/* Gradient fill — subtle, never distracting */}
        <div
          className="absolute inset-0 rounded-xl"
          style={{
            background: `linear-gradient(135deg, rgba(${r}, ${g}, ${b}, 0.12) 0%, rgba(${r}, ${g}, ${b}, 0.04) 50%, rgba(${r}, ${g}, ${b}, 0.08) 100%)`,
          }}
        />

        {/* Border */}
        <div
          className="absolute inset-0 rounded-xl border opacity-30 group-hover:opacity-50 transition-opacity"
          style={{
            borderColor: `rgba(${r}, ${g}, ${b}, 0.4)`,
          }}
        />

        {/* Card content */}
        <div className="relative z-10 p-4 dotted-surface-elevated rounded-xl">
          {children}
        </div>
      </m.div>
    );
  }
);
