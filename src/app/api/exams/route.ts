/**
 * Exams API — GET for class, POST create
 *
 * GET /api/exams?classId=xxx — Returns all exams for a class.
 * POST /api/exams — Creates a new exam.
 *
 * Reference: PRD Section 15 (Exams & Grades)
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { exams, classes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createExamSchema } from "@/lib/validations/schemas";
import {
  getAuthUser,
  apiError,
  apiSuccess,
  sanitizeString,
} from "@/lib/api/helpers";

/**
 * GET /api/exams?classId=xxx
 * Returns all exams for a given class, ordered by date.
 */
export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  const classId = request.nextUrl.searchParams.get("classId");
  if (!classId) return apiError("classId is required", 422);

  const data = await db
    .select()
    .from(exams)
    .where(and(eq(exams.classId, classId), eq(exams.userId, user.id)));

  return apiSuccess(data);
}

/**
 * POST /api/exams
 * Creates a new exam for a class.
 */
export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  const body = await request.json();
  const parsed = createExamSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(parsed.error.issues[0].message, 422);
  }

  const { name, examDate, marksScored, totalMarks, weightage, classId } = parsed.data;

  /* Verify class exists and belongs to user */
  const classData = await db.query.classes.findFirst({
    where: and(eq(classes.id, classId), eq(classes.userId, user.id)),
  });
  if (!classData) return apiError("Class not found", 404);

  const [exam] = await db
    .insert(exams)
    .values({
      classId,
      userId: user.id,
      name: sanitizeString(name),
      examDate,
      marksScored: marksScored != null ? String(marksScored) : null,
      totalMarks: String(totalMarks),
      weightage: String(weightage),
    })
    .returning();

  return apiSuccess(exam, 201);
}
