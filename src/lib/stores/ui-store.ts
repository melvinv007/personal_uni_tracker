/**
 * Zustand UI Store
 *
 * Purpose: Manages client-side UI state that doesn't belong in server state.
 * Uses Immer middleware for clean nested state updates.
 *
 * State includes:
 * - Scroll positions per page (restored on navigation)
 * - Last visited page (persisted to localStorage)
 * - Active FAB state
 * - Calendar view state (selected week, day)
 *
 * Reference: PRD Section 2 (Zustand + Immer), Section 8.2 (Scroll Position Memory),
 * Section 21.6 (Scroll Position Memory)
 */
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";

/** Scroll position record — maps page path to scroll Y offset */
interface ScrollPositions {
  [path: string]: number;
}

/** UI store state shape */
interface UIState {
  /* Scroll position memory — PRD Section 21.6 */
  scrollPositions: ScrollPositions;

  /* Last visited page — PRD Section 8.2 (only localStorage usage in the app) */
  lastVisitedPage: string;

  /* FAB (Floating Action Button) expansion state */
  isFabOpen: boolean;

  /* Online/offline status — PRD Section 21.8 */
  isOnline: boolean;

  /* Navigation direction for page transition animation */
  navigationDirection: "forward" | "back";
}

/** UI store actions */
interface UIActions {
  /** Save scroll position for a page path */
  setScrollPosition: (path: string, position: number) => void;

  /** Get stored scroll position for a page path */
  getScrollPosition: (path: string) => number;

  /** Update last visited page */
  setLastVisitedPage: (path: string) => void;

  /** Toggle FAB open/closed */
  toggleFab: () => void;

  /** Close FAB */
  closeFab: () => void;

  /** Update online status */
  setOnline: (online: boolean) => void;

  /** Set navigation direction for page transitions */
  setNavigationDirection: (direction: "forward" | "back") => void;
}

/**
 * Global UI store — persisted to localStorage (only localStorage usage per PRD).
 * Uses Immer middleware for immutable nested state updates.
 */
export const useUIStore = create<UIState & UIActions>()(
  persist(
    immer((set, get) => ({
      /* Initial state */
      scrollPositions: {},
      lastVisitedPage: "/",
      isFabOpen: false,
      isOnline: true,
      navigationDirection: "forward" as const,

      /* Actions */
      setScrollPosition: (path, position) =>
        set((state) => {
          state.scrollPositions[path] = position;
        }),

      getScrollPosition: (path) => get().scrollPositions[path] ?? 0,

      setLastVisitedPage: (path) =>
        set((state) => {
          state.lastVisitedPage = path;
        }),

      toggleFab: () =>
        set((state) => {
          state.isFabOpen = !state.isFabOpen;
        }),

      closeFab: () =>
        set((state) => {
          state.isFabOpen = false;
        }),

      setOnline: (online) =>
        set((state) => {
          state.isOnline = online;
        }),

      setNavigationDirection: (direction) =>
        set((state) => {
          state.navigationDirection = direction;
        }),
    })),
    {
      name: "tracker-ui-state",
      /* Only persist lastVisitedPage and scrollPositions — PRD Section 8.2 */
      partialize: (state) => ({
        lastVisitedPage: state.lastVisitedPage,
        scrollPositions: state.scrollPositions,
      }),
    }
  )
);
