/**
 * Tailwind CSS Configuration for Tracker
 * Dark-only theme with custom semantic colors and Geist font.
 * Reference: PRD Section 3 (Design System)
 */
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      colors: {
        /* Core dark background palette */
        background: "#0a0a0a",
        foreground: "#ededed",
        surface: "#111111",
        "surface-hover": "#1a1a1a",
        border: "#262626",
        "border-hover": "#404040",
        muted: "#737373",

        /* Semantic colors — PRD Section 3.2 */
        accent: {
          purple: "#a855f7",
          blue: "#3b82f6",
          orange: "#f97316",
          red: "#ef4444",
          green: "#22c55e",
          amber: "#f59e0b",
        },
      },
      animation: {
        "fade-up": "fadeUp 0.5s ease-out",
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
        "slide-in-bottom": "slideInBottom 0.3s ease-out",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
        "count-up": "countUp 1s ease-out",
        "progress-shrink": "progressShrink 5s linear",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideInBottom: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        glowPulse: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
        },
        progressShrink: {
          "0%": { width: "100%" },
          "100%": { width: "0%" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
