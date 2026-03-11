/**
 * Zod Validation Schemas
 *
 * Purpose: Defines all form validation schemas used by React Hook Form (client-side)
 * and API route validation (server-side). Schemas are reused in both layers for
 * consistent validation — PRD Section 25.3 (Data Validation Layers).
 *
 * Reference: PRD Section 20 (Forms & Validation)
 */
import { z } from "zod";

/* ============================================================
 * Shared validation helpers
 * ============================================================ */

/** Hex color string validation (e.g. "#a855f7") */
const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color format");

/** Time string in HH:MM format — PRD Section 20.2 (custom time input) */
const timeString = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be in HH:MM format (e.g. 13:15)");

/** Day of week (0 = Sunday through 6 = Saturday) */
const dayOfWeek = z.number().int().min(0).max(6);

/* ============================================================
 * Semester Schemas — PRD Section 20.3
 * ============================================================ */

/** Semester creation form validation */
export const createSemesterSchema = z
  .object({
    name: z
      .string()
      .min(1, "Semester name is required")
      .max(100, "Name too long"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    color: hexColor,
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: "End date must be after start date",
    path: ["endDate"],
  });

/** Semester update — same fields as create, all optional except id */
export const updateSemesterSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    color: hexColor.optional(),
    isActive: z.boolean().optional(),
    isCompleted: z.boolean().optional(),
    notes: z.string().nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) > new Date(data.startDate);
      }
      return true;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    }
  );

export type CreateSemesterInput = z.infer<typeof createSemesterSchema>;
export type UpdateSemesterInput = z.infer<typeof updateSemesterSchema>;

/* ============================================================
 * Class Schemas — PRD Section 20.4
 * ============================================================ */

/** Schedule slot within class creation */
const scheduleSlotSchema = z.object({
  dayOfWeek: dayOfWeek,
  startTime: timeString,
  endTime: timeString,
  location: z.string().max(100).optional(),
});

/** Class creation form validation */
export const createClassSchema = z.object({
  name: z.string().min(1, "Class name is required").max(100, "Name too long"),
  category: z.enum(["Core", "Minor", "Elective", "Other"]),
  credits: z.number().int().min(1, "Credits must be at least 1").max(20),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  color: hexColor.optional(),
  scheduleSlots: z.array(scheduleSlotSchema).optional(),
});

export const updateClassSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  category: z.enum(["Core", "Minor", "Elective", "Other"]).optional(),
  credits: z.number().int().min(1).max(20).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  color: hexColor.optional(),
  notes: z.string().nullable().optional(),
});

export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;

/* ============================================================
 * Task Schemas — PRD Section 20.5
 * ============================================================ */

/** Task/Assignment creation form validation */
export const createTaskSchema = z
  .object({
    name: z.string().min(1, "Task name is required").max(200),
    deadline: z.string().nullable().optional(),
    isAssignment: z.boolean().default(false),
    marksScored: z.number().nullable().optional(),
    totalMarks: z.number().nullable().optional(),
    isSubmitted: z.boolean().default(false),
    classId: z.string().uuid().nullable().optional(),
    semesterId: z.string().uuid(),
  })
  .refine(
    (data) => {
      /* Marks scored must not exceed total marks — PRD Section 7.3 */
      if (data.marksScored != null && data.totalMarks != null) {
        return data.marksScored <= data.totalMarks;
      }
      return true;
    },
    {
      message: "Marks scored cannot exceed total marks",
      path: ["marksScored"],
    }
  );

export const updateTaskSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  deadline: z.string().nullable().optional(),
  isAssignment: z.boolean().optional(),
  marksScored: z.number().nullable().optional(),
  totalMarks: z.number().nullable().optional(),
  isSubmitted: z.boolean().optional(),
  isCompleted: z.boolean().optional(),
  classId: z.string().uuid().nullable().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

/* ============================================================
 * Exam Schemas — PRD Section 20.6
 * ============================================================ */

