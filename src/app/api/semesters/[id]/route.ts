/**
 * Semester Detail API — GET one, PATCH update, DELETE
 *
 * GET /api/semesters/[id] — Returns a single semester with relations.
 * PATCH /api/semesters/[id] — Updates semester fields.
 * DELETE /api/semesters/[id] — Deletes semester (CASCADE to classes, tasks, etc.).
 *
 * Reference: PRD Section 10 (Semester Page), Section 25.4 (Cascade Deletes)
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { semesters } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { updateSemesterSchema } from "@/lib/validations/schemas";
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
 * GET /api/semesters/[id]
 * Returns a single semester with its classes, tasks, and grades.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  const { id } = await params;

  const semester = await db.query.semesters.findFirst({
    where: and(eq(semesters.id, id), eq(semesters.userId, user.id)),
    with: {
      classes: {
        with: {
          scheduleSlots: true,
          exams: true,
          letterGrade: true,
        },
      },
      tasks: true,
      nonAcademicEvents: true,
      letterGrades: true,
      officialGrades: true,
    },
  });

  if (!semester) {
    return apiError("Semester not found", 404);
  }

  return apiSuccess(semester);
}

/**
 * PATCH /api/semesters/[id]
 * Updates semester fields. If setting isActive=true, deactivates all others.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  const { id } = await params;
  const body = await request.json();
  const parsed = updateSemesterSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(parsed.error.issues[0].message, 422);
  }

  const updates = parsed.data;

  /* If setting this semester as active, deactivate all others first — PRD Section 7.3 */
  if (updates.isActive) {
    await db
      .update(semesters)
      .set({ isActive: false })
      .where(eq(semesters.userId, user.id));
  }

  /* Sanitize string fields */
  const sanitized: Record<string, unknown> = { ...updates, updatedAt: new Date() };
  if (updates.name) sanitized.name = sanitizeString(updates.name);
  if (updates.notes !== undefined && updates.notes !== null) {
    sanitized.notes = sanitizeString(updates.notes);
  }

  const [updated] = await db
    .update(semesters)
    .set(sanitized)
    .where(and(eq(semesters.id, id), eq(semesters.userId, user.id)))
    .returning();

  if (!updated) {
    return apiError("Semester not found", 404);
  }

  return apiSuccess(updated);
}

/**
 * DELETE /api/semesters/[id]
 * Deletes a semester and all related data (CASCADE).
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  const { id } = await params;

  const [deleted] = await db
    .delete(semesters)
    .where(and(eq(semesters.id, id), eq(semesters.userId, user.id)))
    .returning();

  if (!deleted) {
    return apiError("Semester not found", 404);
  }

  return apiSuccess({ success: true });
}
