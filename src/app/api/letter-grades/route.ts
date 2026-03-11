/**
 * Letter Grades API — POST/PUT (upsert)
 *
 * POST /api/letter-grades — Set or update letter grade for a class.
 * GET /api/letter-grades?semesterId=xxx — Get all letter grades for a semester.
 *
 * Used after semester completion to input official grades for SPI/CGPA calculation.
 *
 * Reference: PRD Section 16 (CGPA & SPI System), Section 11.18 (Post-semester grade)
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { letterGrades, officialSemesterGrades, classes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { setLetterGradeSchema } from "@/lib/validations/schemas";
import { getAuthUser, apiError, apiSuccess } from "@/lib/api/helpers";
import { GRADE_POINTS } from "@/lib/utils/grades";

/** Grade points mapping — PRD Section 16.1 */
type LetterGrade = "AA" | "AB" | "BB" | "BC" | "CC" | "CD" | "DD" | "FF";

/**
 * GET /api/letter-grades?semesterId=xxx
 * Returns all letter grades for a semester.
 */
export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  const semesterId = request.nextUrl.searchParams.get("semesterId");
  if (!semesterId) return apiError("semesterId is required", 422);

  const data = await db
    .select()
    .from(letterGrades)
    .where(
      and(
        eq(letterGrades.semesterId, semesterId),
        eq(letterGrades.userId, user.id)
      )
    );

  return apiSuccess(data);
}

/**
 * POST /api/letter-grades
 * Upserts a letter grade for a class.
 * Auto-derives grade points from the letter grade value.
 * Also recalculates the semester's official SPI.
 */
export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  const body = await request.json();
  const parsed = setLetterGradeSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(parsed.error.issues[0].message, 422);
  }

  const { classId, semesterId, grade } = parsed.data;
  const gradePoints = GRADE_POINTS[grade as LetterGrade];

  /* Check if grade already exists for this class */
  const existing = await db.query.letterGrades.findFirst({
    where: and(
      eq(letterGrades.classId, classId),
      eq(letterGrades.userId, user.id)
    ),
  });

  let result;
  if (existing) {
    /* Update existing grade */
    [result] = await db
      .update(letterGrades)
      .set({ grade, gradePoints: String(gradePoints) })
      .where(eq(letterGrades.id, existing.id))
      .returning();
  } else {
    /* Create new grade record */
    [result] = await db
      .insert(letterGrades)
      .values({
        classId,
        semesterId,
        userId: user.id,
        grade,
        gradePoints: String(gradePoints),
      })
      .returning();
  }

  /* Recalculate official SPI for this semester */
  await recalculateOfficialSPI(user.id, semesterId);

  return apiSuccess(result);
}

/**
 * Recalculates the official SPI for a semester based on all letter grades.
 * SPI = Σ(grade_points × credits) / Σ(credits)
 *
 * Reference: PRD Section 16.3 (Official SPI Calculation)
 */
async function recalculateOfficialSPI(userId: string, semesterId: string) {
  /* Get all letter grades with their class credits */
  const grades = await db.query.letterGrades.findMany({
    where: and(
      eq(letterGrades.semesterId, semesterId),
      eq(letterGrades.userId, userId)
    ),
  });

  if (grades.length === 0) return;

  /* Get classes to know credits */
  const semesterClasses = await db
    .select()
    .from(classes)
    .where(and(eq(classes.semesterId, semesterId), eq(classes.userId, userId)));

  let totalWeighted = 0;
  let totalCredits = 0;

  for (const grade of grades) {
    const classInfo = semesterClasses.find((c) => c.id === grade.classId);
    if (classInfo) {
      totalWeighted += Number(grade.gradePoints) * classInfo.credits;
      totalCredits += classInfo.credits;
    }
  }

  const spi = totalCredits > 0 ? (totalWeighted / totalCredits).toFixed(2) : "0";

  /* Upsert official semester grade */
  const existing = await db.query.officialSemesterGrades.findFirst({
    where: and(
      eq(officialSemesterGrades.semesterId, semesterId),
      eq(officialSemesterGrades.userId, userId)
    ),
  });

  if (existing) {
    await db
      .update(officialSemesterGrades)
      .set({ spi })
      .where(eq(officialSemesterGrades.id, existing.id));
  } else {
    await db.insert(officialSemesterGrades).values({
      semesterId,
      userId,
      spi,
    });
  }
}
