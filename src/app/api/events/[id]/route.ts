/**
 * Event Detail API — PATCH + DELETE
 *
 * PATCH /api/events/[id] — Updates a non-academic event.
 * DELETE /api/events/[id] — Deletes a non-academic event.
 *
 * Reference: PRD Section 12.4 (Non-Academic Events)
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { nonAcademicEvents } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import {
  getAuthUser,
  apiError,
  apiSuccess,
  sanitizeString,
} from "@/lib/api/helpers";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/events/[id]
 * Updates a non-academic event (partial update).
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  const { id } = await params;
  const body = await request.json();

  /* Build update object from allowed fields only */
  const updates: Record<string, unknown> = {};
  if (body.name != null) updates.name = sanitizeString(body.name);
  if (body.eventDate != null) updates.eventDate = body.eventDate;
  if (body.startTime != null) updates.startTime = body.startTime;
  if (body.endTime != null) updates.endTime = body.endTime;
  if (body.location !== undefined)
    updates.location = body.location ? sanitizeString(body.location) : null;
  if (body.color !== undefined) updates.color = body.color || null;
  if (body.notes !== undefined)
    updates.notes = body.notes ? sanitizeString(body.notes) : null;

  if (Object.keys(updates).length === 0) {
    return apiError("No valid fields to update", 422);
  }

  const [updated] = await db
    .update(nonAcademicEvents)
    .set(updates)
    .where(
      and(
        eq(nonAcademicEvents.id, id),
        eq(nonAcademicEvents.userId, user.id),
        isNull(nonAcademicEvents.deletedAt)
      )
    )
    .returning();

  if (!updated) return apiError("Event not found", 404);

  return apiSuccess(updated);
}

/**
 * DELETE /api/events/[id]
 * Deletes a non-academic event.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  const { id } = await params;
  const hard = request.nextUrl.searchParams.get("hard") === "true";
  const undo = request.nextUrl.searchParams.get("undo") === "true";

  if (hard) {
    const [deleted] = await db
      .delete(nonAcademicEvents)
      .where(
        and(
          eq(nonAcademicEvents.id, id),
          eq(nonAcademicEvents.userId, user.id)
        )
      )
      .returning();

    if (!deleted) return apiError("Event not found", 404);
  } else if (undo) {
    const [restored] = await db
      .update(nonAcademicEvents)
      .set({ deletedAt: null })
      .where(
        and(
          eq(nonAcademicEvents.id, id),
          eq(nonAcademicEvents.userId, user.id)
        )
      )
      .returning();

    if (!restored) return apiError("Event not found", 404);
  } else {
    // Soft delete
    const [deleted] = await db
      .update(nonAcademicEvents)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(nonAcademicEvents.id, id),
          eq(nonAcademicEvents.userId, user.id)
        )
      )
      .returning();

    if (!deleted) return apiError("Event not found", 404);
  }

  return apiSuccess({ success: true });
}
