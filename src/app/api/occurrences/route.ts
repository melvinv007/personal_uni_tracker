/**
 * Class Occurrences API — GET for class, POST extra class, PATCH status
 *
 * GET /api/occurrences?classId=xxx — Returns all occurrences for a class.
 * GET /api/occurrences?semesterId=xxx — Returns all occurrences for a semester.
 * GET /api/occurrences?date=yyyy-MM-dd — Returns all occurrences for a date (for day/week view).
 * POST /api/occurrences — Creates an extra one-off class.
 *
 * Reference: PRD Section 12 (Calendar), Section 13 (Attendance)
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { classOccurrences, classes } from "@/lib/db/schema";
import { eq, and, gte, lte, isNull } from "drizzle-orm";
import { createExtraClassSchema } from "@/lib/validations/schemas";
import {
  getAuthUser,
  apiError,
  apiSuccess,
  sanitizeString,
} from "@/lib/api/helpers";

/**
 * GET /api/occurrences
 * Supports filtering by classId, semesterId, or date range.
 */
export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  const { searchParams } = request.nextUrl;
  const classId = searchParams.get("classId");
  const semesterId = searchParams.get("semesterId");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const date = searchParams.get("date");

  /* Single class occurrences */
  if (classId) {
    const data = await db.query.classOccurrences.findMany({
      where: and(
        eq(classOccurrences.classId, classId),
        eq(classOccurrences.userId, user.id),
        isNull(classOccurrences.deletedAt)
      ),
      with: { attendance: true, class_: true },
    });
    return apiSuccess(data);
  }

  /* Date range query (for calendar views) */
  if (dateFrom && dateTo) {
    const conditions = [
      eq(classOccurrences.userId, user.id),
      gte(classOccurrences.occurrenceDate, dateFrom),
      lte(classOccurrences.occurrenceDate, dateTo),
      isNull(classOccurrences.deletedAt),
    ];

    const data = await db.query.classOccurrences.findMany({
      where: and(...conditions),
      with: { attendance: true, class_: true },
    });
    return apiSuccess(data);
  }

  /* Single date query */
  if (date) {
    const data = await db.query.classOccurrences.findMany({
      where: and(
        eq(classOccurrences.userId, user.id),
        eq(classOccurrences.occurrenceDate, date),
        isNull(classOccurrences.deletedAt)
      ),
      with: { attendance: true, class_: true },
    });
    return apiSuccess(data);
  }

  /* All occurrences for a semester (via class junction) */
  if (semesterId) {
    const semesterClasses = await db
      .select({ id: classes.id })
      .from(classes)
      .where(and(eq(classes.semesterId, semesterId), eq(classes.userId, user.id)));

    const classIds = semesterClasses.map((c) => c.id);
    if (classIds.length === 0) return apiSuccess([]);

    // Single query for all occurrences in these classes
    // Use inArray for classOccurrences.classId
    const { inArray } = await import("drizzle-orm/sql/expressions/conditions");
    const allOccurrences = await db.query.classOccurrences.findMany({
      where: and(
        eq(classOccurrences.userId, user.id),
        inArray(classOccurrences.classId, classIds),
        isNull(classOccurrences.deletedAt)
      ),
      with: { attendance: true, class_: true },
    });
    return apiSuccess(allOccurrences);
  }

  return apiError("Provide classId, semesterId, date, or dateFrom+dateTo", 422);
}

/**
 * POST /api/occurrences
 * Creates a one-off extra class occurrence.
 * Reference: PRD Section 12.2 (Extra Classes via FAB)
 */
export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  const body = await request.json();
  const parsed = createExtraClassSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(parsed.error.issues[0].message, 422);
  }

  const { date, startTime, endTime, location, classId } = parsed.data;

  /* Verify class belongs to user */
  const classData = await db.query.classes.findFirst({
    where: and(eq(classes.id, classId), eq(classes.userId, user.id)),
  });
  if (!classData) return apiError("Class not found", 404);

  const [occurrence] = await db
    .insert(classOccurrences)
    .values({
      classId,
      userId: user.id,
      occurrenceDate: date,
      startTime,
      endTime,
      location: location ? sanitizeString(location) : null,
      status: "extra",
      isExtra: true,
    })
    .returning();

  return apiSuccess(occurrence, 201);
}
