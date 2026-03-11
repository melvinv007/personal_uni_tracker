/**
 * Database Schema — Tracker Application
 *
 * Purpose: Defines all database tables using Drizzle ORM.
 * This is the single source of truth for the database structure.
 * All schema changes must be versioned migrations via drizzle-kit.
 *
 * Key design decisions:
 * - Every table has user_id for RLS and future multi-user support
 * - All timestamps stored as UTC
 * - Foreign keys use ON DELETE CASCADE where appropriate
 * - Enums are PostgreSQL native enums for type safety
 *
 * Reference: PRD Section 7 (Database Architecture)
 */
import {
  pgTable,
  uuid,
  text,
  timestamp,
  date,
  time,
  integer,
  boolean,
  decimal,
  jsonb,
  pgEnum,
  unique,
  check,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

/* ============================================================
 * ENUMS — PostgreSQL native enums for type safety
 * ============================================================ */

/** Class category options — PRD Section 7.2 */
export const classCategoryEnum = pgEnum("class_category", [
  "Core",
  "Minor",
  "Elective",
  "Other",
]);

/** Class occurrence status — tracks individual class instance states */
export const occurrenceStatusEnum = pgEnum("occurrence_status", [
  "scheduled",
  "cancelled",
  "extra",
  "rescheduled",
]);

/** Attendance marking status — PRD Section 13.1 */
export const attendanceStatusEnum = pgEnum("attendance_status", [
  "present",
  "absent",
  "cancelled",
]);

/** Official letter grades — PRD Section 16.1 (10-point grading scale) */
export const letterGradeEnum = pgEnum("letter_grade", [
  "AA",
  "AB",
  "BB",
  "BC",
  "CC",
  "CD",
  "DD",
  "FF",
]);

/* ============================================================
 * TABLES
 * ============================================================ */

/**
 * Semesters Table
 *
 * Stores all academic semesters (active, completed, upcoming).
 * Only one semester can be active at a time (enforced via application logic).
 * Color is user-assigned and propagates to classes by default.
 *
 * Reference: PRD Section 7.2, Section 9.5 (Semester Cards), Section 10
 */
export const semesters = pgTable("semesters", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  /** Hex color string (e.g. "#a855f7") — used for card gradients & glowing borders */
  color: text("color").notNull(),
  /** Auto-calculated from classes, but user can manually override */
  credits: integer("credits").default(0),
  creditsManualOverride: boolean("credits_manual_override").default(false),
  /** Only one semester can be active at a time — PRD Section 7.3 */
  isActive: boolean("is_active").default(false),
  isCompleted: boolean("is_completed").default(false),
  /** Rich text notes — auto-saved with debounce — PRD Section 10.9 */
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * Official Semester Grades
 *
 * Stores the official SPI after a semester is completed and letter grades entered.
 * One record per completed semester.
 *
 * Reference: PRD Section 16.3 (Official SPI)
 */
export const officialSemesterGrades = pgTable("official_semester_grades", {
  id: uuid("id").defaultRandom().primaryKey(),
  semesterId: uuid("semester_id")
    .notNull()
    .references(() => semesters.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull(),
  /** Calculated as Σ(grade_points × credits) / Σ(credits) */
  spi: decimal("spi", { precision: 4, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * Classes Table
 *
 * Represents a subject/course within a semester.
 * Each class belongs to exactly one semester.
 * Color defaults to semester color but can be overridden.
 *
 * Reference: PRD Section 7.2, Section 10.5 (Class Cards), Section 11
 */
export const classes = pgTable("classes", {
  id: uuid("id").defaultRandom().primaryKey(),
  semesterId: uuid("semester_id")
    .notNull()
    .references(() => semesters.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  /** Hex color — defaults to semester color, overridable per class */
  color: text("color").notNull(),
  category: classCategoryEnum("category").notNull(),
  credits: integer("credits").notNull(),
  /** Defaults to semester start date */
  startDate: date("start_date").notNull(),
  /** Defaults to semester end date */
  endDate: date("end_date").notNull(),
  /** Rich text notes — auto-saved — PRD Section 11.15 */
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * Class Schedule Slots
 *
 * Recurring weekly time slots for a class.
 * valid_from and valid_until support mid-semester schedule changes.
 * When a schedule changes mid-semester, the old slot gets valid_until set
 * and a new slot is created with the new valid_from date.
 *
 * Reference: PRD Section 7.2, Section 12.5 (Recurrence)
 */
export const classScheduleSlots = pgTable("class_schedule_slots", {
  id: uuid("id").defaultRandom().primaryKey(),
  classId: uuid("class_id")
    .notNull()
    .references(() => classes.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull(),
  /** 0 = Sunday, 1 = Monday, ..., 6 = Saturday */
  dayOfWeek: integer("day_of_week").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  /** Physical location (e.g. "LA001", "Room B204") */
  location: text("location"),
  /** Start of validity — required, supports mid-semester changes */
  validFrom: date("valid_from").notNull(),
  /** End of validity — null means active until semester end */
  validUntil: date("valid_until"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * Class Occurrences
 *
 * Individual instances of scheduled class slots.
 * Generated from recurring rules (rrule.js) or created manually (extra classes).
 * Each occurrence can be individually cancelled or rescheduled without
 * affecting the recurring pattern.
 *
 * Reference: PRD Section 7.2, Section 12.5 (Recurrence), Section 13
 */
export const classOccurrences = pgTable("class_occurrences", {
  id: uuid("id").defaultRandom().primaryKey(),
  classId: uuid("class_id")
    .notNull()
    .references(() => classes.id, { onDelete: "cascade" }),
  /** Nullable for extra classes that aren't tied to a recurring slot */
  scheduleSlotId: uuid("schedule_slot_id").references(
    () => classScheduleSlots.id
  ),
  userId: uuid("user_id").notNull(),
  occurrenceDate: date("occurrence_date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  location: text("location"),
  status: occurrenceStatusEnum("status").default("scheduled").notNull(),
  /** True for one-time extra classes added via FAB */
  isExtra: boolean("is_extra").default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * Attendance Table
 *
 * Records attendance for each class occurrence.
 * Unique constraint on (occurrence_id, user_id) prevents duplicates.
 * Updates to existing records are handled via upsert.
 *
 * Reference: PRD Section 7.2, Section 13 (Attendance System)
 */
export const attendance = pgTable(
  "attendance",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    occurrenceId: uuid("occurrence_id")
      .notNull()
      .references(() => classOccurrences.id, { onDelete: "cascade" }),
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    status: attendanceStatusEnum("status").notNull(),
    markedAt: timestamp("marked_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    /** Prevents duplicate attendance records per occurrence per user */
    uniqueOccurrenceUser: unique("unique_occurrence_user").on(
      table.occurrenceId,
      table.userId
    ),
  })
);

/**
 * Attendance Edit History
 *
 * Logs every change to an attendance record for audit trail.
 * Viewable per occurrence in the attendance history table.
 *
 * Reference: PRD Section 7.2, Section 13.2 (Edit History)
 */
export const attendanceEditHistory = pgTable("attendance_edit_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  attendanceId: uuid("attendance_id")
    .notNull()
    .references(() => attendance.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull(),
  previousStatus: attendanceStatusEnum("previous_status").notNull(),
  newStatus: attendanceStatusEnum("new_status").notNull(),
  changedAt: timestamp("changed_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  reason: text("reason"),
});

/**
 * Tasks Table
 *
 * Stores both regular tasks and assignments.
 * Tasks can be standalone (semester-level) or linked to a class.
 * Assignments are tasks with is_assignment = true + submission tracking.
 *
 * Reference: PRD Section 7.2, Section 14 (Tasks & Assignments)
 */
export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** Nullable — standalone tasks belong only to a semester */
    classId: uuid("class_id").references(() => classes.id, {
      onDelete: "cascade",
    }),
    semesterId: uuid("semester_id")
      .notNull()
      .references(() => semesters.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    name: text("name").notNull(),
    /** Optional deadline — tasks without deadlines don't appear on calendar */
    deadline: timestamp("deadline", { withTimezone: true }),
    isCompleted: boolean("is_completed").default(false),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    /** Only relevant for assignments (is_assignment = true) */
    marksScored: decimal("marks_scored", { precision: 6, scale: 2 }),
    totalMarks: decimal("total_marks", { precision: 6, scale: 2 }),
    isAssignment: boolean("is_assignment").default(false),
    isSubmitted: boolean("is_submitted").default(false),
    /** Optional link to an exam — deletion warning shown if set */
    linkedExamId: uuid("linked_exam_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    /** Marks scored cannot exceed total marks — PRD Section 7.3 */
    marksCheck: check(
      "marks_check",
      sql`${table.marksScored} IS NULL OR ${table.totalMarks} IS NULL OR ${table.marksScored} <= ${table.totalMarks}`
    ),
  })
);

/**
 * Exams Table
 *
 * Stores all exams/tests for each class.
 * Weightage represents the percentage this exam contributes
 * to the overall class grade.
 *
 * Reference: PRD Section 7.2, Section 15 (Exams & Grades)
 */
export const exams = pgTable(
  "exams",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    name: text("name").notNull(),
    examDate: date("exam_date").notNull(),
    /** Nullable until marks are entered */
    marksScored: decimal("marks_scored", { precision: 6, scale: 2 }),
    totalMarks: decimal("total_marks", { precision: 6, scale: 2 }).notNull(),
    /** Percentage weightage (e.g. 30 for 30%) */
    weightage: decimal("weightage", { precision: 5, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    /** Marks scored cannot exceed total marks — PRD Section 7.3 */
    marksCheck: check(
      "exam_marks_check",
      sql`${table.marksScored} IS NULL OR ${table.marksScored} <= ${table.totalMarks}`
    ),
  })
);

/**
 * Syllabus Rubric
 *
 * Optional grading structure for a class.
 * Stores components like "Midsem 30%, Endsem 50%, Quizzes 20%".
 * Used by the grade calculator to project required scores.
 *
 * Reference: PRD Section 7.2, Section 11.17 (Grade Calculator)
 */
export const syllabusRubric = pgTable("syllabus_rubric", {
  id: uuid("id").defaultRandom().primaryKey(),
  classId: uuid("class_id")
    .notNull()
    .references(() => classes.id, { onDelete: "cascade" })
    .unique(),
  userId: uuid("user_id").notNull(),
  /** JSON array of {name: string, weightage_percent: number} */
  components: jsonb("components")
    .$type<Array<{ name: string; weightage_percent: number }>>()
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * Letter Grades
 *
 * Official letter grades entered per class after semester completion.
 * Grade points are auto-derived from the grade value.
 * Used to calculate official SPI and running CGPA.
 *
 * Reference: PRD Section 7.2, Section 16 (CGPA & SPI System)
 */
export const letterGrades = pgTable("letter_grades", {
  id: uuid("id").defaultRandom().primaryKey(),
  classId: uuid("class_id")
    .notNull()
    .references(() => classes.id, { onDelete: "cascade" })
    .unique(),
  semesterId: uuid("semester_id")
    .notNull()
    .references(() => semesters.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull(),
  grade: letterGradeEnum("grade").notNull(),
  /** Auto-derived: AA=10, AB=9, BB=8, BC=7, CC=6, CD=5, DD=4, FF=0 */
  gradePoints: decimal("grade_points", { precision: 4, scale: 1 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * Non-Academic Events
 *
 * Personal events not related to academics.
 * Shown on calendar but strictly excluded from all attendance and academic stats.
 *
 * Reference: PRD Section 7.2, Section 12.4 (Calendar Event Types)
 */
export const nonAcademicEvents = pgTable("non_academic_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  /** Nullable — event can exist without a semester context */
  semesterId: uuid("semester_id").references(() => semesters.id, {
    onDelete: "cascade",
  }),
  name: text("name").notNull(),
  eventDate: date("event_date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  location: text("location"),
  /** Optional custom color — if null, uses default distinct style */
  color: text("color"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * Files Table (Laptop Only)
 *
 * Stores serialized FileSystemFileHandle references for files
 * linked to a class. No actual file content is stored — only the handle
 * reference which allows the browser to re-access the file.
 *
 * Reference: PRD Section 7.2, Section 18 (File System)
 */
export const files = pgTable("files", {
  id: uuid("id").defaultRandom().primaryKey(),
  classId: uuid("class_id")
    .notNull()
    .references(() => classes.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull(),
  /** User-defined display name (not the actual filename) */
  displayName: text("display_name").notNull(),
  /** Serialized FileSystemFileHandle — stored as JSON text */
  fileHandleSerialized: text("file_handle_serialized"),
  /** Integer for drag-to-reorder ordering */
  sortOrder: integer("sort_order").default(0),
  /** Whether the stored handle is still valid/accessible */
  handleValid: boolean("handle_valid").default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/* ============================================================
 * RELATIONS — Drizzle relational query support
 * ============================================================ */

/** Semester has many classes, tasks, exams, events, grades */
export const semestersRelations = relations(semesters, ({ many }) => ({
  classes: many(classes),
  tasks: many(tasks),
  officialGrades: many(officialSemesterGrades),
  letterGrades: many(letterGrades),
  nonAcademicEvents: many(nonAcademicEvents),
}));

/** Class belongs to semester, has many slots, occurrences, attendance, tasks, exams, files */
export const classesRelations = relations(classes, ({ one, many }) => ({
  semester: one(semesters, {
    fields: [classes.semesterId],
    references: [semesters.id],
  }),
  scheduleSlots: many(classScheduleSlots),
  occurrences: many(classOccurrences),
  attendance: many(attendance),
  tasks: many(tasks),
  exams: many(exams),
  syllabusRubric: many(syllabusRubric),
  letterGrade: many(letterGrades),
  files: many(files),
}));

/** Schedule slot belongs to class, has many occurrences */
export const classScheduleSlotsRelations = relations(
  classScheduleSlots,
  ({ one, many }) => ({
    class_: one(classes, {
      fields: [classScheduleSlots.classId],
      references: [classes.id],
    }),
    occurrences: many(classOccurrences),
  })
);

/** Occurrence belongs to class and schedule slot, has one attendance record */
export const classOccurrencesRelations = relations(
  classOccurrences,
  ({ one, many }) => ({
    class_: one(classes, {
      fields: [classOccurrences.classId],
      references: [classes.id],
    }),
    scheduleSlot: one(classScheduleSlots, {
      fields: [classOccurrences.scheduleSlotId],
      references: [classScheduleSlots.id],
    }),
    attendance: many(attendance),
  })
);

/** Attendance belongs to occurrence and class */
export const attendanceRelations = relations(attendance, ({ one, many }) => ({
  occurrence: one(classOccurrences, {
    fields: [attendance.occurrenceId],
    references: [classOccurrences.id],
  }),
  class_: one(classes, {
    fields: [attendance.classId],
    references: [classes.id],
  }),
  editHistory: many(attendanceEditHistory),
}));

/** Attendance edit history belongs to attendance record */
export const attendanceEditHistoryRelations = relations(
  attendanceEditHistory,
  ({ one }) => ({
    attendance: one(attendance, {
      fields: [attendanceEditHistory.attendanceId],
      references: [attendance.id],
    }),
  })
);

/** Task belongs to semester, optionally to class */
export const tasksRelations = relations(tasks, ({ one }) => ({
  class_: one(classes, {
    fields: [tasks.classId],
    references: [classes.id],
  }),
  semester: one(semesters, {
    fields: [tasks.semesterId],
    references: [semesters.id],
  }),
}));

/** Exam belongs to class */
export const examsRelations = relations(exams, ({ one }) => ({
  class_: one(classes, {
    fields: [exams.classId],
    references: [classes.id],
  }),
}));

/** Syllabus rubric belongs to class (one per class) */
export const syllabusRubricRelations = relations(syllabusRubric, ({ one }) => ({
  class_: one(classes, {
    fields: [syllabusRubric.classId],
    references: [classes.id],
  }),
}));

/** Letter grade belongs to class and semester */
export const letterGradesRelations = relations(letterGrades, ({ one }) => ({
  class_: one(classes, {
    fields: [letterGrades.classId],
    references: [classes.id],
  }),
  semester: one(semesters, {
    fields: [letterGrades.semesterId],
    references: [semesters.id],
  }),
}));

/** Official semester grade belongs to semester */
export const officialSemesterGradesRelations = relations(
  officialSemesterGrades,
  ({ one }) => ({
    semester: one(semesters, {
      fields: [officialSemesterGrades.semesterId],
      references: [semesters.id],
    }),
  })
);

/** Files belong to class */
export const filesRelations = relations(files, ({ one }) => ({
  class_: one(classes, {
    fields: [files.classId],
    references: [classes.id],
  }),
}));

/** Non-academic event optionally belongs to semester */
export const nonAcademicEventsRelations = relations(
  nonAcademicEvents,
  ({ one }) => ({
    semester: one(semesters, {
      fields: [nonAcademicEvents.semesterId],
      references: [semesters.id],
    }),
  })
);
