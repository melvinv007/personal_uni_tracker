/**
 * Cron: Check Assignment Deadlines — GET
 *
 * Purpose: Server-side cron job that checks for unsubmitted assignments
 * with deadlines within the next 24 hours. This is the server-side
 * component of the notification system.
 *
 * Called by Vercel Cron every hour. Returns a list of assignments
 * that need notifications so the client can display them on next load.
 *
 * PRD §19.2: Only one notification type in v1:
 * "Assignment deadline within 24 hours AND is_submitted = false"
 *
 * PRD §19.3: Scheduling handled server-side via Vercel Cron Job.
 *
 * Note: Since Web Push requires a push subscription (VAPID keys + endpoint),
 * and this is a single-user PWA, we use a simpler approach:
 * - This cron endpoint marks notifications as pending in a response
 * - The client checks on load and shows browser notifications
 *
 * Route: GET /api/cron/check-deadlines
 * Vercel Cron: Runs every hour
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * GET /api/cron/check-deadlines
 *
 * Finds all unsubmitted assignments with deadlines within 24 hours.
 * Protected by CRON_SECRET to prevent unauthorized access.
 */
export async function GET(request: NextRequest) {
  /* Verify the request comes from Vercel Cron or an authorized source */
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    /* Find assignments that:
     * 1. Are marked as assignments (is_assignment = true)
     * 2. Are NOT submitted (is_submitted = false)
     * 3. Are NOT completed (is_completed = false)
     * 4. Have a deadline within the next 24 hours
     * 5. Deadline has not passed yet */
    const now = new Date();
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const upcomingAssignments = await db
      .select({
        id: tasks.id,
        name: tasks.name,
        deadline: tasks.deadline,
        classId: tasks.classId,
        semesterId: tasks.semesterId,
        userId: tasks.userId,
      })
      .from(tasks)
      .where(
        and(
          eq(tasks.isAssignment, true),
          eq(tasks.isSubmitted, false),
          eq(tasks.isCompleted, false),
          sql`${tasks.deadline} IS NOT NULL`,
          sql`${tasks.deadline} > ${now.toISOString()}`,
          sql`${tasks.deadline} <= ${twentyFourHoursFromNow.toISOString()}`
        )
      );

    return NextResponse.json({
      checked_at: now.toISOString(),
      upcoming_count: upcomingAssignments.length,
      assignments: upcomingAssignments.map((a) => ({
        id: a.id,
        name: a.name,
        deadline: a.deadline?.toISOString(),
        classId: a.classId,
        semesterId: a.semesterId,
      })),
    });
  } catch (error) {
    console.error("Cron check-deadlines error:", error);
    return NextResponse.json(
      { error: "Failed to check deadlines" },
      { status: 500 }
    );
  }
}
