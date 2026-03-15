/**
 * Classes API — GET all for semester, POST create
 *
 * GET /api/classes?semesterId=xxx — Returns all classes for a semester.
 * POST /api/classes — Creates a new class within a semester.
 *
 * Also creates schedule slots and generates occurrences if slots are provided.
 *
 * Reference: PRD Section 10.5 (Class Cards), Section 11 (Class Page)
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  classes,
  classScheduleSlots,
  classOccurrences,
  semesters,
} from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { createClassSchema } from "@/lib/validations/schemas";
import {
  getAuthUser,
  apiError,
  apiSuccess,
  sanitizeString,
} from "@/lib/api/helpers";
import { generateOccurrences } from "@/lib/utils/occurrences";

/**
 * GET /api/classes?semesterId=xxx
 * Returns all classes for a given semester, with schedule slots, exams, tasks.
 */
export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  const semesterId = request.nextUrl.searchParams.get("semesterId");
  if (!semesterId) return apiError("semesterId is required", 422);

  const data = await db.query.classes.findMany({
    where: and(
      eq(classes.semesterId, semesterId),
      eq(classes.userId, user.id),
      isNull(classes.deletedAt)
    ),
    with: {
      scheduleSlots: true,
      exams: true,
      tasks: true,
      letterGrade: true,
      syllabusRubric: true,
    },
  });

  return apiSuccess(data);
}

/**
 * POST /api/classes
 * Creates a class, optionally with schedule slots.
 * Auto-generates class occurrences from schedule slots using rrule.
 */
export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  const body = await request.json();
  const parsed = createClassSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(parsed.error.issues[0].message, 422);
  }

  const { name, category, credits, startDate, endDate, color, scheduleSlots: slots } = parsed.data;
  const semesterId = body.semesterId;

  if (!semesterId) return apiError("semesterId is required", 422);

  /* Verify semester exists and belongs to user */
  const semester = await db.query.semesters.findFirst({
    where: and(eq(semesters.id, semesterId), eq(semesters.userId, user.id)),
  });
  if (!semester) return apiError("Semester not found", 404);

  /* Use semester color if class color not specified */
  const classColor = color || semester.color;
  const classStartDate = startDate || semester.startDate;
  const classEndDate = endDate || semester.endDate;

  /* Create the class */
  const [newClass] = await db
    .insert(classes)
    .values({
      semesterId,
      userId: user.id,
      name: sanitizeString(name),
      category,
      credits,
      color: classColor,
      startDate: classStartDate,
      endDate: classEndDate,
    })
    .returning();

  /* Create schedule slots if provided */
  if (slots && slots.length > 0) {
    const createdSlots = await db
      .insert(classScheduleSlots)
      .values(
        slots.map((slot) => ({
          classId: newClass.id,
          userId: user.id,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          location: slot.location ? sanitizeString(slot.location) : null,
          validFrom: classStartDate,
        }))
      )
      .returning();

    /* Auto-generate class occurrences from recurring slots */
    const occurrences = generateOccurrences(
      createdSlots,
      newClass.id,
      user.id,
      classStartDate,
      classEndDate
    );

    if (occurrences.length > 0) {
      await db.insert(classOccurrences).values(occurrences);
    }
  }

  return apiSuccess(newClass, 201);
}
