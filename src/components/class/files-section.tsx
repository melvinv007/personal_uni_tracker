/**
 * Files Section — Desktop-only file reference manager
 *
 * Uses File System Access API to store file handles (no upload).
 * Drag-to-reorder with dnd-kit. Search bar for filtering.
 * Only renders when File System Access API is available.
 *
 * Reference: PRD Section 11.16, Section 18 (File System Access)
 */
"use client";

import { useState, useEffect, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { showToast } from "@/components/ui/toast";
import { classKeys } from "@/lib/hooks/use-classes";
import { EmptyState } from "@/components/ui/empty-state";

interface FileRecord {
  id: string;
  displayName: string;
  sortOrder: number | null;
  handleValid: boolean | null;
}

interface FilesSectionProps {
  classId: string;
  files: FileRecord[];
  classColor: string;
}

/**
 * FilesSection — conditionally rendered file manager (desktop only).
 */
export default function FilesSection({
  classId,
  files: initialFiles,
  classColor,
}: FilesSectionProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [localFiles, setLocalFiles] = useState(initialFiles);

  /* Feature detection — PRD Section 18.1 */
  useEffect(() => {
    setIsSupported("showOpenFilePicker" in window);
  }, []);

  /* Sync with prop changes */
  useEffect(() => {
    setLocalFiles(initialFiles);
  }, [initialFiles]);

  /* Filter files by search */
  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return localFiles;
    const q = searchQuery.toLowerCase();
    return localFiles.filter((f) =>
      f.displayName.toLowerCase().includes(q)
    );
  }, [localFiles, searchQuery]);

  /* Don't render on unsupported browsers (mobile/Safari) */
  if (!isSupported) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-foreground">Files</h2>
        <AddFileButton classId={classId} />
      </div>

      {/* Search bar — PRD Section 18.4 */}
      {localFiles.length > 3 && (
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search files..."
          className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-1 mb-3"
          style={{ ["--tw-ring-color" as string]: classColor }}
        />
      )}

      {localFiles.length === 0 ? (
        <EmptyState message="No files linked yet. Add notes, textbooks, or PYQs." />
      ) : (
        <FileList
          files={filteredFiles}
          classId={classId}
          classColor={classColor}
          onReorder={(newFiles) => setLocalFiles(newFiles)}
          allFiles={localFiles}
        />
      )}
    </div>
  );
}

/**
 * AddFileButton — opens file picker and creates a new file reference.
 */
function AddFileButton({
  classId,
}: {
  classId: string;
}) {
  const queryClient = useQueryClient();

  const createFile = useMutation({
    mutationFn: async (displayName: string) => {
      const res = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId, displayName }),
      });
      if (!res.ok) throw new Error("Failed to create file");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.detail(classId) });
      showToast("File added", "success");
    },
    onError: () => {
      showToast("Failed to add file", "error");
    },
  });

  const handleAdd = async () => {
    try {
      /* Open the file picker — PRD Section 18.2 */
      const [handle] = await (window as unknown as { showOpenFilePicker: () => Promise<Array<{ name: string }>> }).showOpenFilePicker();
      const name = handle.name || "Untitled";
      createFile.mutate(name);
    } catch {
      /* User cancelled the file picker — no action needed */
    }
  };

  return (
    <button
      onClick={handleAdd}
      disabled={createFile.isPending}
      className="text-xs text-muted hover:text-foreground transition-colors"
    >
      + Add File
    </button>
  );
}

/**
 * FileList — sortable list with dnd-kit drag-to-reorder.
 */
