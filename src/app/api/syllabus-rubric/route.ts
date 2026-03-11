/**
 * Syllabus Rubric API — GET, POST (upsert)
 *
 * GET /api/syllabus-rubric?classId=xxx — Returns rubric for a class.
 * POST /api/syllabus-rubric — Creates or updates rubric for a class.
 *
 * Each class has at most one rubric (unique constraint on class_id).
 *
 * Reference: PRD Section 11.17 (Syllabus Rubric & Grade Calculator)
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { syllabusRubric, classes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { syllabusRubricSchema } from "@/lib/validations/schemas";
import { getAuthUser, apiError, apiSuccess } from "@/lib/api/helpers";

/**
 * GET /api/syllabus-rubric?classId=xxx
 * Returns the syllabus rubric for a class, if one exists.
 */
export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  const classId = request.nextUrl.searchParams.get("classId");
  if (!classId) return apiError("classId is required", 422);

  const rubric = await db.query.syllabusRubric.findFirst({
    where: and(
      eq(syllabusRubric.classId, classId),
      eq(syllabusRubric.userId, user.id)
    ),
  });

  return apiSuccess(rubric ?? null);
}

/**
 * POST /api/syllabus-rubric
 * Upserts a syllabus rubric for a class.
 * Component weightages should sum to 100% (validated by client).
 */
export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  const body = await request.json();
  const parsed = syllabusRubricSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(parsed.error.issues[0].message, 422);
  }

  const { classId, components } = parsed.data;

  /* Verify class belongs to user */
  const classData = await db.query.classes.findFirst({
    where: and(eq(classes.id, classId), eq(classes.userId, user.id)),
  });
  if (!classData) return apiError("Class not found", 404);

  /* Check for existing rubric */
  const existing = await db.query.syllabusRubric.findFirst({
    where: and(
      eq(syllabusRubric.classId, classId),
      eq(syllabusRubric.userId, user.id)
    ),
  });

  let result;
  if (existing) {
    [result] = await db
      .update(syllabusRubric)
      .set({ components, updatedAt: new Date() })
      .where(eq(syllabusRubric.id, existing.id))
      .returning();
  } else {
    [result] = await db
      .insert(syllabusRubric)
      .values({
        classId,
        userId: user.id,
        components,
      })
      .returning();
  }

  return apiSuccess(result);
}
