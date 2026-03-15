/**
 * File Detail API — PATCH, DELETE
 *
 * PATCH /api/files/[id] — Updates file metadata (displayName, handleValid).
 * DELETE /api/files/[id] — Deletes a file reference.
 *
 * Reference: PRD Section 18 (File System Access)
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { z } from "zod";
import { getAuthUser, apiError, apiSuccess } from "@/lib/api/helpers";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** Update file metadata schema */
const updateFileSchema = z.object({
  displayName: z.string().min(1).max(200).optional(),
  handleValid: z.boolean().optional(),
});

/**
 * PATCH /api/files/[id]
 * Updates file metadata (displayName, handleValid).
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  const { id } = await params;
  const body = await request.json();
  const parsed = updateFileSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(parsed.error.issues[0].message, 422);
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.displayName !== undefined) updates.displayName = parsed.data.displayName;
  if (parsed.data.handleValid !== undefined) updates.handleValid = parsed.data.handleValid;

  const [updated] = await db
    .update(files)
    .set(updates)
    .where(
      and(
        eq(files.id, id),
        eq(files.userId, user.id),
        isNull(files.deletedAt)
      )
    )
    .returning();

  if (!updated) return apiError("File not found", 404);

  return apiSuccess(updated);
}

/**
 * DELETE /api/files/[id]
 * Deletes a file reference.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  const { id } = await params;
  const hard = request.nextUrl.searchParams.get("hard") === "true";
  const undo = request.nextUrl.searchParams.get("undo") === "true";

  if (hard) {
    const [deleted] = await db
      .delete(files)
      .where(and(eq(files.id, id), eq(files.userId, user.id)))
      .returning();

    if (!deleted) return apiError("File not found", 404);
  } else if (undo) {
    const [restored] = await db
      .update(files)
      .set({ deletedAt: null })
      .where(and(eq(files.id, id), eq(files.userId, user.id)))
      .returning();

    if (!restored) return apiError("File not found", 404);
  } else {
    // Soft delete
    const [deleted] = await db
      .update(files)
      .set({ deletedAt: new Date() })
      .where(and(eq(files.id, id), eq(files.userId, user.id)))
      .returning();

    if (!deleted) return apiError("File not found", 404);
  }

  return apiSuccess({ success: true });
}
