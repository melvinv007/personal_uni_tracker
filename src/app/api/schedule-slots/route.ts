/**
 * Schedule Slots API — POST create, GET for class
 *
 * GET /api/schedule-slots?classId=xxx — Returns all slots for a class.
 * POST /api/schedule-slots — Creates a new schedule slot + generates occurrences.
 *
 * Reference: PRD Section 12.5 (Recurrence), Section 12.6 (Mid-semester changes)
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { classScheduleSlots, classOccurrences, classes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createScheduleSlotSchema } from "@/lib/validations/schemas";
import {
  getAuthUser,
  apiError,
  apiSuccess,
  sanitizeString,
} from "@/lib/api/helpers";
import { generateOccurrences } from "@/lib/utils/occurrences";

/**
 * GET /api/schedule-slots?classId=xxx
 * Returns all schedule slots for a given class.
 */
export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  const classId = request.nextUrl.searchParams.get("classId");
  if (!classId) return apiError("classId is required", 422);

  const data = await db
    .select()
    .from(classScheduleSlots)
    .where(
      and(
        eq(classScheduleSlots.classId, classId),
        eq(classScheduleSlots.userId, user.id)
      )
    );

  return apiSuccess(data);
}

/**
 * POST /api/schedule-slots
 * Creates a new schedule slot and auto-generates occurrences.
 */
export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  const body = await request.json();
  const parsed = createScheduleSlotSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(parsed.error.issues[0].message, 422);
  }

  const { classId, dayOfWeek, startTime, endTime, location, validFrom, validUntil } =
    parsed.data;

  /* Verify class exists and belongs to user */
  const classData = await db.query.classes.findFirst({
    where: and(eq(classes.id, classId), eq(classes.userId, user.id)),
  });
  if (!classData) return apiError("Class not found", 404);

  /* Create the schedule slot */
  const [slot] = await db
    .insert(classScheduleSlots)
    .values({
      classId,
      userId: user.id,
      dayOfWeek,
      startTime,
      endTime,
      location: location ? sanitizeString(location) : null,
      validFrom,
      validUntil: validUntil || null,
    })
    .returning();

  /* Generate occurrences for this new slot */
  const occurrences = generateOccurrences(
    [slot],
    classId,
    user.id,
    classData.startDate,
    classData.endDate
  );

  if (occurrences.length > 0) {
    await db.insert(classOccurrences).values(occurrences);
  }

  return apiSuccess(slot, 201);
}
