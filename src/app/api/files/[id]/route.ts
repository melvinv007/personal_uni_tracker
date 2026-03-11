/**
 * File Detail API — DELETE
 *
 * DELETE /api/files/[id] — Deletes a file reference.
 *
 * Reference: PRD Section 18 (File System Access)
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthUser, apiError, apiSuccess } from "@/lib/api/helpers";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * DELETE /api/files/[id]
 * Deletes a file reference.
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  const { id } = await params;

  const [deleted] = await db
    .delete(files)
    .where(and(eq(files.id, id), eq(files.userId, user.id)))
    .returning();

  if (!deleted) return apiError("File not found", 404);

  return apiSuccess({ success: true });
}