function FileList({
  files,
  classId,
  classColor,
  onReorder,
  allFiles,
}: {
  files: FileRecord[];
  classId: string;
  classColor: string;
  onReorder: (files: FileRecord[]) => void;
  allFiles: FileRecord[];
}) {
  const queryClient = useQueryClient();
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  /* Mutation to save new sort order */
  const reorderFiles = useMutation({
    mutationFn: async (orderedFiles: { id: string; sortOrder: number }[]) => {
      const res = await fetch("/api/files", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: orderedFiles }),
      });
      if (!res.ok) throw new Error("Failed to reorder");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.detail(classId) });
    },
    onError: () => {
      showToast("Failed to reorder files", "error");
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = allFiles.findIndex((f) => f.id === active.id);
    const newIndex = allFiles.findIndex((f) => f.id === over.id);
    const newOrder = arrayMove(allFiles, oldIndex, newIndex);
    onReorder(newOrder);

    /* Save new order */
    reorderFiles.mutate(
      newOrder.map((f, i) => ({ id: f.id, sortOrder: i }))
    );

    /* Undo toast — PRD Section 18.4 */
    showToast("Files reordered. Undo?", "success");
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={files.map((f) => f.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-1">
          {files.map((file) => (
            <SortableFileItem
              key={file.id}
              file={file}
              classId={classId}
              classColor={classColor}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

/**
 * SortableFileItem — individual draggable file entry.
 */
function SortableFileItem({
  file,
  classId,
  classColor,
}: {
  file: FileRecord;
  classId: string;
  classColor: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: file.id });
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(file.displayName);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  /* Mutation to update file name */
  const updateFile = useMutation({
    mutationFn: async (displayName: string) => {
      const res = await fetch(`/api/files/${file.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.detail(classId) });
      showToast("File renamed", "success");
      setIsEditing(false);
    },
  });

  /* Mutation to delete file */
  const deleteFile = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/files/${file.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.detail(classId) });
      showToast("File removed", "success");
    },
  });

  const handleRename = () => {
    if (editName.trim() && editName !== file.displayName) {
      updateFile.mutate(editName.trim());
    } else {
      setIsEditing(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-2 p-2.5 rounded-lg bg-surface-elevated/50 hover:bg-surface-elevated transition-colors ${
        isDragging ? "opacity-50 shadow-lg" : ""
      } ${file.handleValid === false ? "border border-accent-amber/30" : ""}`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="text-muted hover:text-foreground cursor-grab active:cursor-grabbing p-0.5 shrink-0"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 2a2 2 0 10.001 4.001A2 2 0 007 2zm0 6a2 2 0 10.001 4.001A2 2 0 007 8zm0 6a2 2 0 10.001 4.001A2 2 0 007 14zm6-8a2 2 0 10-.001-4.001A2 2 0 0013 6zm0 2a2 2 0 10.001 4.001A2 2 0 0013 8zm0 6a2 2 0 10.001 4.001A2 2 0 0013 14z" />
        </svg>
      </button>

      {/* File icon */}
      <svg className="w-4 h-4 text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>

      {/* Name (editable or display) */}
      {isEditing ? (
        <input
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={handleRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleRename();
            if (e.key === "Escape") setIsEditing(false);
          }}
          autoFocus
          className="flex-1 text-sm bg-surface border border-border rounded px-2 py-0.5 text-foreground focus:outline-none focus:ring-1"
          style={{ ["--tw-ring-color" as string]: classColor }}
        />
      ) : (
        <span className="flex-1 text-sm text-foreground truncate">
          {file.displayName}
        </span>
      )}

      {/* Broken handle warning — PRD Section 18.5 */}
      {file.handleValid === false && (
        <span className="text-[9px] text-accent-amber px-1.5 py-0.5 rounded bg-accent-amber/20 shrink-0">
          Re-verify
        </span>
      )}

      {/* Actions (visible on hover) */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={() => setIsEditing(true)}
          className="text-muted hover:text-foreground transition-colors p-0.5"
          title="Rename"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
        <button
          onClick={() => {
            if (confirm("Remove this file reference?")) {
              deleteFile.mutate();
            }
          }}
          className="text-muted hover:text-accent-red transition-colors p-0.5"
          title="Remove"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
