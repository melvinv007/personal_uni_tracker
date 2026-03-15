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
import { classes, classScheduleSlots, classOccurrences } from "@/lib/db/schema";
import { eq, and, gte, isNull } from "drizzle-orm";
import { updateClassSchema } from "@/lib/validations/schemas";
import {
  getAuthUser,
  apiError,
  apiSuccess,
  sanitizeString,
} from "@/lib/api/helpers";
import { generateOccurrences } from "@/lib/utils/occurrences";

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
    where: and(
      eq(classes.id, id),
      eq(classes.userId, user.id),
      isNull(classes.deletedAt)
    ),
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

  const { scheduleSlots, ...updates } = parsed.data;

  /* Sanitize string fields */
  const sanitized: Record<string, unknown> = { ...updates, updatedAt: new Date() };
  if (updates.name) sanitized.name = sanitizeString(updates.name);
  if (updates.notes !== undefined && updates.notes !== null) {
    sanitized.notes = sanitizeString(updates.notes);
  }

  const [updated] = await db
    .update(classes)
    .set(sanitized)
    .where(
      and(
        eq(classes.id, id),
        eq(classes.userId, user.id),
        isNull(classes.deletedAt)
      )
    )
    .returning();

  if (!updated) {
    return apiError("Class not found", 404);
  }

  /* Handle schedule slots update if specified */
  if (scheduleSlots !== undefined) {
    const today = new Date().toISOString().split("T")[0];

    /* Delete future occurrences */
    await db
      .delete(classOccurrences)
      .where(
        and(
          eq(classOccurrences.classId, id),
          eq(classOccurrences.userId, user.id),
          gte(classOccurrences.occurrenceDate, today)
        )
      );

    /* Delete old schedule slots */
    await db
      .delete(classScheduleSlots)
      .where(
        and(
          eq(classScheduleSlots.classId, id),
          eq(classScheduleSlots.userId, user.id)
        )
      );

    /* Create new schedule slots if any */
    if (scheduleSlots.length > 0) {
      const createdSlots = await db
        .insert(classScheduleSlots)
        .values(
          scheduleSlots.map((slot) => ({
            classId: id,
            userId: user.id,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            location: slot.location ? sanitizeString(slot.location) : null,
            validFrom: updated.startDate,
          }))
        )
        .returning();

      /* Generate occurrences ONLY for today onwards so we don't duplicate past ones */
      const generateFrom = updated.startDate > today ? updated.startDate : today;
      const occurrences = generateOccurrences(
        createdSlots,
        id,
        user.id,
        generateFrom,
        updated.endDate
      );

      if (occurrences.length > 0) {
        await db.insert(classOccurrences).values(occurrences);
      }
    }
  }

  return apiSuccess(updated);
}

/**
 * DELETE /api/classes/[id]
 * Deletes a class and all related data (CASCADE).
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  const { id } = await params;
  const hard = request.nextUrl.searchParams.get("hard") === "true";
  const undo = request.nextUrl.searchParams.get("undo") === "true";

  if (hard) {
    const [deleted] = await db
      .delete(classes)
      .where(and(eq(classes.id, id), eq(classes.userId, user.id)))
      .returning();

    if (!deleted) {
      return apiError("Class not found", 404);
    }
  } else if (undo) {
    const [restored] = await db
      .update(classes)
      .set({ deletedAt: null })
      .where(and(eq(classes.id, id), eq(classes.userId, user.id)))
      .returning();

    if (!restored) {
      return apiError("Class not found", 404);
    }
  } else {
    // Soft delete
    const [deleted] = await db
      .update(classes)
      .set({ deletedAt: new Date() })
      .where(and(eq(classes.id, id), eq(classes.userId, user.id)))
      .returning();

    if (!deleted) {
      return apiError("Class not found", 404);
    }
  }

  return apiSuccess({ success: true });
}
