/**
 * Occurrence Detail API — PATCH status (cancel/reschedule)
 *
 * PATCH /api/occurrences/[id] — Update occurrence status.
 * DELETE /api/occurrences/[id] — Delete an occurrence (extra classes only).
 *
 * Reference: PRD Section 12.3 (Cancel/Reschedule Individual Occurrences)
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { classOccurrences } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { getAuthUser, apiError, apiSuccess } from "@/lib/api/helpers";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** Validation for updating an occurrence */
const updateOccurrenceSchema = z.object({
  status: z.enum(["scheduled", "cancelled", "extra", "rescheduled"]).optional(),
  occurrenceDate: z.string().optional(),
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .optional(),
  endTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .optional(),
});

/**
 * PATCH /api/occurrences/[id]
 * Updates occurrence status (e.g., cancel a class).
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  const { id } = await params;
  const body = await request.json();
  const parsed = updateOccurrenceSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(parsed.error.issues[0].message, 422);
  }

  const [updated] = await db
    .update(classOccurrences)
    .set(parsed.data)
    .where(and(eq(classOccurrences.id, id), eq(classOccurrences.userId, user.id)))
    .returning();

  if (!updated) return apiError("Occurrence not found", 404);

  return apiSuccess(updated);
}

/**
 * DELETE /api/occurrences/[id]
 * Deletes an extra class occurrence only.
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  const { id } = await params;

  /* Only allow deletion of extra classes */
  const occurrence = await db.query.classOccurrences.findFirst({
    where: and(
      eq(classOccurrences.id, id),
      eq(classOccurrences.userId, user.id)
    ),
  });

  if (!occurrence) return apiError("Occurrence not found", 404);
  if (!occurrence.isExtra) {
    return apiError("Only extra classes can be deleted. Cancel scheduled classes instead.", 400);
  }

  await db
    .delete(classOccurrences)
    .where(eq(classOccurrences.id, id));

  return apiSuccess({ success: true });
}
