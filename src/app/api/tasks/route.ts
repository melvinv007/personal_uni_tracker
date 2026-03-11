/**
 * Tasks API — GET for semester/class, POST create
 *
 * GET /api/tasks?semesterId=xxx — Returns all tasks for a semester.
 * GET /api/tasks?classId=xxx — Returns all tasks for a class.
 * POST /api/tasks — Creates a new task or assignment.
 *
 * Reference: PRD Section 14 (Tasks & Assignments)
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createTaskSchema } from "@/lib/validations/schemas";
import {
  getAuthUser,
  apiError,
  apiSuccess,
  sanitizeString,
} from "@/lib/api/helpers";

/**
 * GET /api/tasks
 * Returns tasks filtered by semesterId or classId.
 */
export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  const { searchParams } = request.nextUrl;
  const semesterId = searchParams.get("semesterId");
  const classId = searchParams.get("classId");

  if (classId) {
    const data = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.classId, classId), eq(tasks.userId, user.id)));
    return apiSuccess(data);
  }

  if (semesterId) {
    const data = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.semesterId, semesterId), eq(tasks.userId, user.id)));
    return apiSuccess(data);
  }

  return apiError("Provide semesterId or classId", 422);
}

/**
 * POST /api/tasks
 * Creates a new task or assignment.
 */
export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  const body = await request.json();
  const parsed = createTaskSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(parsed.error.issues[0].message, 422);
  }

  const { name, deadline, isAssignment, marksScored, totalMarks, isSubmitted, classId, semesterId } =
    parsed.data;

  const [task] = await db
    .insert(tasks)
    .values({
      userId: user.id,
      semesterId,
      classId: classId || null,
      name: sanitizeString(name),
      deadline: deadline ? new Date(deadline) : null,
      isAssignment,
      marksScored: marksScored != null ? String(marksScored) : null,
      totalMarks: totalMarks != null ? String(totalMarks) : null,
      isSubmitted,
    })
    .returning();

  return apiSuccess(task, 201);
}
