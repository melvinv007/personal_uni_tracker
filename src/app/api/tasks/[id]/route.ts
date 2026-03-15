/**
 * Task Detail API — PATCH update, DELETE
 *
 * PATCH /api/tasks/[id] — Updates task fields (completion, marks, etc.).
 * DELETE /api/tasks/[id] — Deletes a task.
 *
 * Reference: PRD Section 14 (Tasks & Assignments)
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { updateTaskSchema } from "@/lib/validations/schemas";
import {
  getAuthUser,
  apiError,
  apiSuccess,
  sanitizeString,
} from "@/lib/api/helpers";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/tasks/[id]
 * Updates task fields. Handles completion with completedAt timestamp.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  const { id } = await params;
  const body = await request.json();
  const parsed = updateTaskSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(parsed.error.issues[0].message, 422);
  }

  const updates = parsed.data;
  const sanitized: Record<string, unknown> = { ...updates, updatedAt: new Date() };

  /* Sanitize name if provided */
  if (updates.name) sanitized.name = sanitizeString(updates.name);

  /* Handle marks as string for decimal precision */
  if (updates.marksScored !== undefined) {
    sanitized.marksScored = updates.marksScored != null ? String(updates.marksScored) : null;
  }
  if (updates.totalMarks !== undefined) {
    sanitized.totalMarks = updates.totalMarks != null ? String(updates.totalMarks) : null;
  }

  /* Set completedAt when marking as completed — PRD Section 14.2 */
  if (updates.isCompleted === true) {
    sanitized.completedAt = new Date();
  } else if (updates.isCompleted === false) {
    sanitized.completedAt = null;
  }

  const [updated] = await db
    .update(tasks)
    .set(sanitized)
    .where(
      and(
        eq(tasks.id, id),
        eq(tasks.userId, user.id),
        isNull(tasks.deletedAt)
      )
    )
    .returning();

  if (!updated) return apiError("Task not found", 404);

  return apiSuccess(updated);
}

/**
 * DELETE /api/tasks/[id]
 * Deletes a task.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  const { id } = await params;
  const hard = request.nextUrl.searchParams.get("hard") === "true";
  const undo = request.nextUrl.searchParams.get("undo") === "true";

  if (hard) {
    const [deleted] = await db
      .delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, user.id)))
      .returning();

    if (!deleted) return apiError("Task not found", 404);
  } else if (undo) {
    const [restored] = await db
      .update(tasks)
      .set({ deletedAt: null })
      .where(and(eq(tasks.id, id), eq(tasks.userId, user.id)))
      .returning();

    if (!restored) return apiError("Task not found", 404);
  } else {
    // Soft delete
    const [deleted] = await db
      .update(tasks)
      .set({ deletedAt: new Date() })
      .where(and(eq(tasks.id, id), eq(tasks.userId, user.id)))
      .returning();

    if (!deleted) return apiError("Task not found", 404);
  }

  return apiSuccess({ success: true });
}