/** Exam creation form validation */
export const createExamSchema = z
  .object({
    name: z.string().min(1, "Exam name is required").max(200),
    examDate: z.string().min(1, "Exam date is required"),
    marksScored: z.number().nullable().optional(),
    totalMarks: z.number().positive("Total marks must be positive"),
    weightage: z
      .number()
      .min(0, "Weightage cannot be negative")
      .max(100, "Weightage cannot exceed 100%"),
    classId: z.string().uuid(),
  })
  .refine(
    (data) => {
      /* Marks scored must not exceed total marks — PRD Section 15.2 */
      if (data.marksScored != null) {
        return data.marksScored <= data.totalMarks;
      }
      return true;
    },
    {
      message: "Marks scored cannot exceed total marks",
      path: ["marksScored"],
    }
  );

export const updateExamSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  examDate: z.string().optional(),
  marksScored: z.number().nullable().optional(),
  totalMarks: z.number().positive().optional(),
  weightage: z.number().min(0).max(100).optional(),
});

export type CreateExamInput = z.infer<typeof createExamSchema>;
export type UpdateExamInput = z.infer<typeof updateExamSchema>;

/* ============================================================
 * Extra Class Schema — PRD Section 20.7
 * ============================================================ */

export const createExtraClassSchema = z
  .object({
    date: z.string().min(1, "Date is required"),
    startTime: timeString,
    endTime: timeString,
    location: z.string().max(100).optional(),
    classId: z.string().uuid(),
  })
  .refine(
    (data) => data.endTime > data.startTime,
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  );

export type CreateExtraClassInput = z.infer<typeof createExtraClassSchema>;

/* ============================================================
 * Non-Academic Event Schema — PRD Section 20.8
 * ============================================================ */

export const createNonAcademicEventSchema = z
  .object({
    name: z.string().min(1, "Event name is required").max(200),
    eventDate: z.string().min(1, "Date is required"),
    startTime: timeString,
    endTime: timeString,
    location: z.string().max(200).optional(),
    color: hexColor.optional(),
    notes: z.string().max(1000).optional(),
    semesterId: z.string().uuid().nullable().optional(),
  })
  .refine(
    (data) => data.endTime > data.startTime,
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  );

export type CreateNonAcademicEventInput = z.infer<
  typeof createNonAcademicEventSchema
>;

/* ============================================================
 * Attendance Schema — PRD Section 13
 * ============================================================ */

export const markAttendanceSchema = z.object({
  occurrenceId: z.string().uuid(),
  classId: z.string().uuid(),
  status: z.enum(["present", "absent", "cancelled"]),
});

/** Bulk attendance marking — PRD Section 11.4 */
export const bulkAttendanceSchema = z.object({
  occurrenceIds: z.array(z.string().uuid()).min(1),
  classId: z.string().uuid(),
  status: z.enum(["present", "absent"]),
});

export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;
export type BulkAttendanceInput = z.infer<typeof bulkAttendanceSchema>;

/* ============================================================
 * Letter Grade Schema — PRD Section 11.18, Section 16
 * ============================================================ */

export const setLetterGradeSchema = z.object({
  classId: z.string().uuid(),
  semesterId: z.string().uuid(),
  grade: z.enum(["AA", "AB", "BB", "BC", "CC", "CD", "DD", "FF"]),
});

export type SetLetterGradeInput = z.infer<typeof setLetterGradeSchema>;

/* ============================================================
 * Syllabus Rubric Schema — PRD Section 11.17
 * ============================================================ */

export const syllabusRubricSchema = z.object({
  classId: z.string().uuid(),
  components: z
    .array(
      z.object({
        name: z.string().min(1, "Component name is required"),
        weightage_percent: z
          .number()
          .min(0)
          .max(100, "Weightage cannot exceed 100%"),
      })
    )
    .min(1, "At least one component is required"),
});

export type SyllabusRubricInput = z.infer<typeof syllabusRubricSchema>;

/* ============================================================
 * Schedule Slot Schema — PRD Section 12.5
 * ============================================================ */

export const createScheduleSlotSchema = z.object({
  classId: z.string().uuid(),
  dayOfWeek: dayOfWeek,
  startTime: timeString,
  endTime: timeString,
  location: z.string().max(100).optional(),
  validFrom: z.string().min(1, "Valid from date is required"),
  validUntil: z.string().nullable().optional(),
});

export type CreateScheduleSlotInput = z.infer<typeof createScheduleSlotSchema>;
