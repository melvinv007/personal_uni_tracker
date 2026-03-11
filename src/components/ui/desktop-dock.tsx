/**
 * Desktop Dock Navigation
 *
 * Component: DesktopDock
 * Purpose: Minimal dock for quick navigation on desktop.
 * Hidden on mobile (page-based navigation instead).
 *
 * Appears on: All pages (desktop only, lg+ breakpoint)
 *
 * Reference: https://21st.dev/jatin-yadav05/minimal-dock/default
 * PRD Section 4 (Navigation), Section 8.2 (Desktop dock)
 */
"use client";

import { usePathname, useRouter } from "next/navigation";
import { m } from "framer-motion";
import { useUIStore } from "@/lib/stores/ui-store";

/** Dock navigation items — PRD §8.2 (desktop navigation via minimal dock) */
const DOCK_ITEMS = [
  {
    label: "Home",
    path: "/",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: "Settings",
    path: "/settings",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

/**
 * DesktopDock — Fixed minimal dock for desktop navigation.
 * Never opens new browser tabs — PRD Section 4.
 */
export function DesktopDock() {
  const pathname = usePathname();
  const router = useRouter();
  const setNavigationDirection = useUIStore(
    (state) => state.setNavigationDirection
  );
  const setLastVisitedPage = useUIStore((state) => state.setLastVisitedPage);

  const handleNavigate = (path: string) => {
    setNavigationDirection("forward");
    setLastVisitedPage(path);
    router.push(path);
  };

  return (
    <div className="hidden lg:flex fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 25 }}
        className="
          flex items-center gap-1 px-3 py-2
          rounded-2xl border border-border/50
          bg-surface/80 backdrop-blur-xl
          shadow-xl shadow-black/30
        "
      >
        {DOCK_ITEMS.map((item) => {
          const isActive = pathname === item.path;
          return (
            <m.button
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              className={`
                relative p-3 rounded-xl transition-colors duration-200
                ${isActive ? "text-accent-purple" : "text-muted hover:text-foreground"}
              `}
              aria-label={item.label}
            >
              {item.icon}
              {/* Active indicator dot */}
              {isActive && (
                <m.div
                  layoutId="dock-indicator"
                  className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent-purple"
                />
              )}
            </m.button>
          );
        })}
      </m.div>
    </div>
  );
}
