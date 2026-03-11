/**
 * Global Hooks Component
 *
 * Purpose: Runs all global hooks that need to be active on every page.
 * Mount once in Providers to enable:
 * - Online/offline detection
 * - Last visited page tracking
 * - Scroll position restoration
 *
 * This is a renderless component (returns null).
 */
"use client";

import { useOnlineStatus } from "@/lib/hooks/use-online-status";
import { useLastVisitedPage } from "@/lib/hooks/use-last-visited";
import { useScrollRestore } from "@/lib/hooks/use-scroll-restore";

export function GlobalHooks() {
  useOnlineStatus();
  useLastVisitedPage();
  useScrollRestore();
  return null;
}
