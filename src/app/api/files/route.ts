/**
 * Files API — GET for class, POST create, PATCH reorder
 *
 * GET /api/files?classId=xxx — Returns all files for a class.
 * POST /api/files — Creates a new file reference.
 * PATCH /api/files — Batch update sort order (drag-to-reorder).
 *
 * Files are desktop-only (feature-detected). Only stores FileSystemFileHandle
 * references, not actual file content.
 *
 * Reference: PRD Section 18 (File System Access)
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { files, classes } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { z } from "zod";
import {
  getAuthUser,
  apiError,
  apiSuccess,
  sanitizeString,
} from "@/lib/api/helpers";

/** File creation schema */
const createFileSchema = z.object({
  classId: z.string().uuid(),
  displayName: z.string().min(1).max(200),
  fileHandleSerialized: z.string().nullable().optional(),
});

/** Batch reorder schema */
const reorderFilesSchema = z.object({
  files: z.array(
    z.object({
      id: z.string().uuid(),
      sortOrder: z.number().int().min(0),
    })
  ),
});

/**
 * GET /api/files?classId=xxx
 * Returns all files for a class, ordered by sortOrder.
 */
export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  const classId = request.nextUrl.searchParams.get("classId");
  if (!classId) return apiError("classId is required", 422);

  const data = await db
    .select()
    .from(files)
    .where(and(eq(files.classId, classId), eq(files.userId, user.id)))
    .orderBy(asc(files.sortOrder));

  return apiSuccess(data);
}

/**
 * POST /api/files
 * Creates a new file reference for a class.
 */
export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  const body = await request.json();
  const parsed = createFileSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(parsed.error.issues[0].message, 422);
  }

  const { classId, displayName, fileHandleSerialized } = parsed.data;

  /* Verify class belongs to user */
  const classData = await db.query.classes.findFirst({
    where: and(eq(classes.id, classId), eq(classes.userId, user.id)),
  });
  if (!classData) return apiError("Class not found", 404);

  /* Get current max sortOrder for this class */
  const existingFiles = await db
    .select({ sortOrder: files.sortOrder })
    .from(files)
    .where(and(eq(files.classId, classId), eq(files.userId, user.id)));

  const maxSort = existingFiles.reduce(
    (max, f) => Math.max(max, f.sortOrder ?? 0),
    -1
  );

  const [file] = await db
    .insert(files)
    .values({
      classId,
      userId: user.id,
      displayName: sanitizeString(displayName),
      fileHandleSerialized: fileHandleSerialized || null,
      sortOrder: maxSort + 1,
    })
    .returning();

  return apiSuccess(file, 201);
}

/**
 * PATCH /api/files
 * Batch updates sort order for drag-to-reorder.
 */
export async function PATCH(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  const body = await request.json();
  const parsed = reorderFilesSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(parsed.error.issues[0].message, 422);
  }

  /* Update each file's sort order */
  for (const { id, sortOrder } of parsed.data.files) {
    await db
      .update(files)
      .set({ sortOrder, updatedAt: new Date() })
      .where(and(eq(files.id, id), eq(files.userId, user.id)));
  }

  return apiSuccess({ success: true });
}
