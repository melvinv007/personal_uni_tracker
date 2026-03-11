/**
 * Non-Academic Events API — GET all, POST create
 *
 * GET /api/events?semesterId=xxx — Returns all non-academic events.
 * POST /api/events — Creates a new non-academic event.
 *
 * These events appear on the calendar but are excluded from all academic stats.
 *
 * Reference: PRD Section 12.4 (Non-Academic Events)
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { nonAcademicEvents } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createNonAcademicEventSchema } from "@/lib/validations/schemas";
import {
  getAuthUser,
  apiError,
  apiSuccess,
  sanitizeString,
} from "@/lib/api/helpers";

/**
 * GET /api/events
 * Returns all non-academic events, optionally filtered by semester.
 */
export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  const semesterId = request.nextUrl.searchParams.get("semesterId");

  if (semesterId) {
    const data = await db
      .select()
      .from(nonAcademicEvents)
      .where(
        and(
          eq(nonAcademicEvents.semesterId, semesterId),
          eq(nonAcademicEvents.userId, user.id)
        )
      );
    return apiSuccess(data);
  }

  /* All events for user */
  const data = await db
    .select()
    .from(nonAcademicEvents)
    .where(eq(nonAcademicEvents.userId, user.id));

  return apiSuccess(data);
}

/**
 * POST /api/events
 * Creates a new non-academic event.
 */
export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  const body = await request.json();
  const parsed = createNonAcademicEventSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(parsed.error.issues[0].message, 422);
  }

  const { name, eventDate, startTime, endTime, location, color, notes, semesterId } =
    parsed.data;

  const [event] = await db
    .insert(nonAcademicEvents)
    .values({
      userId: user.id,
      semesterId: semesterId || null,
      name: sanitizeString(name),
      eventDate,
      startTime,
      endTime,
      location: location ? sanitizeString(location) : null,
      color: color || null,
      notes: notes ? sanitizeString(notes) : null,
    })
    .returning();

  return apiSuccess(event, 201);
}
