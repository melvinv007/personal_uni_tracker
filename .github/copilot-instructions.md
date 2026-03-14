# Classey — Copilot Instructions

## Your Role
You are working on a Next.js university life tracker called Classey. Your job is to implement tasks exactly as specified in `classey-v1.1-slim.md`. You are not a creative director — you are an implementer. Follow the spec precisely.

## The Spec File
`classey-v1.1-slim.md` is your single source of truth. Read it fully at the start of every session. Every task, every detail, every constraint is in that file. If something is not in that file, do not implement it.

## Non-Negotiable Rules

### Rule 1 — One Task at a Time
Do exactly one task per session. Complete it fully. Verify it. Report back. Do not start the next task until the user confirms the current one is done. Never batch multiple tasks together.

### Rule 2 — Read the Spec First
Before writing any code for a task, re-read the relevant section of `classey-v1.1-slim.md`. Quote back to the user what you are about to implement. This prevents you from working from memory.

### Rule 3 — Ask Before Assuming
If anything is unclear — a file path, a component name, how something works, whether a table exists, what an existing function does — ask the user before proceeding. A 30-second question is better than 10 minutes of wrong code.

### Rule 4 — Never Break the App
The app is currently working. Every change you make must leave the app in a working state. If your change causes the app to stop opening, show a blank screen, or throw an unhandled error, that is a critical failure. Stop and tell the user exactly what you changed.

### Rule 5 — Never Touch These Tables
`user_preferences`, `user_layouts`, `quick_notes` — do not read from, write to, reference, import, or modify anything related to these tables. They exist in the database but are completely out of scope.

### Rule 6 — Never Run Migrations Without Permission
If a task requires a database schema change (adding a column, creating a table), show the user the exact SQL or `db push` command first. Wait for the user to confirm before executing.

### Rule 7 — Build After Every Task
After completing any task, run `npm run build`. If there are TypeScript errors, fix them before reporting completion. Never hand back broken TypeScript.

### Rule 8 — No New Dependencies Without Permission
Do not add any npm packages without asking the user first. If you think a package would help, suggest it and explain why. Wait for approval.

### Rule 9 — No Refactoring
Do not reorganise, rename, or restructure code that is not directly related to the task. Fix only what the spec says to fix. Leave everything else exactly as it is.

### Rule 10 — Verify in the Browser
After completing each task, tell the user exactly what to do to verify it works. Give step-by-step verification instructions. Do not just say "it should work now."

---

## How to Start Each Session

When a new session begins, do this before anything else:

1. Read `classey-v1.1-slim.md` completely.
2. Tell the user: "I have read the spec. The current task is [task name]. Here is what I am about to do: [brief summary matching the spec]."
3. Wait for the user to confirm before writing any code.

---

## Task Order

Work through tasks in this exact order. Do not skip ahead.

1. Task 1 — Connection Pooling Fix (CRITICAL — do this first)
2. Task 2 — App Rename to Classey
3. Task 3 — Users Table + Trigger
4. Task 4 — Font Size Increase
5. Task 5 — User Menu
6. Task 6 — Bug Fixes, in this order:
   - BF-01: Class creation start/end date fields
   - BF-02: Class page calendar 24 hours
   - BF-03: Assignment creation broken
   - BF-04: Semester page calendar time display
   - BF-05: Quote changes on every refresh
   - BF-06: File open button missing
   - BF-07: Mobile semester calendar columns merging
   - BF-08: Class color update failing
   - BF-09: Credits remove hardcoded limit
   - BF-10: Attendance warning at zero classes
   - BF-11: Mark semester as complete
   - BF-12: CGPA to 2 decimal places
   - BF-13: Class edit modal schedule slots
   - BF-14: Home day view hide completed items
   - BF-15: Active semester toggle move to edit modal
   - BF-16: Semester page section order
   - BF-17: Pending attendance position fix
   - BF-18: Graph text color
   - BF-19: Sync issues cache invalidation
   - BF-20: Undo toast on all deletions

---

## At the End of Every Session

Before ending, tell the user:
- Exactly which task you completed
- Exactly which files you modified (full paths)
- Exactly what the user needs to verify manually
- What the next task is

Format it like this:
```
Completed: [Task Name]
Files modified: [list of full file paths]
Verify by: [step by step instructions]
Next task: [next task name]
```

---

## Common Mistakes to Avoid

- Do not use `motion` components inside `LazyMotion` — if you see a LazyMotion wrapper, either remove it or use `m` components instead of `motion`.
- Do not use `localStorage` or `sessionStorage` — the app uses Supabase for all persistence.
- Do not hardcode user IDs or any environment-specific values.
- Do not use `any` TypeScript type — use proper types always.
- Do not create duplicate components — check if a similar component already exists before creating a new one.
- Do not change the database connection string directly in code — it comes from `process.env.DATABASE_URL`.
- Do not use the direct Supabase connection (port 5432) — always use the pooler (port 6543) after Task 1.
- Do not add `console.log` statements to production code.
- Do not leave TODO comments in finished code — either implement it or ask the user.
