/**
 * Back Button Component
 *
 * Component: BackButton
 * Purpose: Navigation back button used on semester and class pages.
 * Uses router.back() with navigation direction tracking for page transitions.
 *
 * Props:
 * - label: Optional visible text next to the arrow
 *
 * Appears on: Semester page, Class page
 *
 * Reference: https://21st.dev/shsfwork/back-button/default
 * PRD Section 4 (Navigation), Section 8.2 (Back button)
 */
"use client";

import { useRouter } from "next/navigation";
import { m } from "framer-motion";
import { useUIStore } from "@/lib/stores/ui-store";

interface BackButtonProps {
  /** Optional label text shown next to the back arrow */
  label?: string;
}

/**
 * BackButton — Animated back navigation button.
 * Sets navigation direction to "back" for iOS-style slide-out transition.
 */
export function BackButton({ label }: BackButtonProps) {
  const router = useRouter();
  const setNavigationDirection = useUIStore(
    (state) => state.setNavigationDirection
  );

  /** Navigate back with proper animation direction */
  const handleBack = () => {
    setNavigationDirection("back");
    router.back();
  };

  return (
    <m.button
      onClick={handleBack}
      /* Press feedback — PRD Section 5.5 (all buttons: scale 0.97) */
      whileTap={{ scale: 0.97 }}
      className="
        flex items-center gap-2 px-3 py-2 rounded-lg
        text-muted hover:text-foreground
        hover:bg-surface-hover
        transition-colors duration-200
      "
      aria-label="Go back"
    >
      {/* Arrow icon */}
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 19l-7-7 7-7"
        />
      </svg>
      {label && <span className="text-sm font-medium">{label}</span>}
    </m.button>
  );
}
