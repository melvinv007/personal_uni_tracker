/**
 * Attendance API — GET for class, POST mark, POST bulk
 *
 * GET /api/attendance?classId=xxx — Returns attendance records for a class.
 * POST /api/attendance — Mark attendance for a single occurrence (upsert).
 * POST /api/attendance/bulk — Bulk mark attendance for multiple occurrences.
 *
 * All attendance changes are logged in attendance_edit_history.
 *
 * Reference: PRD Section 13 (Attendance System)
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { attendance, attendanceEditHistory, classOccurrences } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  markAttendanceSchema,
  bulkAttendanceSchema,
} from "@/lib/validations/schemas";
import { getAuthUser, apiError, apiSuccess } from "@/lib/api/helpers";

/**
 * GET /api/attendance?classId=xxx
 * Returns all attendance records for a class, with edit history.
 */
export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  const classId = request.nextUrl.searchParams.get("classId");
  if (!classId) return apiError("classId is required", 422);

  const data = await db.query.attendance.findMany({
    where: and(eq(attendance.classId, classId), eq(attendance.userId, user.id)),
    with: {
      occurrence: true,
      editHistory: true,
    },
  });

  return apiSuccess(data);
}

/**
 * POST /api/attendance
 * Marks attendance for a single occurrence using upsert.
 * If attendance already exists, updates it and logs the change.
 *
 * Reference: PRD Section 13.1 (Attendance Marking)
 */
export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  const body = await request.json();

  /* Check if this is a bulk operation */
  if (body.occurrenceIds) {
    return handleBulkAttendance(user.id, body);
  }

  const parsed = markAttendanceSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0].message, 422);
  }

  const { occurrenceId, classId, status } = parsed.data;

  /* Verify occurrence exists and belongs to user */
  const occurrence = await db.query.classOccurrences.findFirst({
    where: and(
      eq(classOccurrences.id, occurrenceId),
      eq(classOccurrences.userId, user.id)
    ),
  });
  if (!occurrence) return apiError("Occurrence not found", 404);

  /* Check for existing attendance record */
  const existing = await db.query.attendance.findFirst({
    where: and(
      eq(attendance.occurrenceId, occurrenceId),
      eq(attendance.userId, user.id)
    ),
  });

  if (existing) {
    /* Update existing record — log the change */
    await db.insert(attendanceEditHistory).values({
      attendanceId: existing.id,
      userId: user.id,
      previousStatus: existing.status,
      newStatus: status,
    });

    const [updated] = await db
      .update(attendance)
      .set({ status, updatedAt: new Date() })
      .where(eq(attendance.id, existing.id))
      .returning();

    return apiSuccess(updated);
  }

  /* Create new attendance record */
  const [record] = await db
    .insert(attendance)
    .values({
      occurrenceId,
      classId,
      userId: user.id,
      status,
    })
    .returning();

  return apiSuccess(record, 201);
}

/**
 * Handles bulk attendance marking for multiple occurrences.
 * Used for pending attendance alerts — PRD Section 11.4.
 */
async function handleBulkAttendance(userId: string, body: unknown) {
  const parsed = bulkAttendanceSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0].message, 422);
  }

  const { occurrenceIds, classId, status } = parsed.data;
  const results = [];

  for (const occurrenceId of occurrenceIds) {
    /* Check for existing */
    const existing = await db.query.attendance.findFirst({
      where: and(
        eq(attendance.occurrenceId, occurrenceId),
        eq(attendance.userId, userId)
      ),
    });

    if (existing) {
      /* Log change and update */
      await db.insert(attendanceEditHistory).values({
        attendanceId: existing.id,
        userId,
        previousStatus: existing.status,
        newStatus: status,
      });

      const [updated] = await db
        .update(attendance)
        .set({ status, updatedAt: new Date() })
        .where(eq(attendance.id, existing.id))
        .returning();

      results.push(updated);
    } else {
      /* Create new record */
      const [record] = await db
        .insert(attendance)
        .values({
          occurrenceId,
          classId,
          userId,
          status,
        })
        .returning();
      results.push(record);
    }
  }

  return apiSuccess(results);
}
