# Classey — v1.1 Slim Specification
## The single source of truth for all v1.1 work

---

## CRITICAL RULES — READ BEFORE TOUCHING ANY CODE

1. **Read this entire document before writing a single line of code.**
2. **Do exactly one task at a time.** Complete it fully, verify it works, then stop and report.
3. **Never assume.** If something is unclear after reading this document, ask the user before proceeding.
4. **Never modify the database schema directly** unless this document explicitly instructs you to. The only DB change in scope is creating a trigger — specified exactly in Section 4.
5. **These tables exist in the database but must be completely ignored.** Do not read from, write to, reference, import, or modify anything related to: `user_preferences`, `user_layouts`, `quick_notes`. Pretend they do not exist.
6. **Do not introduce any new dependencies** (npm packages) without asking the user first.
7. **Do not refactor or reorganise code** that is not directly related to the task at hand. Fix only what is broken. Leave everything else exactly as it is.
8. **After completing each task**, run `npm run build` to verify there are no TypeScript errors before reporting completion.
9. **Performance is critical.** Do not add any synchronous blocking operations, unnecessary re-renders, or unoptimised database queries.
10. **If the app stops opening or shows a blank screen at any point**, stop immediately and tell the user exactly what you changed so it can be reverted.

---

## Table of Contents

