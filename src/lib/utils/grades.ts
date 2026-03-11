/**
 * Grade Point Mapping & CGPA/SPI Calculation Utilities
 *
 * Purpose: Provides all grade-related calculations used across the app.
 * Implements the 10-point grading scale specified in the PRD.
 *
 * Key formulas:
 * - Projected SPI: weighted average of (marks/total × 10) across exams
 * - Official SPI: Σ(grade_points × credits) / Σ(credits)
 * - Running CGPA: Σ(SPI × semester_credits) / Σ(all_credits)
 *
 * Reference: PRD Section 16 (CGPA & SPI System)
 */

/** Letter grade to grade point mapping — PRD Section 16.1 */
export const GRADE_POINTS: Record<string, number> = {
  AA: 10,
  AB: 9,
  BB: 8,
  BC: 7,
  CC: 6,
  CD: 5,
  DD: 4,
  FF: 0,
};

/** All valid letter grades in order */
export const LETTER_GRADES = [
  "AA",
  "AB",
  "BB",
  "BC",
  "CC",
  "CD",
  "DD",
  "FF",
] as const;

export type LetterGrade = (typeof LETTER_GRADES)[number];

/**
 * Converts a letter grade to its numeric grade point value.
 * @param grade - Letter grade string (e.g. "AA", "BB")
 * @returns Grade point value (0-10)
 */
export function gradeToPoints(grade: string): number {
  return GRADE_POINTS[grade] ?? 0;
}

/**
 * Calculates Projected SPI from exam data.
 * Formula: weighted average of (marks_scored / total_marks × 10)
 * where weights are exam weightages.
 *
 * @param exams - Array of exam objects with marks and weightage
 * @returns Projected SPI (0-10 scale) or null if no scorable exams
 *
 * Reference: PRD Section 16.2
 */
export function calculateProjectedSPI(
  exams: Array<{
    marksScored: number | null;
    totalMarks: number;
    weightage: number;
  }>
): number | null {
  /* Filter to exams that have scores entered */
  const scoredExams = exams.filter((e) => e.marksScored !== null);
  if (scoredExams.length === 0) return null;

  let weightedSum = 0;
  let totalWeightage = 0;

  for (const exam of scoredExams) {
    /* Calculate percentage and scale to 10-point: (marks/total) × 10 */
    const percentage = (exam.marksScored! / exam.totalMarks) * 10;
    weightedSum += percentage * exam.weightage;
    totalWeightage += exam.weightage;
  }

  if (totalWeightage === 0) return null;
  return Math.round((weightedSum / totalWeightage) * 100) / 100;
}

/**
 * Calculates Official SPI from letter grades and credits.
 * Formula: Σ(grade_points × credits) / Σ(credits)
 *
 * @param grades - Array of { grade, credits } for each class in a semester
 * @returns Official SPI (0-10 scale) or null if no grades
 *
 * Reference: PRD Section 16.3
 */
export function calculateOfficialSPI(
  grades: Array<{ grade: string; credits: number }>
): number | null {
  if (grades.length === 0) return null;

  let weightedSum = 0;
  let totalCredits = 0;

  for (const { grade, credits } of grades) {
    weightedSum += gradeToPoints(grade) * credits;
    totalCredits += credits;
  }

  if (totalCredits === 0) return null;
  return Math.round((weightedSum / totalCredits) * 100) / 100;
}

/**
 * Calculates Running CGPA from all completed semester SPIs.
 * Formula: Σ(SPI × semester_credits) / Σ(all_semester_credits)
 *
 * @param semesters - Array of { spi, totalCredits } for completed semesters
 * @returns Running CGPA (0-10 scale) or null if no completed semesters
 *
 * Reference: PRD Section 16.4
 */
export function calculateCGPA(
  semesters: Array<{ spi: number; totalCredits: number }>
): number | null {
  if (semesters.length === 0) return null;

  let weightedSum = 0;
  let totalCredits = 0;

  for (const { spi, totalCredits: credits } of semesters) {
    weightedSum += spi * credits;
    totalCredits += credits;
  }

  if (totalCredits === 0) return null;
  return Math.round((weightedSum / totalCredits) * 100) / 100;
}

/**
 * Calculates what score is needed on an upcoming exam to achieve a target grade.
 * Used by the Exam Score Predictor and Grade Calculator.
 *
 * @param currentExams - Exams already scored
 * @param targetPercentage - Target overall percentage (0-100)
 * @param upcomingExamWeightage - Weightage of the upcoming exam
 * @returns Required percentage on the upcoming exam, or null if impossible
 *
 * Reference: PRD Section 11.13 (Exam Score Predictor)
 */
export function calculateRequiredScore(
  currentExams: Array<{
    marksScored: number;
    totalMarks: number;
    weightage: number;
  }>,
  targetPercentage: number,
  upcomingExamWeightage: number
): number | null {
  /* Calculate already-achieved weighted percentage */
  let achievedWeighted = 0;

  for (const exam of currentExams) {
    const pct = (exam.marksScored / exam.totalMarks) * 100;
    achievedWeighted += pct * (exam.weightage / 100);
  }

  /* Required weighted percentage from the upcoming exam */
  const targetWeighted = targetPercentage;
  const remainingContribution = targetWeighted - achievedWeighted;
  const fractionalWeightage = upcomingExamWeightage / 100;

  if (fractionalWeightage === 0) return null;

  const requiredPercentage = remainingContribution / fractionalWeightage;

  /* Clamp and check feasibility */
  if (requiredPercentage > 100) return null; // impossible
  if (requiredPercentage < 0) return 0; // already achieved target

  return Math.round(requiredPercentage * 100) / 100;
}
