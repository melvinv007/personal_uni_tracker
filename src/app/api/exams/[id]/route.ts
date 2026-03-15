/**
 * Exam Detail API — PATCH update, DELETE
 *
 * PATCH /api/exams/[id] — Updates exam fields (marks, date, etc.).
 * DELETE /api/exams/[id] — Deletes an exam.
 *
 * Reference: PRD Section 15 (Exams & Grades)
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { exams } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { updateExamSchema } from "@/lib/validations/schemas";
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
 * PATCH /api/exams/[id]
 * Updates exam fields with validated input.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  const { id } = await params;
  const body = await request.json();
  const parsed = updateExamSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(parsed.error.issues[0].message, 422);
  }

  const updates = parsed.data;
  const sanitized: Record<string, unknown> = { ...updates, updatedAt: new Date() };

  if (updates.name) sanitized.name = sanitizeString(updates.name);
  if (updates.marksScored !== undefined) {
    sanitized.marksScored = updates.marksScored != null ? String(updates.marksScored) : null;
  }
  if (updates.totalMarks !== undefined) {
    sanitized.totalMarks = String(updates.totalMarks);
  }
  if (updates.weightage !== undefined) {
    sanitized.weightage = String(updates.weightage);
  }

  const [updated] = await db
    .update(exams)
    .set(sanitized)
    .where(
      and(
        eq(exams.id, id),
        eq(exams.userId, user.id),
        isNull(exams.deletedAt)
      )
    )
    .returning();

  if (!updated) return apiError("Exam not found", 404);

  return apiSuccess(updated);
}

/**
 * DELETE /api/exams/[id]
 * Deletes an exam.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  const { id } = await params;
  const hard = request.nextUrl.searchParams.get("hard") === "true";
  const undo = request.nextUrl.searchParams.get("undo") === "true";

  if (hard) {
    const [deleted] = await db
      .delete(exams)
      .where(and(eq(exams.id, id), eq(exams.userId, user.id)))
      .returning();

    if (!deleted) return apiError("Exam not found", 404);
  } else if (undo) {
    const [restored] = await db
      .update(exams)
      .set({ deletedAt: null })
      .where(and(eq(exams.id, id), eq(exams.userId, user.id)))
      .returning();

    if (!restored) return apiError("Exam not found", 404);
  } else {
    // Soft delete
    const [deleted] = await db
      .update(exams)
      .set({ deletedAt: new Date() })
      .where(and(eq(exams.id, id), eq(exams.userId, user.id)))
      .returning();

    if (!deleted) return apiError("Exam not found", 404);
  }

  return apiSuccess({ success: true });
}