1. [Current State of the Project](#1-current-state-of-the-project)
2. [Task 1 — Connection Pooling Fix (DO THIS FIRST)](#2-task-1--connection-pooling-fix-do-this-first)
3. [Task 2 — App Rename to Classey](#3-task-2--app-rename-to-classey)
4. [Task 3 — Users Table + Trigger](#4-task-3--users-table--trigger)
5. [Task 4 — Font Size Increase](#5-task-4--font-size-increase)
6. [Task 5 — User Menu](#6-task-5--user-menu)
7. [Task 6 — Bug Fixes (BF-01 through BF-20)](#7-task-6--bug-fixes)
8. [Database Reference](#8-database-reference)
9. [What Must Never Be Changed](#9-what-must-never-be-changed)

---

## 1. Current State of the Project

- The app is a Next.js 14 (App Router) university life tracker called "Tracker" (being renamed to "Classey").
- Tech stack: Next.js 14, TypeScript (strict), Tailwind CSS, Framer Motion, React Hook Form + Zod, TanStack Query, Zustand, Drizzle ORM, Supabase (PostgreSQL + Google OAuth + RLS).
- The v1 codebase is fully working and the app opens correctly.
- The Supabase database has the following tables currently: `attendance`, `attendance_edit_history`, `class_occurrences`, `class_schedule_slots`, `classes`, `exams`, `files`, `letter_grades`, `non_academic_events`, `official_semester_grades`, `quick_notes`, `semesters`, `syllabus_rubric`, `tasks`, `user_layouts`, `user_preferences`, `users`.
- The `users` table exists in the database but is NOT referenced anywhere in the codebase. This needs to be wired up in Task 3.
- The `user_preferences`, `user_layouts`, `quick_notes` tables exist in the database but must be completely ignored in this v1.1 scope.
- The app is currently slow due to a database connection pooling issue. Fix this first in Task 1.

---

## 2. Task 1 — Connection Pooling Fix (DO THIS FIRST)

**Priority: CRITICAL. Fix this before anything else. The app's performance depends on this.**

### Problem
The app is connecting to Supabase using the direct connection string (port 5432). In a serverless Next.js environment, each API route opens a new database connection. With many API routes firing simultaneously on page load, this exhausts the connection pool and causes `MaxClientsInSessionMode: max clients reached` errors and severe slowness.

### Solution
Switch to Supabase's Transaction Pooler connection string (port 6543).

### Exact Steps

**Step 1 — Find the database client file.**
Look for the file where the Drizzle + postgres.js client is initialised. It will look something like this:
```typescript
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'

const client = postgres(process.env.DATABASE_URL!)
export const db = drizzle(client)
```

**Step 2 — Update the client to use connection pooling.**
Replace with exactly this:
```typescript
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'

const client = postgres(process.env.DATABASE_URL!, {
  max: 1,           // Critical for serverless — one connection per function instance
  prepare: false,   // Required for pgBouncer/Supabase pooler compatibility
})
export const db = drizzle(client)
```

**Step 3 — Update the DATABASE_URL in .env.local.**
The user must manually do this step:
- Go to Supabase Dashboard → Project Settings → Database
- Find "Connection string" section
- Select "Transaction pooler" mode (NOT "Direct connection", NOT "Session pooler")
- Copy the connection string — it will use port **6543**
- Replace the current `DATABASE_URL` in `.env.local` with this new string
- The new URL format looks like: `postgresql://postgres.xxxx:password@aws-0-region.pooler.supabase.com:6543/postgres`
- Add `?pgbouncer=true` to the end of the URL if it is not already there

**Step 4 — Update drizzle.config.ts.**
Make sure `drizzle.config.ts` also uses the same `DATABASE_URL`. It should already be using the env var, but confirm it is not hardcoded to a different URL.

**Step 5 — Verify.**
After making these changes, restart the dev server (`npm run dev`) and open the app. All API routes should now respond quickly without connection errors. If you still see `MaxClientsInSessionMode` errors, stop and tell the user.

### What NOT to change
- Do not change any SQL queries.
- Do not change any Drizzle schema files.
- Do not change any API route logic.
- Only change the database client initialisation and the env var.

---

## 3. Task 2 — App Rename to Classey

### What to change
Find and replace every instance of "Tracker" (the app name, not variable names or other words) with "Classey" in the following locations:

1. **`/app/layout.tsx`** — the `<title>` tag and any metadata `title` fields. Change "Tracker" to "Classey".
2. **`/public/manifest.json`** — `name` and `short_name` fields. Change to "Classey".
3. **Any visible UI text** — search the entire codebase for strings like `"Tracker"` or `>Tracker<` that appear as visible text in the UI (headings, login page subtitle, footer, etc.). Change each to "Classey".
4. **`/README.md`** — change the app name if present.
5. **`next.config.js` or `next.config.ts`** — if the app name appears there.
6. **`package.json`** — the `"name"` field at the top.

### What NOT to change
- Do not rename any files.
- Do not rename any variables, functions, or components that happen to contain the word "tracker" in camelCase or snake_case (e.g. `useTracker`, `trackerStore`). Only change visible user-facing text strings.
- Do not change folder names.
- Do not change import paths.

### Verification
After making changes, search the entire codebase for the string "Tracker" and confirm no user-visible instances remain. Variable names and file names containing "tracker" are fine to leave.

---

## 4. Task 3 — Users Table + Trigger

### Current State
The `users` table already exists in the Supabase database with this schema:
```sql
CREATE TABLE public.users (
  id uuid NOT NULL,
  email text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  last_sign_in timestamp with time zone,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
```
It is completely empty and not referenced anywhere in the codebase.

### What Needs to Be Done

**Part A — Create the Supabase trigger (SQL only, run in Supabase SQL Editor)**

The user needs to run this SQL in Supabase Dashboard → SQL Editor:

```sql
-- Function to upsert user on sign in
CREATE OR REPLACE FUNCTION public.handle_user_upsert()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at, last_sign_in)
  VALUES (
    NEW.id,
    NEW.email,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    last_sign_in = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger that fires on every sign in
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
CREATE TRIGGER on_auth_user_login
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_upsert();
```

Provide this SQL to the user and instruct them to run it manually in Supabase SQL Editor. Do not attempt to run this from the codebase.

**Part B — Add RLS policy to users table**

The user also needs to run this SQL:
```sql
-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can only read their own row
CREATE POLICY "Users can read own row" ON public.users
  FOR SELECT USING (auth.uid() = id);
```

**Part C — Add Drizzle schema definition for users table**

Find the Drizzle schema file (likely `src/db/schema.ts` or similar). Add the users table definition:

```typescript
export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: text('email'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  lastSignIn: timestamp('last_sign_in', { withTimezone: true }),
})
```

**Important:** Do NOT run `drizzle-kit push` or any migration after adding this. The table already exists in the database. You are only adding the TypeScript schema definition so it can be queried. Running a migration could cause conflicts.

**Part D — Create a simple API route to fetch current user**

Create `/src/app/api/me/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { db } from '@/db' // adjust import path to match project
import { users } from '@/db/schema' // adjust import path to match project
import { eq } from 'drizzle-orm'

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  return NextResponse.json({ user: user[0] ?? null })
}
```

**Verification**
After completing all parts, sign out and sign back in with Google. Then check the Supabase dashboard → Table Editor → users table. A row should appear with your email and timestamps. If no row appears, the trigger did not fire correctly.

---

## 5. Task 4 — Font Size Increase

### What to change
This is a single change. Find the global CSS file (likely `src/app/globals.css` or `src/styles/globals.css`). 

Find the `:root` or `html` or `body` selector. Change the base font size to 18px:

```css
html {
  font-size: 18px;
}
```

If a font-size is already set on `html` or `body`, change it to 18px. If none exists, add it to the `html` selector.

That is the entire task. Do not change any other font sizes anywhere else. Do not add any font size settings or toggles. Do not touch any component files.

### Verification
Open the app and confirm text is slightly larger than before. The change should be subtle — not dramatically different.

---

## 6. Task 5 — User Menu

### Overview
Add a circular avatar in the top right corner of every page. Clicking it opens a small dropdown menu with the user's email and a Log Out button.

### Avatar
- Use DiceBear avatars via their URL API: `https://api.dicebear.com/7.x/avataaars/svg?seed=[userId]`
- The `userId` is the Supabase user ID from the auth session.
- The avatar is a circle, approximately 36x36px.
- It must appear on every page: home, semester page, class page, and any other pages that exist.

### Dropdown Menu
- Opens when the user clicks the avatar circle.
- Positioned directly below the avatar.
- Contains exactly two items:
  1. The user's email address — displayed as plain text, greyed out, not clickable.
  2. "Log Out" button — clicking this calls Supabase `signOut()` and redirects to the login page.
- Closes when the user clicks anywhere outside the menu.
- Closes when the user presses Escape.
- The menu has a dark background matching the app theme, with a subtle border.

### Implementation

**Step 1 — Create the UserMenu component.**

Create a new file at `/src/components/ui/user-menu.tsx`:

```typescript
'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Image from 'next/image'

interface UserMenuProps {
  userId: string
  email: string
}

/**
 * UserMenu — circular DiceBear avatar with dropdown showing email and log out.
 * Appears in the top right corner of every page.
 */
export function UserMenu({ userId, email }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  async function handleLogOut() {
    await supabase.auth.signOut()
    router.push('/auth/login') // adjust path to match project login route
    router.refresh()
  }

  return (
    <div ref={menuRef} className="relative">
      {/* Avatar button */}
      <button
        onClick={() => setOpen(prev => !prev)}
        className="w-9 h-9 rounded-full overflow-hidden border border-white/10 hover:border-white/30 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
        aria-label="User menu"
      >
        <img
          src={avatarUrl}
          alt="User avatar"
          width={36}
          height={36}
          className="w-full h-full object-cover bg-neutral-800"
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-white/10 bg-neutral-950 shadow-xl z-50 overflow-hidden">
          {/* Email */}
          <div className="px-4 py-3 border-b border-white/10">
            <p className="text-xs text-neutral-400 truncate">{email}</p>
          </div>
          {/* Log Out */}
          <button
            onClick={handleLogOut}
            className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/5 transition-colors"
          >
            Log Out
          </button>
        </div>
      )}
    </div>
  )
}
```

**Step 2 — Get the user session in each page layout.**

The `UserMenu` component needs `userId` and `email` props. These come from the Supabase auth session.

Find the server component or layout for each page (home, semester, class). In each one, get the session like this:

```typescript
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Inside the server component:
const supabase = createServerComponentClient({ cookies })
const { data: { session } } = await supabase.auth.getSession()
```

Then pass `session.user.id` and `session.user.email` to the `UserMenu` component.

**Step 3 — Add UserMenu to every page.**

In each page layout, add the `UserMenu` component in the top right corner. The exact positioning:

```tsx
<div className="fixed top-4 right-4 z-50">
  <UserMenu userId={session.user.id} email={session.user.email ?? ''} />
</div>
```

Use `position: fixed` so it stays in the corner regardless of scroll position.

Add it to: home page, semester page, class page, and any other authenticated pages that exist in the project.

**Step 4 — Make sure the avatar SVG loads correctly.**

The DiceBear URL returns an SVG. Use a regular `<img>` tag (not Next.js `<Image>`) for external SVG URLs to avoid configuration issues. The component above already does this correctly.

### Verification
1. Log in and confirm the avatar appears in the top right corner.
2. Click the avatar — the dropdown should appear with your email and Log Out button.
3. Click outside the dropdown — it should close.
4. Press Escape — it should close.
5. Click Log Out — you should be redirected to the login page.
6. Navigate to a different page — the avatar should still be in the top right corner.

---

## 7. Task 6 — Bug Fixes

**Important rules for all bug fixes:**
- Fix them one at a time. Complete BF-01 fully before starting BF-02.
- After each fix, test it manually in the browser before moving on.
- Do not fix multiple bugs in a single edit session.
- Do not change anything outside the specific files related to the bug being fixed.

---

### BF-01: Class Creation — Missing Start/End Date Fields

**Problem:** The class creation modal does not show start date and end date fields. Classes are created without these fields populated correctly.

**Fix:**
1. Find the class creation modal/form component.
2. Add two date input fields: "Start Date" and "End Date".
3. Default values: start date defaults to the parent semester's start date, end date defaults to the parent semester's end date. These values must be passed into the modal as props from wherever the semester data is available.
4. Both fields must be editable — the user can change them from the defaults.
5. Use whatever date input method is already used elsewhere in the project (native `<input type="date">` or an existing date picker component).
6. Add Zod validation: end date must be after or equal to start date. Show an inline error message below the end date field if this is violated.
7. Make sure the start and end date values are sent to the API when the form is submitted.
8. Make sure the API route that creates a class actually saves these values to the database.

**Verification:** Create a new class. Confirm start and end date fields are visible with semester dates as defaults. Change the end date to before the start date and confirm an error appears. Submit the form and confirm the dates are saved correctly in the database.

---

### BF-02: Class Page Calendar — Expand to Full 24 Hours

**Problem:** The calendar on the class page only shows a limited time range (e.g. 6am to 10pm) instead of the full 24 hours.

**Fix:**
1. Find the FullCalendar instance on the class page.
2. Set `slotMinTime="00:00:00"` and `slotMaxTime="24:00:00"` on the FullCalendar component.
3. Keep the existing behaviour of auto-scrolling to the current time on load (`scrollTime` prop set to current time).
4. Do not change any other FullCalendar settings.

**Verification:** Open a class page. The calendar should now show all 24 hours, starting from midnight.

---

### BF-03: Assignment Creation Broken

**Problem:** The + button in the assignments section does not open the assignment creation modal. Clicking it does nothing or throws an error.

**Fix:**
1. Find the assignments section component on the class page.
2. Find the + button and identify why it is not triggering the modal. Check: is the onClick handler missing? Is the modal state not being set? Is there a JavaScript error?
3. Fix the root cause so clicking + opens the assignment creation modal.
4. Make sure the assignment creation modal has all required fields: name (required), deadline (optional, datetime), marks scored (optional, number), total marks (optional, number), is_submitted toggle.
5. Add validation: if both marks scored and total marks are provided, marks scored cannot exceed total marks. Show inline error if violated.
6. Make sure the `is_assignment` field is set to `true` when creating from the assignments section.
7. Make sure submitting the form creates the assignment correctly via the API and the list updates immediately (optimistic update or query invalidation).

**Verification:** Go to a class page. Click the + button in the assignments section. The modal should open. Fill in the fields and submit. The new assignment should appear in the list immediately.

---

### BF-04: Semester Page Calendar — Missing Time Display

**Problem:** The semester page calendar does not show time labels (hour markers on the left side) and event blocks do not have correct heights proportional to their duration.

**Fix:**
1. Find the calendar component used on the semester page.
2. If it is a custom component (not FullCalendar), assess whether it is feasible to fix the time labels and proportional heights. If it requires a complete rewrite, replace it with a FullCalendar instance matching the style already used on the class page.
3. If using FullCalendar: ensure `view="timeGridWeek"` is set, `slotMinTime="00:00:00"`, `slotMaxTime="24:00:00"`, and the time column is visible.
4. Time labels should show on the left side (e.g. 8am, 9am, 10am).
5. Event blocks must have heights proportional to their duration — a 2-hour event should be twice the height of a 1-hour event.

**Verification:** Go to a semester page. The calendar should show time labels on the left and events with proportional heights.

---

### BF-05: Quote — Change on Every Refresh

**Problem:** The motivational quote on the home page changes daily but the spec requires it to change on every page load/refresh.

**Fix:**
1. Find where the quote is selected/displayed on the home page.
2. Remove any date-based selection logic.
3. Replace with: `const quote = quotes[Math.floor(Math.random() * quotes.length)]`
4. This must be evaluated on every render — not cached, not memoised with a static value.
5. The quotes array should remain hardcoded in the codebase. If there are fewer than 30 quotes, add more until there are at least 30. All quotes must be relevant to studying, productivity, or university life.

**Verification:** Load the home page, note the quote. Refresh the page. The quote should be different (it may occasionally be the same by chance but should usually change).

---

### BF-06: File Open Button Missing

**Problem:** Files added via the File System Access API have no visible button to open/launch them. Users cannot open their linked files.

**Fix:**
1. Find the files section component on the class page.
2. Each file entry must have a clearly visible "Open" button. It must always be visible — not hidden behind a hover state or a menu.
3. On click, the open button must:
   - Call `fileHandle.getFile()` to get the File object
   - Create an object URL: `const url = URL.createObjectURL(file)`
   - Open it: `window.open(url)`
4. If the file handle permission has been revoked (browser restart, OS permission change), calling `fileHandle.getFile()` will throw an error. In this case:
   - Catch the error
   - Replace the "Open" button with a "Re-verify Access" button
   - Clicking "Re-verify Access" calls `fileHandle.requestPermission({ mode: 'read' })`
   - If permission is granted, proceed to open the file
   - If permission is denied, show an inline error message: "Permission denied. Please re-add this file."
5. The handle validity state should be stored in the `files` table's `handle_valid` column (this column already exists in the schema).

**Verification:** Add a file via the file picker. Confirm the "Open" button is visible. Click it — the file should open in a new tab or the system default application.

---

### BF-07: Mobile Semester Calendar — Columns Merging

**Problem:** On mobile devices, the semester page calendar renders a full 7-column week grid. The columns are too narrow and merge visually, making the calendar unusable on mobile.

**Fix:**
1. Find the semester page calendar component.
2. On mobile (screens below `lg` breakpoint, which is 1024px in Tailwind), the 7-column week grid must be replaced with a swipeable day strip layout.
3. The mobile layout:
   - Shows a horizontal row of day buttons at the top (Mon, Tue, Wed, Thu, Fri, Sat, Sun or similar).
   - The current day is highlighted.
   - Tapping a day shows that day's events in a simple vertical list below.
   - The full week grid is completely hidden on mobile.
4. On desktop (1024px and above), the full week grid continues to show as normal.
5. Use Tailwind's responsive classes (`hidden lg:block`, `block lg:hidden`) to show/hide the appropriate layout.

**Verification:** Open the semester page on a mobile device or using browser DevTools mobile emulation. The calendar should show the day strip layout, not the week grid.

---

### BF-08: Class Color Update Failing

**Problem:** When updating a class's color in the edit modal, the API returns a "Failed to update" error and the color does not change.

**Fix:**
1. Find the class edit modal and the API route for updating a class (`PATCH /api/classes/[id]` or similar).
2. Debug the issue:
   - Check that the `color` field is included in the PATCH request body.
   - Check that the API route's Zod schema accepts the `color` field.
   - Check that the Drizzle update query includes the `color` field.
   - Check that the RLS policy on the `classes` table allows UPDATE for the authenticated user.
3. Fix whatever is causing the update to fail.
4. After fixing, ensure the color change:
   - Updates optimistically in the UI before the server responds (the class card should change color immediately).
   - Propagates to the class card gradient and border color.
   - Propagates to calendar event blocks for that class.
5. On error, roll back the optimistic update and show a toast error message.

**Verification:** Open a class edit modal. Change the color. Save. The class card should immediately show the new color without a page refresh.

---

### BF-09: Credits — Remove Hardcoded Limit

**Problem:** The credits input field has a hardcoded maximum (e.g. 20) that prevents entering valid credit values above that limit.

**Fix:**
1. Find all places where the credits field is defined or validated: the class creation form, the class edit form, and any Zod schemas.
2. Remove any hardcoded maximum.
3. Set the constraints to: minimum 0, maximum 35.
4. The credits field must be a free number input — not a slider or stepper. The user types the number directly.
5. Update the Zod schema to: `credits: z.number().min(0).max(35)`
6. Show an inline error if the value is below 0 or above 35.

**Verification:** Open the class creation modal. Try entering 0 — it should be accepted. Try entering 35 — it should be accepted. Try entering 36 — it should show an error. Try entering -1 — it should show an error.

---

### BF-10: Attendance Warning Showing at Zero Classes

**Problem:** Attendance warnings, survival calculators, and bunk planners show up even when a class has zero recorded occurrences, showing meaningless or incorrect data.

**Fix:**
1. Find the attendance warning component(s) on the class page. This includes: the warning card ("Don't skip!"), the skip safety indicator, the survival calculator, and the bunk planner.
2. Add a guard condition at the top of each of these components.
3. The guard: if `totalOccurrences === 0` OR if no past class occurrences exist (all occurrences are in the future), render `null` — return nothing, show nothing.
4. The condition must check actual past occurrences, not just whether any occurrences are scheduled. A class that has future occurrences but no past ones should still hide the attendance warnings.
5. Do not show an empty state placeholder — just show nothing at all.

**Verification:** Create a new class with no attendance records. The class page should show no attendance warnings at all. Add an attendance record for a past date. The warnings should now appear.

---

### BF-11: Mark Semester as Complete

**Problem:** There is no way to mark a semester as complete. The `is_completed` column exists in the database but there is no UI to set it.

**Fix:**
1. Find the semester edit modal.
2. Add a "Mark as Complete" button inside the modal (not on the card itself).
3. When clicked:
   - Set `is_completed = true` in the database via the semester update API.
   - The semester card updates to show a "Completed" status badge.
   - The active semester toggle (if present in the modal) is disabled/hidden for completed semesters — a completed semester cannot be made active.
4. Also add an "Unmark as Complete" button that appears when `is_completed === true`, which sets `is_completed = false`.
5. The semester must remain fully editable after being marked complete — nothing else is locked.
6. Update the API route to accept `is_completed` in the update payload.
7. Update the Zod schema to include `is_completed: z.boolean().optional()`.

**Verification:** Open a semester edit modal. Click "Mark as Complete". Close the modal. The semester card should show a completed badge. Reopen the modal and click "Unmark as Complete". The badge should disappear.

---

### BF-12: CGPA Precision

**Problem:** The CGPA value is not consistently displayed to exactly 2 decimal places. It may show as "8.7" instead of "8.70" or "9" instead of "9.00".

**Fix:**
1. Search the entire codebase for every place where CGPA or SPI is displayed to the user.
2. At each location, ensure the value is formatted with exactly 2 decimal places using `value.toFixed(2)`.
3. This applies to: home page CGPA display, semester page projected SPI, any analytics or stats sections, any widget that shows CGPA.
4. The fix is purely cosmetic — do not change any calculation logic.

**Verification:** Check the CGPA display on the home page. It should always show exactly 2 decimal places (e.g. 8.75, 9.00, 7.33).

---

### BF-13: Class Edit Modal — Schedule Slot Management

**Problem:** In the class edit modal, existing schedule slots are shown as read-only text. There is no way to add new slots, remove existing slots, or edit existing slots.

**Fix:**
1. Find the class edit modal.
2. The schedule slots section must support:

   **Viewing existing slots:** Each slot is shown as an editable row with fields for: day of week (dropdown), start time, end time, location (optional text). All fields are editable inline.

   **Adding new slots:** A clearly visible "+ Add Slot" button below the existing slots. Clicking it appends a new empty slot row with the same fields.

   **Removing existing slots:** Each slot row has a remove button (×) on the right. Clicking it shows a small inline confirmation: "Remove this slot?" with Confirm and Cancel inline buttons. On confirm, the slot row is removed from the UI.

3. When the edit modal is saved ("Save" button):
   - New slots are created in the database via the API.
   - Removed slots are deleted from the database via the API.
   - Modified slots are updated in the database via the API.
   - All changes happen in a single save operation, not on each individual slot change.

4. When a slot is removed, also delete the corresponding future `class_occurrences` records for that slot (occurrences with `occurrence_date >= today`). Do not delete past occurrence records — historical attendance data must be preserved.

5. Do not ask "Apply change from which date?" — just delete future occurrences and preserve past ones. This keeps things simple.

**Verification:** Open a class edit modal. Confirm existing slots are editable. Add a new slot and save — confirm it appears. Remove a slot and save — confirm it is gone. Confirm past attendance records are unaffected.

---

### BF-14: Home Page Day View — Hide Completed and Past Items

**Problem:** The home page day view shows all items including completed tasks, past class occurrences, and passed exam dates.

**Fix:**
1. Find the day view component on the home page.
2. Filter the items shown to include ONLY:
   - Classes that have not yet started today (start time is in the future relative to now)
   - Tasks that are not completed AND have today's deadline
   - Exams that have not yet occurred (exam date is today or in the future)
   - Assignments that are not submitted AND deadline has not passed
   - Non-academic events that have not yet started today
3. Exclude:
   - Completed tasks
   - Past class occurrences (class already happened today)
   - Passed exams
   - Submitted assignments
   - Past non-academic events
4. If nothing remains after filtering, show the empty state message: "Nothing coming up. Enjoy the calm."
5. This filtering should happen in the component or in the query — not by hiding elements with CSS.

**Verification:** Mark a task as complete. It should disappear from the day view. A class occurrence that already happened today should not show in the day view.

---

### BF-15: Active Semester Toggle — Move to Edit Modal

**Problem:** The button to mark a semester as active appears on the semester card itself. Per spec, it should be inside the semester edit modal only.

**Fix:**
1. Find the active semester toggle/button on the semester card.
2. Remove it from the card. The card should only show the green glowing border when active — no button.
3. Add the toggle inside the semester edit modal: a button or toggle labelled "Mark as Active Semester".
4. Behaviour: only one semester can be active at a time. When marking one as active, automatically deactivate the previously active semester in the same API call.
5. A completed semester (`is_completed === true`) cannot be marked as active. If the semester is completed, the active toggle is hidden or disabled inside the edit modal.
6. The API route for updating a semester must handle the "deactivate all others" logic server-side — do not handle this only on the client.

**Verification:** Remove the active button from semester cards. Open an edit modal and confirm the active toggle is there. Mark a semester as active. Close the modal. The card should show the green border without any button.

---

### BF-16: Semester Page — Section Order Fix

**Problem:** The sections on the semester page are in the wrong order.

**Fix:**
Reorder the sections on the semester page to match this exact order from top to bottom:
1. Sticky header (semester name + projected SPI)
2. Week view calendar
3. Upcoming section (tasks, exams, events, countdown chips)
4. Classes section (class cards grid + new class button)
5. Attendance overview stats row
6. Notes area
7. Marks trend graphs per subject
8. Weekly schedule summary
9. Semester insights (bottom)

If any of these sections do not exist yet, leave a clearly visible placeholder `<div>` with a comment like `{/* TODO: Marks trend graphs */}` so the position is reserved. Do not create new sections from scratch — only reorder what exists.

**Verification:** Open a semester page. Confirm sections appear in the correct order.

---

### BF-17: Pending Attendance — Position Fix

**Problem:** All pending attendance items are shown at the top of the class page, cluttering the most important content.

**Fix:**
1. Find the pending attendance section on the class page.
2. Split it into two groups:

   **Top section (immediately after the calendar):**
   - Show ONLY attendance pending for today and yesterday.
   - If both today's and yesterday's attendance are already marked, this entire top section is hidden. Do not show an empty state — show nothing.

   **Bottom section (after the files section):**
   - Show all other older pending attendance items (older than yesterday).
   - The bulk mark attendance option stays in this bottom section.
   - If there are no older pending items, this section is also hidden entirely.

3. "Pending" means the class occurrence has passed and no attendance record exists for it (no present/absent/cancelled marking).

**Verification:** Create a class with several past occurrences unmarked. Open the class page. Only today's/yesterday's pending items should show at the top. Older pending items should be at the bottom after files.

---

### BF-18: Graph Text Color

**Problem:** All text in graphs (axis labels, tick marks, tooltips, legends) displays in black, which is unreadable against the dark background.

**Fix:**
1. Find all Tremor chart/graph components used across the app.
2. For each chart, update the text colors:
   - Axis labels and tick labels: `#e5e5e5` (near white)
   - Grid lines: `rgba(255, 255, 255, 0.08)` (very subtle)
   - Tooltip background: `#1a1a1a` with white text `#ffffff`
   - Legend text: `#e5e5e5`
3. If Tremor uses global CSS classes for chart text, add overrides in `globals.css`:
   ```css
   .recharts-text, .recharts-cartesian-axis-tick-value {
     fill: #e5e5e5 !important;
   }
   .recharts-tooltip-wrapper {
     background: #1a1a1a !important;
   }
   ```
4. Do not change graph line colors — those are defined per-class by the class color and should remain as is.

**Verification:** Open a class page with some exam marks entered. The graph should show white/light axis labels and tick marks, not black ones.

---

### BF-19: Sync Issues — Cache Invalidation

**Problem:** After creating or editing items (non-academic events, tasks, exams, etc.), the data does not appear in all the places it should. The home page day view and semester calendar do not update until a full page refresh.

**Fix:**
1. Find every TanStack Query mutation in the codebase (`useMutation`).
2. For every mutation's `onSuccess` callback, ensure ALL of the following query keys are invalidated (where relevant to the mutation):
   - The main data query for that entity (e.g. `['tasks']`, `['events']`, `['exams']`)
   - The semester detail query (e.g. `['semester', semesterId]`)
   - The home page day view query (e.g. `['occurrences', 'today']` or whatever key it uses)
   - The semester page calendar events query
   - The class page upcoming section query
3. Use `queryClient.invalidateQueries({ queryKey: [...] })` for each.
4. When in doubt, invalidate more queries rather than fewer. A slightly over-eager invalidation is better than stale data.

**Specific cases to fix:**
- Creating a non-academic event → must update semester calendar AND home day view
- Creating a task → must update class page AND home day view
- Marking attendance → must update class stats AND semester attendance overview
- Creating an exam → must update class page AND semester upcoming section

**Verification:** Create a non-academic event on the semester page. Without refreshing, check the semester calendar and home day view. Both should show the new event immediately.

---

### BF-20: Undo Toast — Implement on All Deletions

**Problem:** When any item is deleted, there is no undo option. Deletions are permanent immediately.

**Fix:**
Implement undo toast on every delete action across the entire app. The behaviour must be identical everywhere:

**Behaviour:**
1. User clicks delete on any item.
2. Item is immediately removed from the UI (optimistic removal).
3. Item is soft-deleted in the database: set `deleted_at = NOW()` instead of actually deleting the row.
4. A toast notification appears: "[Item Name] deleted. Undo?" with a progress bar that shrinks over 5 seconds.
5. If the user clicks "Undo" within 5 seconds: set `deleted_at = NULL` in the database, item reappears in the UI.
6. If 5 seconds pass without undo: send a hard delete request to the API to permanently remove the row.

**Database requirements:**
- `semesters` table already has `deleted_at` column — confirmed.
- `non_academic_events` table already has `deleted_at` column — confirmed.
- For tables that do NOT have `deleted_at`: add the column via Drizzle schema + `db push`. The tables that need it are: `tasks`, `classes`, `exams`, `files`, `attendance`, `class_schedule_slots`.

**Before adding columns**, show the user the exact `db push` command and the tables that will be modified. Wait for confirmation before running.

**Items that need undo toast:**
- Semester deletion
- Class deletion
- Task deletion
- Assignment deletion
- Exam deletion
- Schedule slot removal
- File entry deletion
- Non-academic event deletion
- Attendance record deletion

**Queries must filter soft-deleted rows:**
Every query that fetches any of the above tables must add `WHERE deleted_at IS NULL` to exclude soft-deleted rows. Check every GET API route for these tables and add the filter where missing.

**Verification:** Delete a task. Confirm the undo toast appears with a shrinking progress bar. Click undo — the task should reappear. Delete another task and wait 5 seconds — the task should remain gone after the toast disappears.

---

## 8. Database Reference

Current Supabase tables and their status:

| Table | Status | Notes |
|---|---|---|
| `attendance` | Exists, use normally | Needs `deleted_at` for BF-20 |
| `attendance_edit_history` | Exists, use normally | No changes needed |
| `class_occurrences` | Exists, use normally | No changes needed |
| `class_schedule_slots` | Exists, use normally | Needs `deleted_at` for BF-20 |
| `classes` | Exists, use normally | Needs `deleted_at` for BF-20 |
| `exams` | Exists, use normally | Needs `deleted_at` for BF-20 |
| `files` | Exists, use normally | Needs `deleted_at` for BF-20 |
| `letter_grades` | Exists, use normally | No changes needed |
| `non_academic_events` | Exists, already has `deleted_at` | No schema changes needed |
| `official_semester_grades` | Exists, use normally | No changes needed |
| `quick_notes` | EXISTS — DO NOT TOUCH | Completely out of scope |
| `semesters` | Exists, already has `deleted_at` | No schema changes needed |
| `syllabus_rubric` | Exists, use normally | No changes needed |
| `tasks` | Exists, use normally | Needs `deleted_at` for BF-20 |
| `user_layouts` | EXISTS — DO NOT TOUCH | Completely out of scope |
| `user_preferences` | EXISTS — DO NOT TOUCH | Completely out of scope |
| `users` | Exists, wire up in Task 3 | Needs trigger |

---

## 9. What Must Never Be Changed

The following must never be touched under any circumstances in this v1.1 scope:

- `user_preferences` table — do not read, write, or reference
- `user_layouts` table — do not read, write, or reference
- `quick_notes` table — do not read, write, or reference
- The authentication flow — do not change how login/logout works except adding the Log Out button in the user menu
- The CGPA calculation logic — only change how it is displayed (toFixed(2))
- The attendance calculation logic — only change the display guard (BF-10)
- Any existing migration files — never edit existing migration files, only add new ones
- The Drizzle schema for tables not mentioned in this document
- Any environment variables other than `DATABASE_URL` (Task 1)
- The overall app routing structure
- Any existing working features not mentioned in this document

---

*End of Classey v1.1 Slim Specification*
*This document is the single source of truth. If something is not mentioned here, do not implement it. If something is unclear, ask the user.*
