/**
 * Data Export API — GET
 *
 * GET /api/export?format=json — Full JSON backup of all user data.
 * GET /api/export?format=csv — CSV export of attendance, exams, tasks as downloadable data.
 *
 * Reference: PRD Section 23 (Data Export)
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  semesters,
  classes,
  classScheduleSlots,
  classOccurrences,
  attendance,
  tasks,
  exams,
  letterGrades,
  nonAcademicEvents,
  officialSemesterGrades,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAuthUser, apiError } from "@/lib/api/helpers";

/**
 * GET /api/export?format=json|csv
 * Exports all user data in the requested format.
 */
export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  const format = request.nextUrl.searchParams.get("format") || "json";

  /* Fetch all data for this user */
  const data = {
    semesters: await db.select().from(semesters).where(eq(semesters.userId, user.id)),
    classes: await db.select().from(classes).where(eq(classes.userId, user.id)),
    scheduleSlots: await db.select().from(classScheduleSlots).where(eq(classScheduleSlots.userId, user.id)),
    occurrences: await db.select().from(classOccurrences).where(eq(classOccurrences.userId, user.id)),
    attendance: await db.select().from(attendance).where(eq(attendance.userId, user.id)),
    tasks: await db.select().from(tasks).where(eq(tasks.userId, user.id)),
    exams: await db.select().from(exams).where(eq(exams.userId, user.id)),
    letterGrades: await db.select().from(letterGrades).where(eq(letterGrades.userId, user.id)),
    events: await db.select().from(nonAcademicEvents).where(eq(nonAcademicEvents.userId, user.id)),
    officialGrades: await db.select().from(officialSemesterGrades).where(eq(officialSemesterGrades.userId, user.id)),
    exportedAt: new Date().toISOString(),
  };

  if (format === "csv") {
    /* Generate CSV for key tables */
    const csvParts: string[] = [];

    /* Attendance CSV */
    csvParts.push("--- ATTENDANCE ---");
    csvParts.push("id,class_id,occurrence_id,status,marked_at");
    for (const a of data.attendance) {
      csvParts.push(`${a.id},${a.classId},${a.occurrenceId},${a.status},${a.markedAt}`);
    }

    /* Tasks CSV */
    csvParts.push("\n--- TASKS ---");
    csvParts.push("id,name,semester_id,class_id,deadline,is_completed,is_assignment,is_submitted");
    for (const t of data.tasks) {
      csvParts.push(
        `${t.id},"${t.name}",${t.semesterId},${t.classId || ""},${t.deadline || ""},${t.isCompleted},${t.isAssignment},${t.isSubmitted}`
      );
    }

    /* Exams CSV */
    csvParts.push("\n--- EXAMS ---");
    csvParts.push("id,name,class_id,exam_date,marks_scored,total_marks,weightage");
    for (const e of data.exams) {
      csvParts.push(
        `${e.id},"${e.name}",${e.classId},${e.examDate},${e.marksScored || ""},${e.totalMarks},${e.weightage}`
      );
    }

    return new Response(csvParts.join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="tracker-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  }

  /* Default: JSON export */
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="tracker-backup-${new Date().toISOString().split("T")[0]}.json"`,
    },
  });
}
