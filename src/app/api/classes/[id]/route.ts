/**
 * Class Detail API — GET one, PATCH update, DELETE
 *
 * GET /api/classes/[id] — Returns a single class with all relations.
 * PATCH /api/classes/[id] — Updates class fields.
 * DELETE /api/classes/[id] — Deletes class (CASCADE to slots, occurrences, attendance, etc.).
 *
 * Reference: PRD Section 11 (Class Detail Page)
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { classes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { updateClassSchema } from "@/lib/validations/schemas";
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
 * GET /api/classes/[id]
 * Returns a single class with all nested data for the class detail page.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  const { id } = await params;

  const classData = await db.query.classes.findFirst({
    where: and(eq(classes.id, id), eq(classes.userId, user.id)),
    with: {
      semester: true,
      scheduleSlots: true,
      occurrences: {
        with: {
          attendance: true,
        },
      },
      attendance: true,
      tasks: true,
      exams: true,
      syllabusRubric: true,
      letterGrade: true,
      files: true,
    },
  });

  if (!classData) {
    return apiError("Class not found", 404);
  }

  return apiSuccess(classData);
}

/**
 * PATCH /api/classes/[id]
 * Updates class fields with validated input.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  const { id } = await params;
  const body = await request.json();
  const parsed = updateClassSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(parsed.error.issues[0].message, 422);
  }

  const updates = parsed.data;

  /* Sanitize string fields */
  const sanitized: Record<string, unknown> = { ...updates, updatedAt: new Date() };
  if (updates.name) sanitized.name = sanitizeString(updates.name);
  if (updates.notes !== undefined && updates.notes !== null) {
    sanitized.notes = sanitizeString(updates.notes);
  }

  const [updated] = await db
    .update(classes)
    .set(sanitized)
    .where(and(eq(classes.id, id), eq(classes.userId, user.id)))
    .returning();

  if (!updated) {
    return apiError("Class not found", 404);
  }

  return apiSuccess(updated);
}

/**
 * DELETE /api/classes/[id]
 * Deletes a class and all related data (CASCADE).
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  const { id } = await params;

  const [deleted] = await db
    .delete(classes)
    .where(and(eq(classes.id, id), eq(classes.userId, user.id)))
    .returning();

  if (!deleted) {
    return apiError("Class not found", 404);
  }

  return apiSuccess({ success: true });
}
