/**
 * Virtual List — Efficient rendering for large scrollable lists
 *
 * Component: VirtualList
 * Purpose: Wraps @tanstack/react-virtual for paginated/virtual scrolling
 * on lists that can grow large (attendance history, tasks, files).
 *
 * Props:
 * - items: Array of items to render
 * - renderItem: Render function for each item
 * - estimateSize: Estimated row height in pixels (default: 56)
 * - className: Additional container classes
 * - overscan: Number of extra rows to render outside viewport (default: 5)
 *
 * Appears on: Attendance history, file lists, task lists when large
 *
 * Reference: PRD Section 22.1 (Pagination / virtual scrolling via react-virtual)
 */
"use client";

import { useRef, type ReactNode } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

interface VirtualListProps<T> {
  /** Array of items to virtualize */
  items: T[];
  /** Render function — receives item and index, returns a React node */
  renderItem: (item: T, index: number) => ReactNode;
  /** Estimated height of each item in pixels (default: 56) */
  estimateSize?: number;
  /** Additional CSS classes on the scroll container */
  className?: string;
  /** Number of items to render beyond the visible area (default: 5) */
  overscan?: number;
}

/**
 * VirtualList — Only renders items currently visible in the viewport.
 * Uses @tanstack/react-virtual for efficient DOM management.
 */
export function VirtualList<T>({
  items,
  renderItem,
  estimateSize = 56,
  className = "",
  overscan = 5,
}: VirtualListProps<T>) {
  /* Scroll container ref — required by the virtualizer */
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  return (
    <div
      ref={parentRef}
      className={`overflow-auto ${className}`}
    >
      {/* Total size container — maintains correct scroll height */}
      <div
        className="relative w-full"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            className="absolute top-0 left-0 w-full"
            style={{
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {renderItem(items[virtualRow.index], virtualRow.index)}
          </div>
        ))}
      </div>
    </div>
  );
}
