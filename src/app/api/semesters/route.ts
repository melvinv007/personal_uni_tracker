/**
 * Semesters API — GET all, POST create
 *
 * GET /api/semesters — Returns all semesters for the authenticated user.
 * POST /api/semesters — Creates a new semester.
 *
 * Reference: PRD Section 9.5 (Semester Cards), Section 10 (Semester Page)
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { semesters } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { createSemesterSchema } from "@/lib/validations/schemas";
import {
  getAuthUser,
  apiError,
  apiSuccess,
  sanitizeString,
} from "@/lib/api/helpers";

/**
 * GET /api/semesters
 * Returns all semesters for the current user, ordered by creation date descending.
 */
export async function GET() {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  const data = await db
    .select()
    .from(semesters)
    .where(eq(semesters.userId, user.id))
    .orderBy(desc(semesters.createdAt));

  return apiSuccess(data);
}

/**
 * POST /api/semesters
 * Creates a new semester with validated input.
 * If isActive is implied, deactivates all other semesters first.
 */
export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  const body = await request.json();
  const parsed = createSemesterSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(parsed.error.issues[0].message, 422);
  }

  const { name, startDate, endDate, color } = parsed.data;

  const [semester] = await db
    .insert(semesters)
    .values({
      userId: user.id,
      name: sanitizeString(name),
      startDate,
      endDate,
      color,
    })
    .returning();

  return apiSuccess(semester, 201);
}
