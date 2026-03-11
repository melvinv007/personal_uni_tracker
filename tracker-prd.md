# Tracker — University Life Tracker
## Product Requirements Document (PRD)
### Version 1.0 | Complete Specification for Development

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Design System](#3-design-system)
4. [UI Component Library](#4-ui-component-library)
5. [Animation System](#5-animation-system)
6. [Authentication & Security](#6-authentication--security)
7. [Database Architecture](#7-database-architecture)
8. [Application Structure & Navigation](#8-application-structure--navigation)
9. [Home Page](#9-home-page)
10. [Semester Page](#10-semester-page)
11. [Class Page](#11-class-page)
12. [Calendar System](#12-calendar-system)
13. [Attendance System](#13-attendance-system)
14. [Tasks & Assignments System](#14-tasks--assignments-system)
15. [Exams & Grades System](#15-exams--grades-system)
16. [CGPA & SPI System](#16-cgpa--spi-system)
17. [Analytics & Calculators](#17-analytics--calculators)
18. [File System (Laptop Only)](#18-file-system-laptop-only)
19. [Notifications](#19-notifications)
20. [Forms & Validation](#20-forms--validation)
21. [Global UX Rules](#21-global-ux-rules)
22. [Performance](#22-performance)
23. [Error Handling & Monitoring](#23-error-handling--monitoring)
24. [Data Export](#24-data-export)
25. [Engineering Safeguards](#25-engineering-safeguards)
26. [Future-Proofing & Migrations](#26-future-proofing--migrations)

---

## 1. Project Overview

**Product Name:** Tracker
**Type:** Responsive progressive web application
**Purpose:** A personal university life tracker for managing semesters, classes, attendance, assignments, exams, and academic analytics.
**Primary User:** Single user (personal use), accessed via Windows/Edge on laptop and Safari on iPhone 17 Pro.
**Deployment:** Vercel (personal, free tier)
**Database:** Supabase (PostgreSQL)

### Core Philosophy
- Dark-only interface. No light mode.
- Every interaction must feel instant via optimistic UI.
- Every piece of data is persistent server-side. Nothing is stored locally except file handles (File System Access API).
- The app must feel lively, premium, and fun to use — never static or flat.
- Animations must never compromise performance.
- The app is personal and trusted — every feature is built for one power user.

### Developer Instructions
- **Code comments are mandatory throughout the entire codebase.** Every component, function, hook, utility, and API route must have a descriptive comment explaining what it does, what parameters it takes, and what it returns.
- Comments must be detailed enough that the developer (or AI assistant) can understand the intent and make changes without needing to reverse-engineer the logic.
- Use JSDoc-style comments (`/** */`) for all exported functions, hooks, and components.
- Inline comments must be added for any non-obvious logic, especially in attendance calculations, CGPA formulas, recurrence rules, and optimistic UI logic.
- Component files must have a top-level comment block stating: component name, purpose, props, and which page it appears on.

### Supported Platforms
- **Desktop:** Windows, Microsoft Edge (primary), Chrome compatible
- **Mobile:** iPhone 17 Pro, Safari (iOS 17+)
- **Responsive breakpoints:** Mobile-first, with desktop layout activating at `lg` (1024px+)

---

## 2. Tech Stack

| Layer | Library / Tool | Version / Notes |
|---|---|---|
| Framework | Next.js | v14, App Router |
| Language | TypeScript | Strict mode enabled |
| Styling | Tailwind CSS | Core utility classes only |
| Animations | Framer Motion | GPU-accelerated, viewport-triggered |
| Forms | React Hook Form | Combined with Zod for validation |
| Validation | Zod | Full schema validation, type-safe |
| Server State | TanStack Query | Caching, background refetch, optimistic updates |
| Client State | Zustand | With Immer middleware for nested state |
| Immutability | Immer | Used as Zustand middleware |
| Database ORM | Drizzle ORM | Type-safe queries, migration support |
| Backend / Auth | Supabase | PostgreSQL + Google OAuth + Row Level Security |
| Calendar Engine | FullCalendar | Standard time grid (MIT license), heavily customised |
| Recurrence | rrule.js | All recurring class schedule logic |
| Charts | Tremor Charts | Dark-theme native, animated |
| Drag & Drop | dnd-kit | File reordering, physics-based |
| Date Utilities | date-fns | All date arithmetic, countdowns, timezone handling |
| Error Monitoring | Sentry | Free tier, Next.js integration |
| Notifications | Web Push API | iOS 17 Safari + Edge compatible |
| File Access | File System Access API | Edge/Windows + Chrome only, laptop feature |
| Deployment | Vercel | Free tier, auto-deploy from GitHub |
| UI Components | 21st.dev + brillout/awesome-react-components | See Section 4 |

### Key Architecture Decisions
- **App Router (Next.js 14):** File-based routing maps cleanly to home → semester → class navigation hierarchy.
- **Drizzle ORM over raw Supabase JS:** Type-safe queries, clean migration management, versioned schema changes.
- **TanStack Query for all server state:** No manual loading/error states. Handles caching, background sync, and optimistic updates out of the box.
- **Zustand + Immer:** Simple global state for UI (active semester, selected week, calendar state, scroll positions). Immer handles nested updates cleanly.
- **FullCalendar as rendering engine:** Avoids rebuilding complex overlap logic, time grid rendering, and recurrence handling from scratch.

---

## 3. Design System

### 3.1 Theme
- **Mode:** Dark only. No light mode.
- **Background:** Dotted surface pattern across the entire application. Reference: `https://21st.dev/efferd/dotted-surface/default`. This is the base layer of every single page and every modal/drawer. All input boxes and form backgrounds also use this same dotted dark surface.
- **Font:** Geist (by Vercel). Apply globally via `next/font`. Used at all sizes — from the large hero date display down to card metadata.

### 3.2 Color System
The app uses two parallel color systems that must never conflict:

**Semantic Colors (global meaning):**
| Color | Meaning |
|---|---|
| Purple | UI accent elements, highlights |
| Blue | Classes and class-related blocks |
| Orange | Exams and exam-related blocks |
| Red | Deadlines, warnings, errors |
| Green | Completed items, healthy attendance, active semester |
| White | Current time indicator line |
| Amber | Approaching deadline warning |

**Custom Colors (user-assigned):**
- Every semester has a user-chosen color.
- Every class inherits the semester color by default, but can be overridden.
- This color is used in: calendar blocks for that class, card gradient fills, card glow border, graph lines for that subject.
- All card gradients and glow borders must dynamically inherit from the semester/class color assigned by the user.

### 3.3 Typography
- **Font:** Geist exclusively
- **Hero date/time (home page):** Extra large, bold, almost brutal in weight. This is the dominant visual element of the home page.
- **Section headers:** Large, semi-bold
- **Card titles:** Medium, bold
- **Metadata/stats:** Small, regular weight
- **Empty state text:** Small, muted, low opacity

### 3.4 Card Design Rules
- Every card in the application must have a subtle gradient fill or abstract design. No flat, solid-color cards. No exceptions.
- Cards included: semester card, class card, quote card, stats card, schedule card, task card, assignment card, exam card, file card, attendance prompt card, weekly summary card.
- Gradient direction and intensity should be subtle — not distracting. The gradient color is derived from the semester/class custom color.
- All cards have glowing borders using the Aceternity glowing effect component. The glow color also inherits from the semester/class color.
- Cards have spring-physics hover animation: slight upward lift + glow intensifies on hover. This is universal across all cards.
- Staggered entrance animation: when a list of cards loads, they animate in one by one with a slight delay, not all at once.

### 3.5 Spacing & Layout
- **Desktop home layout:** 2/3 width left panel (semester cards) + 1/3 width right panel (day calendar). Fixed ratio.
- **Consistent inner padding** on all cards and sections.
- **Section separators** should be subtle — low opacity dividers, not harsh lines.

---

## 4. UI Component Library

All components from 21st.dev must be referenced by their exact URL in code comments so developers can locate them. The secondary reference for additional UI components is: `https://github.com/brillout/awesome-react-components`.

| Component | 21st.dev URL | Used For |
|---|---|---|
| Dotted Surface | `https://21st.dev/efferd/dotted-surface/default` | Global background on all pages and modals |
| Glowing Effect | `https://21st.dev/aceternity/glowing-effect/default` | Border on every card in the app |
| Minimal Dock | `https://21st.dev/jatin-yadav05/minimal-dock/default` | Desktop navigation dock |
| Back Button | `https://21st.dev/shsfwork/back-button/default` | All back and navigation buttons |
| Calendar Inspiration | `https://21st.dev/haydenbleasel/calendar/default` | Calendar design reference |
| Datetime Picker | `https://21st.dev/BelkacemYerfa/datetime-picker/default` | All date and datetime inputs across the app |
| Todo Item | `https://21st.dev/community/components/serafim/to-do-item/default` | Task and assignment checkboxes |
| Message Loading | `https://21st.dev/jakobhoeg/message-loading/default` | Loading states throughout |
| Success Toast | `https://21st.dev/reapollo/success-toast-notification/default` | All toast notifications |
| Basic Modal | `https://21st.dev/reapollo/basic-modal/default` | All creation and edit forms |

### Navigation
- **Desktop:** Minimal dock navigation (`jatin-yadav05/minimal-dock`). Pinned. Never takes user to a new browser tab or window.
- **Mobile:** Page-based navigation, no bottom dock. Users start from the semester page and navigate from there.
- **Back button:** All back/navigation buttons use the `shsfwork/back-button` component.

---

## 5. Animation System

All animations are powered by **Framer Motion**. All animations must be GPU-accelerated using `transform` and `opacity` only — never animate `height`, `width`, or `top/left` directly. Animations only trigger for elements in the viewport (use `whileInView`). Animations must never cause layout shifts or jank.

### 5.1 Page Transitions
- **Style:** iOS push slide (content slides in from right on navigate forward, slides back right on back navigation)
- **Library:** Framer Motion `AnimatePresence` with `variants`
- **Duration:** ~300ms, ease-in-out curve

### 5.2 Card Animations
- **Entrance:** Staggered fade-up. Each card fades in and translates upward slightly as it enters the viewport. Delay between cards: ~60ms.
- **Hover:** Spring physics — slight Y-axis lift (4–6px) + glow border intensifies. Use `whileHover` with spring config.
- **Press:** Slight scale-down (0.97) on tap/click. Use `whileTap`.

### 5.3 Scroll Animations
- Stats count-up animation triggers when the stats section enters the viewport.
- Graph lines draw themselves in (animated stroke) when the graph section scrolls into view.
- Section headers and content blocks fade-up on scroll entry.

### 5.4 Component-Specific Animations
- **Task completion:** Check animation plays → task fades out over 5 seconds → removed from DOM. Use the serafim/to-do-item component animation.
- **Approaching deadline:** Task card transitions to amber color.
- **Passed deadline:** Task card transitions to red color.
- **Modal open/close:** Spring transition. Modal slides up from bottom on mobile, scales from center on desktop.
- **Toast:** Slides in from bottom-right, fades out automatically.
- **FAB press:** Spring scale animation on press.
- **Week strip swipe:** Momentum-based swipe with spring snap.
- **Calendar week change:** Slide left/right based on navigation direction.
- **Graph tooltips:** Fade in on hover.
- **Undo toast:** Slides in from bottom, has a shrinking progress bar showing the 5-second window.

### 5.5 Micro-Animations
Subtle micro-animations must be consistent throughout the entire app:
- All buttons: small press feedback (scale 0.97)
- All input fields: subtle border glow on focus
- Checkboxes: spring check-mark draw animation
- Dropdown menus: spring open/close
- Delete confirmation: shake animation on the item being deleted before confirmation dialog appears
- Number stats: count-up animation on viewport entry
- Attendance percentage bar: animated fill on load

---

## 6. Authentication & Security

### 6.1 Authentication
- **Provider:** Google OAuth via Supabase Auth
- **Flow:** User opens app → if not authenticated, shown a clean login screen with a single "Sign in with Google" button → Google OAuth flow → redirected back to app → authenticated.
- **Session:** Supabase manages session tokens. Sessions persist across browser restarts. The user should never need to log in repeatedly on the same device.
- **Single user:** Only one Google account will ever use this app. No user management UI needed.
- **All data is tied to the authenticated user's ID via Supabase RLS.**

### 6.2 Data Persistence
- All data is stored in Supabase PostgreSQL. Nothing is stored in localStorage, sessionStorage, or any browser storage (except file handles via File System Access API which are device-local and contain no sensitive data).
- Logging out and back in, switching between laptop and phone, or clearing browser data does not affect stored academic data.

### 6.3 Security Rules
- **Supabase Row Level Security (RLS):** Every database table must have RLS policies that restrict all read/write/delete operations to the authenticated user's own records only. A logged-out user or different user account can never access any data.
- **HTTPS:** Enforced on Vercel. All traffic is encrypted.
- **Environment variables:** All Supabase keys, service keys, and API secrets must be stored as server-side environment variables in Vercel. Never exposed to the client bundle.
- **API routes:** All sensitive operations (data mutations) go through Next.js API routes, never directly from the client.
- **Rate limiting:** Implement rate limiting on all API endpoints and the authentication endpoint to prevent spam and brute-force attacks. Use Vercel Edge middleware or an upstash/ratelimit integration.
- **Input sanitization:** All user inputs must be sanitized server-side before database writes.
- **Foreign key constraints:** All relational data (classes belonging to semesters, tasks belonging to classes, etc.) must use strict foreign key constraints with appropriate cascade rules.

### 6.4 File System Access API Security
- The File System Access API is completely safe. Files never leave the user's device. The browser stores a file handle reference only, no file content is uploaded to any server.
- After a browser restart or OS update, Edge/Chrome may revoke stored file handle permissions. The app must detect this and show a clear "Re-verify Access" button next to the affected file entry rather than a generic broken file error.
- This feature is available only on Edge and Chrome on Windows/desktop. It must be completely hidden on mobile (iOS Safari does not support this API).

---

## 7. Database Architecture

### 7.1 ORM & Migrations
- Use **Drizzle ORM** for all database interactions. Schema is defined in TypeScript.
- Use Drizzle's migration system (`drizzle-kit`) for all schema changes. Every schema change must be a versioned migration file — never edit the database directly.
- All timestamps stored as UTC in the database, displayed in the user's local timezone in the UI using `date-fns`.

### 7.2 Schema

```typescript
// users — managed by Supabase Auth, reference only
users {
  id: uuid (primary key, from Supabase Auth)
  email: text
  created_at: timestamp
}

// semesters
semesters {
  id: uuid (primary key)
  user_id: uuid (foreign key → users.id, cascade delete)
  name: text (required)
  start_date: date (required)
  end_date: date (required)
  color: text (hex color, required)
  credits: integer (auto-calculated from classes, manual override allowed)
  credits_manual_override: boolean (default false)
  is_active: boolean (default false, only one can be true at a time)
  is_completed: boolean (default false)
  notes: text (rich text, nullable)
  created_at: timestamp
  updated_at: timestamp
}

// official_semester_grades (entered after semester ends)
official_semester_grades {
  id: uuid
  semester_id: uuid (foreign key → semesters.id, cascade delete)
  user_id: uuid
  spi: decimal (calculated from letter grades)
  created_at: timestamp
}

// classes (subjects)
classes {
  id: uuid (primary key)
  semester_id: uuid (foreign key → semesters.id, cascade delete)
  user_id: uuid
  name: text (required)
  color: text (hex, defaults to semester color)
  category: enum('Core', 'Minor', 'Elective', 'Other') (required)
  credits: integer (required)
  start_date: date (defaults to semester start_date)
  end_date: date (defaults to semester end_date)
  notes: text (rich text, nullable)
  created_at: timestamp
  updated_at: timestamp
}

// class_schedule_slots (recurring weekly slots per class)
class_schedule_slots {
  id: uuid
  class_id: uuid (foreign key → classes.id, cascade delete)
  user_id: uuid
  day_of_week: integer (0=Sunday, 1=Monday...6=Saturday)
  start_time: time (required)
  end_time: time (required)
  location: text (nullable, e.g. "LA001")
  valid_from: date (required — supports mid-semester schedule changes)
  valid_until: date (nullable — null means active until end of semester)
  created_at: timestamp
}

// class_occurrences (individual instances of each class slot)
class_occurrences {
  id: uuid
  class_id: uuid (foreign key → classes.id, cascade delete)
  schedule_slot_id: uuid (foreign key → class_schedule_slots.id)
  user_id: uuid
  occurrence_date: date (required)
  start_time: time
  end_time: time
  location: text (nullable)
  status: enum('scheduled', 'cancelled', 'extra', 'rescheduled') (default 'scheduled')
  is_extra: boolean (default false — true for one-time extra classes)
  created_at: timestamp
}

// attendance
attendance {
  id: uuid
  occurrence_id: uuid (foreign key → class_occurrences.id, cascade delete)
  class_id: uuid
  user_id: uuid
  status: enum('present', 'absent', 'cancelled') (required)
  marked_at: timestamp
  updated_at: timestamp
  -- unique constraint on (occurrence_id, user_id) — prevents duplicates
}

// attendance_edit_history
attendance_edit_history {
  id: uuid
  attendance_id: uuid (foreign key → attendance.id)
  user_id: uuid
  previous_status: enum('present', 'absent', 'cancelled')
  new_status: enum('present', 'absent', 'cancelled')
  changed_at: timestamp
  reason: text (nullable)
}

// tasks
tasks {
  id: uuid
  class_id: uuid (foreign key → classes.id, nullable — standalone tasks allowed)
  semester_id: uuid (foreign key → semesters.id, cascade delete)
  user_id: uuid
  name: text (required)
  deadline: timestamp (nullable — tasks without deadlines allowed)
  is_completed: boolean (default false)
  completed_at: timestamp (nullable)
  marks_scored: decimal (nullable)
  total_marks: decimal (nullable)
  is_assignment: boolean (default false)
  is_submitted: boolean (default false, only relevant if is_assignment true)
  linked_exam_id: uuid (foreign key → exams.id, nullable)
  created_at: timestamp
  updated_at: timestamp
}

// exams
exams {
  id: uuid
  class_id: uuid (foreign key → classes.id, cascade delete)
  user_id: uuid
  name: text (required)
  exam_date: date (required)
  marks_scored: decimal (nullable)
  total_marks: decimal (required)
  weightage: decimal (required, percentage)
  created_at: timestamp
  updated_at: timestamp
}

// syllabus_rubric (optional, one per class)
syllabus_rubric {
  id: uuid
  class_id: uuid (foreign key → classes.id, cascade delete, unique)
  user_id: uuid
  components: jsonb (array of {name, weightage_percent})
  created_at: timestamp
  updated_at: timestamp
}

// letter_grades (entered per class after semester completion)
letter_grades {
  id: uuid
  class_id: uuid (foreign key → classes.id, cascade delete, unique)
  semester_id: uuid
  user_id: uuid
  grade: enum('AA','AB','BB','BC','CC','CD','DD','FF') (required)
  grade_points: decimal (auto-derived: AA=10, AB=9, BB=8, BC=7, CC=6, CD=5, DD=4, FF=0)
  created_at: timestamp
}

// non_academic_events
non_academic_events {
  id: uuid
  user_id: uuid
  semester_id: uuid (foreign key → semesters.id, nullable)
  name: text (required)
  event_date: date (required)
  start_time: time (required)
  end_time: time (required)
  location: text (nullable)
  color: text (hex, nullable)
  notes: text (nullable)
  created_at: timestamp
  -- strictly excluded from all attendance and academic stats
}

// files (laptop only — stores file handles, not file content)
files {
  id: uuid
  class_id: uuid (foreign key → classes.id, cascade delete)
  user_id: uuid
  display_name: text (required, user-defined)
  file_handle_serialized: text (serialized FileSystemFileHandle)
  sort_order: integer
  handle_valid: boolean (default true)
  created_at: timestamp
  updated_at: timestamp
}
```

### 7.3 Data Integrity Rules (enforced at DB + application level)
- One active semester at a time: enforced via a DB trigger or application logic that sets `is_active = false` on all other semesters before setting one to `true`.
- Unique attendance per occurrence: `UNIQUE(occurrence_id, user_id)` constraint on attendance table.
- Marks cannot exceed total marks: validated at application level (Zod) and database level (CHECK constraint).
- Attendance count cannot exceed total class occurrences: validated in application logic.
- Exam weightage sum warning at 100%: application-level warning, not a hard block.
- No duplicate class sessions at the same time: application-level validation on class schedule creation and editing.
- All foreign keys have appropriate cascade rules: deleting a semester cascades to all its classes, occurrences, attendance, tasks, exams, files.

---

## 8. Application Structure & Navigation

### 8.1 Route Structure
```
/                          → Home page
/semester/[id]             → Semester page
/semester/[id]/class/[id]  → Class page
/auth/login                → Login page (unauthenticated only)
```

### 8.2 Navigation Behavior
- **Desktop:** Minimal dock (jatin-yadav05/minimal-dock) provides quick navigation.
- **Page transitions:** iOS-style push slide (Framer Motion AnimatePresence). Forward navigation slides in from right, back navigation slides out to right.
- **Back button:** Always uses `shsfwork/back-button` component. Present on semester and class pages.
- **Scroll position memory:** Every page stores its scroll position in Zustand when the user navigates away. On return, the scroll position is restored automatically.
- **Last visited page:** The app opens to the last visited page (stored in Zustand, persisted in localStorage as the only localStorage usage in the app).
- **No new browser tabs/windows** are ever opened. All navigation is in-app.

### 8.3 Floating Action Button (FAB)
- Fixed position: bottom-right corner, always visible on all pages.
- Context-aware — changes available actions per page:
  - **Home page:** Create new semester
  - **Semester page:** Create new class
  - **Class page:** Create task / create assignment / create exam / add extra class
- Spring animation on press (scale bounce).
- On click, opens the relevant creation modal.
- On class page, expands into a small menu of options with staggered entrance animation.

### 8.4 Sticky Context Headers
- **Class page:** Class name + key stats (attendance %, next exam) stick to the top of the page while scrolling.
- **Semester page:** Semester name + projected SPI stick to the top while scrolling.
- **Calendar views:** The current day/week label remains pinned while scrolling through time slots.

---

## 9. Home Page

### 9.1 Desktop Layout
The home page is divided into two primary panels side by side:

**Left Panel (2/3 width):**
- Motivational quote card (top, full width of panel, gradient card)
- Date / time hero display
- CGPA display
- Semester cards grid

**Right Panel (1/3 width):**
- Day view calendar (all of today's content)
- Day navigation
- Weekly academic summary (Sundays only)

### 9.2 Motivational Quote Card
- Shows a motivational quote relevant to studying/productivity.
- Quotes are hardcoded as a static list inside the codebase. No external API needed.
- A different quote is shown each day, selected by taking (day of year % total quotes) as the index.
- Displayed in a gradient card with Aceternity glowing border.

### 9.3 Date / Time Hero
- Shows current day of week, date, and time.
- **Size:** Extra large, bold, Geist font. This is the most visually dominant element on the home page.
- Time updates in real time (every second).
- Example format: `Tuesday` / `10 March 2026` / `14:32:05`

### 9.4 CGPA Display
- Shows running CGPA calculated from all completed semesters with official letter grades entered.
- Label: clearly marked as current CGPA.
- If no semesters are completed, shows a placeholder: "CGPA will appear after your first semester".

### 9.5 Semester Cards Grid
- Displayed in a responsive grid (2 columns on desktop, 1 column on mobile).
- Each card is a rich gradient card with glowing border (color from semester's assigned color).
- **Card content:**
  - Semester name (bold)
  - Date range (start – end)
  - Total credits
  - Status badge: Active (manually marked) / Completed (manually marked by user) / Upcoming (automatically assigned if semester start date is in the future and not marked active or completed)
- **Active semester:** Has a distinct green glowing border. A small button with just the text `A` is present on each non-active semester card to mark it as active. Only one semester can be active at a time. Clicking `A` on a new semester automatically deactivates the previously active one.
- **Edit button:** Small edit icon on each card. Opens the semester edit modal.
- **Hover:** Quick peek preview (desktop) — hovering shows a floating mini-preview with upcoming classes, next exam, and overall attendance.
- **Click:** Navigates to the semester page.
- **New semester button:** Present below or alongside the grid, styled consistently. Also accessible via FAB.

### 9.6 Empty State (No Semesters)
- Dashed-border card with low-opacity background.
- Subtly glowing `+` icon in the center.
- Text: "Add your first semester to get started"
- Clicking anywhere on the card opens the semester creation modal.

### 9.7 Day View Calendar (Right Panel)
- Shows all events for the currently selected day: classes, tasks with deadlines, assignments, exams, non-academic events.
- **Day navigation:** Previous day arrow, today button (text "Today"), next day arrow.
- **Current day** is always visually highlighted in the day strip.
- Calendar is read-only (non-interactive) on the home page.
- Uses a compact vertical timeline layout. Time blocks are proportional to duration.
- Shows events from the **active semester** only. Non-academic events for the current day are also shown regardless of semester.
- **No active semester state:** If no semester is marked active, the day view calendar is replaced with a centered text message: "No active semester. Mark a semester as active to see your schedule here."
- The calendar auto-centers to the current time when Today is selected.
- Scrollable within the panel.

### 9.8 Weekly Academic Summary (Sundays Only)
- Appears below the day view calendar on the right panel.
- Visible only on Sundays (from 00:00 to 23:59).
- Content: total classes attended that week, tasks completed, assignments submitted, exams taken, missed classes.
- Card style: gradient with glowing border.
- Animated count-up on appearance.

---

## 10. Semester Page

### 10.1 Page Header (Sticky)
- Semester name (large, bold)
- Projected SPI (clearly labelled as "Projected", auto-calculated)
- Semester color accent in header
- Back button (shsfwork/back-button)
- Sticky: remains at top while scrolling

### 10.2 Week View Calendar
- **Desktop:** Full 7-day week view calendar (FullCalendar time grid), 6 hours visible at once, vertically scrollable, auto-centers to current time on load.
- **Mobile:** Swipeable week strip at the top showing Mon–Sun. The selected day is highlighted with the semester color. Tapping a day shows that day's events below in a vertical timeline.
- Shows only events belonging to this semester: classes, exams, assignments with deadlines, non-academic events.
- **Navigation:** Previous week arrow, Today button, next week arrow.
- **Current day** highlighted in the week strip.
- **Calendar blocks:** Height proportional to event duration. Events use the class/semester color.
- **Overlapping events:** Rendered side by side (Apple Calendar style).
- **Midnight-spanning events:** Split visually across two days, stored as one record.
- **Text truncation:** Long class names and room names truncate gracefully with ellipsis inside calendar blocks. Never break layout.
- Calendar is **read-only** on the semester page (interactive on class page only).
- **Quick add:** Clicking an empty time slot opens a small menu for quick creation: task / exam / extra class / non-academic event. Pre-fills the time from the clicked slot.

### 10.3 Upcoming Section
- Shows all upcoming items for this semester: tasks (with deadlines), assignments (with deadlines), exams, non-academic events.
- Sorted by date ascending.
- **Exam countdown chips:** For exams within the next 8 days only, show a countdown chip (e.g. "CAT 1 in 3 days"). Not shown for exams more than 8 days away.
- Empty state if nothing upcoming.

### 10.4 Attendance Overview Stats
- Shows a one-line stats row for each class in the semester.
- Format: `Class Name: attended/occurred` (e.g. `Fluid Mechanics: 5/6`)
- Cancelled classes are excluded from both counts.
- Animated count-up on viewport entry.

### 10.5 Class Cards
- Displayed in a responsive grid.
- Each card: rich gradient fill (class color), glowing border (class color).
- **Card content:** Class name, category badge (Core/Minor/Elective), credits, attendance percentage, color accent.
- Edit button on each card.
- **Hover (desktop):** Quick peek preview — upcoming classes for that subject, current attendance, next exam.
- **Click:** Navigates to the class page.
- **New class button:** Present below or alongside grid. Also accessible via FAB.
- **Empty state:** Dashed-border card with glowing `+` icon and text "Add your first class".

### 10.6 Marks Trend Graphs
- One Tremor chart per class, shown below the class cards section.
- **X-axis:** Exam dates (chronological)
- **Y-axis:** Marks percentage (0–100%)
- **Line:** Color matches the class color.
- **Legend:** Class name and color shown.
- **Animation:** Line draws itself in when the graph section scrolls into view.
- **Tooltip:** Shows exam name, date, marks scored / total marks, percentage on hover.
- Updates automatically whenever exam data changes.
- Empty state if no exams entered yet.

### 10.7 Weekly Schedule Summary
- Auto-generated from all class schedule slots defined in this semester.
- Shows a clean weekly grid: each day of the week with all scheduled classes for that day, including times and locations.
- Read-only, informational. Updates automatically when class schedules change.
- Positioned below the marks trend graphs.

### 10.8 Semester Insights
- Positioned at the bottom of the semester page.
- Shows: subject with highest marks (based on exam averages), subject with lowest attendance.
- Gradient card. Updates automatically.

### 10.9 Notes Area
- A rich text writing area for semester-level notes.
- Variable height: auto-expands as content grows. Never has a fixed max height that cuts off content.
- Proper writing experience — not just a plain textarea. Supports basic formatting (bold, italic, bullet lists at minimum).
- Saved automatically (debounced auto-save on typing, ~1 second debounce).
- Positioned after the upcoming section, before class cards.

---

## 11. Class Page

### 11.1 Page Header (Sticky)
- Class name (large, bold, colored accent from class color)
- Key stats: attendance percentage, next exam name + date
- Back button
- Sticky: remains at top while scrolling

### 11.2 Week View Calendar (Interactive)
- **Desktop:** Full 7-day week view (FullCalendar), 6 hours visible, scrollable, auto-centers to current time.
- **Mobile:** Swipeable week strip. Selected day highlighted with class color.
- Shows only events for this specific class: scheduled occurrences, extra classes, exams, tasks with deadlines.
- **Navigation:** Previous week arrow, Today button, next week arrow.
- **Interactive:** Users can interact with calendar blocks to:
  - Mark attendance for a class occurrence (present / absent / cancelled)
  - Mark tasks/assignments as complete
  - Cancel a single class occurrence (without affecting the recurring schedule)
- **Quick add:** Clicking empty time slot opens small menu for quick creation: task / exam / extra class.
- All calendar rules apply (overlaps, midnight spanning, proportional block heights, text truncation).

### 11.3 Today's Attendance Prompt Card
- A conditional card that appears only if this class has a scheduled occurrence today.
- Prompts: "You have [Class Name] today at [time] in [location]. Mark your attendance."
- Buttons: Present / Absent / Cancelled
- The card disappears if attendance is already marked for today's occurrence.
- If there is no class today, this card is not rendered at all.

### 11.4 Pending Attendance Alerts
- Shows any past class occurrences (not today) where attendance has not been marked.
- Displayed as a list of pending items with quick mark buttons (Present / Absent).
- **Bulk attendance entry:** A "Mark All" option allows selecting multiple pending sessions and marking them all present or all absent at once.
- **Auto-absent rule:** Any occurrence older than the day after it occurred (i.e., after tomorrow night at 23:59) that still has no attendance mark is automatically marked absent by the system.
- After auto-marking, the system creates an attendance record with `status = 'absent'` and `marked_at = auto_mark_timestamp`.

### 11.5 Attendance Stats Card
- Total classes scheduled (calculated from schedule slots + extra classes, excluding cancelled)
- Classes occurred (occurrences that have passed and were not cancelled)
- Classes attended (attendance records with status = 'present')
- Attendance percentage (attended / occurred × 100)
- All numbers animate count-up on viewport entry.
- Gradient card with glowing border.

### 11.6 Skip-Class Safety Indicator
- Positioned below the attendance stats card.
- Displays: "You can miss **X** more classes and stay above 75%"
- Displays: "If you miss your next class, attendance becomes **Y%**"
- These values update in real time based on attendance stats.
- Color-coded: Green if safe to skip, amber if marginal, red if at risk.

### 11.7 Attendance Survival Calculator + Bunk Planner
- Positioned below the skip-class safety indicator.
- **Attendance survival calculator:** Enter a number of future classes to miss → shows resulting attendance percentage.
- **Bunk planner:** Enter a target attendance percentage → shows how many classes can be missed while maintaining that target.
- Both are inline, no separate page needed.

### 11.8 Weekly Schedule Card
- Shows the recurring schedule for this class: each time slot with day, start time, end time, and location (if set).
- Only shows slots valid for the current week (accounts for mid-semester schedule changes).
- Example: `Monday 08:30 – 10:00 | LA001`, `Thursday 14:00 – 15:00 | Room B204`
- Edit button opens the schedule management modal.

### 11.9 Tasks Section
- Shows all tasks linked to this class.
- Each task uses the serafim/to-do-item component.
- **Task card content:** Task name, deadline date and time (exact, if set), edit button.
- **Completion:** Check animation plays → task fades out over 5 seconds → removed from view.
- **Tasks without deadlines** appear in the list but not on the calendar.
- **Approaching deadline:** Card turns amber.
- **Passed deadline:** Card turns red.
- Empty state: "No tasks yet. Create your first task."

### 11.10 Assignments Section
- Separate section from tasks, below tasks.
- Each assignment card: name, deadline (exact date and time), marks scored / total marks (if entered), submission status toggle, edit button.
- **Submission toggle:** "Submitted / Not Submitted". Visual toggle, updates optimistically.
- **Completion:** Same fade-out animation as tasks.
- **Deadline visual indicators:** Amber for approaching, red for passed.
- Empty state: "No assignments yet."

### 11.11 Exams / Tests Section
- List of all exams for this class.
- Each exam card: name, date, marks scored / total marks, weightage, edit button.
- Edit button opens exam edit modal (includes delete option).
- Empty state: "No exams recorded yet."

### 11.12 Marks Trend Graph
- Tremor chart showing exam marks over time.
- X-axis: exam dates. Y-axis: percentage (0–100%).
- Line color: class color.
- Animated draw-in on scroll entry.
- Tooltip: exam name, date, marks/total, percentage.
- Legend included.
- Updates automatically on any exam change.
- Empty state if no exams.

### 11.13 Exam Score Predictor
- Positioned below the marks trend graph.
- User selects an upcoming exam → enters a target overall percentage for the class → app calculates the required score on that exam.
- Uses syllabus rubric weightages if entered.

### 11.14 Attendance History Review
- A full table of all past class occurrences for this class.
- Columns: Date, Scheduled Time, Location, Status (present/absent/cancelled/extra), Actions.
- Each row has an edit button to change the attendance status.
- **Edit history:** Each attendance record shows a small history icon; clicking it shows the full change history for that occurrence (from `attendance_edit_history` table).
- Supports pagination or lazy loading for large history lists.

### 11.15 Notes Area
- Same as semester notes area: rich text, variable height, auto-expands, auto-saves.
- Positioned after the weekly schedule card.

### 11.16 Files Section (Laptop / Desktop Only)
- Completely hidden on mobile (feature-detected, not just CSS hidden).
- See Section 18 for full specification.

### 11.17 Syllabus Rubric + Grade Calculator (Collapsed)
- Positioned at the bottom of the class page.
- Collapsed by default with a toggle to expand.
- **Rubric entry:** Optional. User can input grading components: e.g. `Midsem 30%`, `Endsem 50%`, `Quizzes 20%`.
- **Grade calculator:** Given current entered marks and the rubric, calculates "What do I need on the final exam to achieve grade X?"
- Shows required scores for: 10 CGPA (AA), 9 CGPA (AB), 8 CGPA (BB) simultaneously.
- Updates dynamically as exam marks are entered.

### 11.18 Post-Semester Grade Input
- Visible only when the semester is marked as completed.
- A simple dropdown to select the official letter grade for this class: AA / AB / BB / BC / CC / CD / DD / FF.
- On selection, grade points are auto-derived and the semester SPI + running CGPA recalculate.

---

## 12. Calendar System

### 12.1 Calendar Library
Use **FullCalendar** (`@fullcalendar/react` with `@fullcalendar/timegrid` plugin) as the rendering engine. Apply heavy custom CSS to match the dark dotted design system. Custom React components are used to render event blocks.

### 12.2 Calendar Views
- **Week view (semester and class pages, desktop):** 7-day time grid, 6 hours visible at a time, vertically scrollable.
- **Day view (home page right panel):** Single day vertical timeline, scrollable.
- **Mobile week strip:** Compact 7-day strip at top of page. Selecting a day shows that day's events in a vertical list below.

### 12.3 Calendar Behavior
- **Auto-center:** On initial load, the calendar auto-scrolls to center on the current time (or the first event of the day if outside working hours).
- **Current time indicator:** A white horizontal line across the calendar showing the current time. Updates in real time.
- **Scrollable:** Full 24-hour timeline is accessible via scroll. Only 6 hours visible at once.
- **Block height:** Proportional to event duration. A 1-hour event is half the height of a 2-hour event.
- **Text truncation:** Long event titles and room names are truncated with ellipsis inside blocks. Layout never breaks.
- **Overlapping events:** Events at the same time are rendered side by side (Apple Calendar style). Width splits proportionally.
- **Midnight-spanning events:** Visually split across two day columns, stored as one record internally.
- **Week navigation:** Previous week button, Today button, next week button. Slide animation on week change.
- **Today highlight:** Current day column is always visually highlighted.
- **Quick add:** Clicking an empty time slot opens a small contextual menu for creating a new item at that time.

### 12.4 Event Types on Calendar
| Event Type | Visual Style |
|---|---|
| Scheduled class | Solid block, class color |
| Cancelled class occurrence | Strikethrough text, muted/desaturated color |
| Extra class | Solid block, class color, small "Extra" badge |
| Exam | Orange block (semantic color) |
| Task with deadline | Red vertical line marker (not a full block) |
| Assignment deadline | Red vertical line marker |
| Non-academic event | Distinct style, user color if set, excluded from all stats |

### 12.5 Recurrence
- All recurring class schedules use **rrule.js** to generate occurrence instances.
- Mid-semester schedule changes are handled by `valid_from` and `valid_until` fields on schedule slots. When a slot is modified mid-semester, the user is asked: "Apply change from which date?" The previous slot gets `valid_until` set, a new slot gets `valid_from` set.
- Individual occurrence cancellation or rescheduling does not affect the recurring rule. It creates/updates a `class_occurrences` record with `status = 'cancelled'` or `'rescheduled'`.

### 12.6 Performance
- Virtual rendering: only time slots currently visible in the viewport are rendered to the DOM.
- Events outside the visible 6-hour window are rendered lazily as the user scrolls.
- Large datasets (many events) must not cause UI lag or janky scrolling.

---

## 13. Attendance System

### 13.1 Attendance Statuses
- `present` — attended the class
- `absent` — did not attend
- `cancelled` — class was cancelled (by professor or holiday). Does not count in any stats.

### 13.2 Attendance Rules
- **No future attendance:** Users cannot mark attendance for a class that hasn't occurred yet. Exception: a class can be marked `cancelled` before its scheduled start time.
- **No duplicates:** If attendance is marked again for the same occurrence, it updates the existing record (upsert). The `attendance_edit_history` table logs the change.
- **Auto-absent:** Any occurrence more than 1 day in the past with no attendance record is automatically marked absent. This runs as a Supabase scheduled function or is checked on page load.
- **Bulk entry:** In the pending attendance section, users can select multiple unmarked sessions and mark them all present or absent with one action.
- **Edit history:** Every attendance change is logged to `attendance_edit_history` with previous status, new status, and timestamp. Viewable per occurrence in the attendance history table.

### 13.3 Attendance Calculations
```
total_scheduled = count of occurrences with status IN ('scheduled', 'extra')
total_cancelled = count of occurrences with status = 'cancelled'
total_occurred = count of past occurrences not cancelled
total_attended = count of attendance records with status = 'present'
attendance_percentage = (total_attended / total_occurred) * 100
```
- Cancelled classes are excluded from all calculations.
- Extra classes are included in all calculations.

### 13.4 Adding an Extra Class
- Accessible via FAB on the class page.
- Creation form: date (date picker), start time, end time, location (optional).
- Creates a `class_occurrences` record with `is_extra = true` and `status = 'scheduled'`.
- Appears on the calendar as a one-time block with a small "Extra" badge.
- Counts toward total classes and attendance stats.

### 13.5 Cancelling a Single Occurrence
- Right-click or long-press on a calendar block (or edit option on occurrence) shows a "Cancel This Class" option.
- Sets `status = 'cancelled'` on that specific occurrence.
- Does not affect the recurring schedule.
- Existing attendance record for that occurrence is updated to `status = 'cancelled'` if present.

---

## 14. Tasks & Assignments System

### 14.1 Task Types
- **Task:** Name required. Deadline optional. Class-linked or standalone. No marks.
- **Assignment:** Task with `is_assignment = true`. Deadline optional but encouraged. Marks optional (can be 0). Submission status toggle.

### 14.2 Task Creation
- Accessible from class page (FAB or tasks section button).
- Form fields: Name (required), deadline (optional, datetime picker), linked class (pre-filled with current class, editable), marks scored (optional), total marks (optional), is assignment toggle.
- Smart defaults: current class pre-selected, current date/time pre-filled for deadline.
- All fields validated inline. Required field errors shown below the field immediately on blur.

### 14.3 Task Display Rules
- Tasks without deadlines: shown in task list, not on calendar.
- Tasks with deadlines: shown in task list AND on calendar as a red deadline line.
- **Approaching deadline (within 24 hours):** Card background transitions to amber.
- **Passed deadline (deadline in the past, not completed):** Card background transitions to red.
- **Completion:** Check animation plays (serafim/to-do-item). Task fades out over 5 seconds. Removed from list view but kept in database (`is_completed = true`, `completed_at` set).

### 14.4 Assignment Submission
- Each assignment has a "Submitted / Not Submitted" toggle.
- Updates optimistically (UI reflects instantly before server confirms).
- If a browser notification is enabled, a push notification fires when an assignment's deadline is within 24 hours and `is_submitted = false`.

### 14.5 Standalone Tasks
- Tasks not linked to any class (`class_id = null`) are stored with `semester_id` only.
- They appear in the upcoming section of the semester page and the home day view.
- They can be created from the FAB on the class page with the class field cleared.

### 14.6 Linked Task Deletion Warning
- If a task is linked to an exam (`linked_exam_id` is set), attempting to delete the task shows a warning: "This task is linked to [Exam Name]. Deleting it will also remove this link. Proceed?"

---

## 15. Exams & Grades System

### 15.1 Exam Creation
Form fields (all in modal):
- Name (required)
- Date (date picker, required)
- Marks scored (decimal, nullable)
- Total marks (decimal, required)
- Weightage (decimal, required, percentage)

### 15.2 Exam Validation
- **Marks scored > total marks:** Inline error shown immediately. Save blocked.
- **Weightage sum > 100%:** Warning shown (not a hard block). "Total weightage for this class exceeds 100%. Please review."
- **Exam date outside semester range:** Warning shown. "This exam date is outside the semester dates. Are you sure?"
- **Duplicate name:** Allowed. Date is shown alongside name everywhere to distinguish.
- All validations are inline, shown below the relevant field, no browser alerts.

### 15.3 Exam Updates
- Any change to exam data (marks, date, weightage) automatically triggers re-calculation of:
  - Marks trend graph for that class
  - Projected SPI for the semester
  - Exam score predictor
  - Grade calculator results
- This is handled via TanStack Query invalidation on mutation.

### 15.4 Exam Countdown
- On the semester page upcoming section, exams within the next 8 calendar days show a countdown chip.
- Format: "CAT 1 — 3 days" or "Final Exam — Tomorrow"
- Not shown for exams more than 8 days away.

---

## 16. CGPA & SPI System

### 16.1 Grading Scale (10-point, letter grades)
| Grade | Points |
|---|---|
| AA | 10 |
| AB | 9 |
| BB | 8 |
| BC | 7 |
| CC | 6 |
| CD | 5 |
| DD | 4 |
| FF | 0 |

### 16.2 Projected SPI
- Calculated automatically from entered exam marks and weightages for all classes in the current semester.
- Formula: weighted average of (marks_scored / total_marks × 10) across all exams, weighted by exam weightage.
- Displayed prominently on semester page header, clearly labelled **"Projected SPI"** in a muted style to distinguish from official.
- Updates automatically whenever exam data changes.

### 16.3 Official SPI
- After a semester is marked completed, the user can enter an official letter grade (AA/AB/BB/BC/CC/CD/DD/FF) per class.
- Official SPI = Σ(grade_points × credits) / Σ(credits) for all classes in that semester.
- Stored in `official_semester_grades` table.

### 16.4 Running CGPA
- Calculated from all semesters where official grades have been entered.
- Formula: Σ(SPI × credits_for_semester) / Σ(all_semester_credits)
- Displayed on the home page.
- Auto-updates whenever a letter grade is changed.

### 16.5 Completed Semester Data Entry
- The 3 completed semesters are entered manually by the user.
- User creates semester records, adds classes, enters letter grades → CGPA calculates automatically.
- Completed semesters remain fully editable. They are never locked or archived.

---

## 17. Analytics & Calculators

### 17.1 Attendance Survival Calculator
On class page, below attendance stats:
- Input: "How many upcoming classes do I miss?" → Output: "Attendance would become X%"

### 17.2 Bunk Planner
On class page, below attendance stats (same section as survival calculator):
- Input: Target attendance percentage → Output: "You can miss X more classes"

### 17.3 Skip-Class Safety Indicator
On class page, below attendance stats card (above survival calculator):
- Always visible, no input required.
- "You can miss **X** more classes and stay above 75%"
- "If you miss your next class, attendance becomes **Y%**"
- Color: green if >75% after skipping, amber if 65–75%, red if <65%.

### 17.4 Exam Score Predictor
On class page, below marks trend graph:
- User selects an upcoming exam.
- User enters target final class percentage.
- App calculates required score on that exam.
- Uses syllabus rubric if entered, otherwise uses raw weightages from entered exams.

### 17.5 Syllabus Rubric + Grade Calculator
On class page, bottom, collapsed:
- User enters grading components and weightages (e.g. Midsem 30%, Endsem 50%, Quizzes 20%).
- Grade calculator shows: "To achieve AA (10), you need X% on remaining assessments. For AB (9): Y%. For BB (8): Z%."
- Updates dynamically as marks are entered throughout the semester.

### 17.6 Weekly Academic Summary
On home page, Sundays only, below the day calendar:
- Total classes attended that week
- Classes missed
- Tasks completed
- Assignments submitted
- Exams taken
- Animated count-up on appearance.

### 17.7 Semester Insights
At the bottom of the semester page:
- Subject with highest average exam marks
- Subject with lowest attendance percentage
- Auto-calculated, updates on any data change.

### 17.8 Smart Deadline Risk
- When multiple tasks/assignments/exams have deadlines within a 3-day window, a warning banner appears on the semester page upcoming section.
- Example: "You have 3 deadlines between March 12–14. Plan ahead."

---

## 18. File System (Laptop Only)

### 18.1 Availability
- Entire files section is conditionally rendered only when the File System Access API is available (`'showOpenFilePicker' in window`).
- On iOS Safari or any unsupported browser, this section is completely hidden (not just disabled — not rendered at all).

### 18.2 How It Works
- Uses the **File System Access API** (Chrome/Edge on Windows).
- User selects a file via `window.showOpenFilePicker()`. The app stores the serialized `FileSystemFileHandle`, not the file content or path.
- On clicking a file entry, the app requests access to the stored handle and opens the file directly. No data is uploaded to any server.

### 18.3 File Entry Fields
- Display name (user-defined, required). Not the actual filename.
- Stored handle reference.
- Sort order (integer, for drag-to-reorder).

### 18.4 File Section UI
- Positioned on the class page.
- Search bar at the top for quickly finding files when the list is large.
- Each file entry shows: display name, edit button (rename, delete).
- Drag-to-reorder using **dnd-kit**. Physics-based drag animation.
- **Undo on reorder:** After a drag-and-drop reorder, a 5-second undo toast allows reverting the order change.

### 18.5 Broken File Handle
- If the stored handle is no longer accessible (file moved, deleted, or permissions revoked after browser restart/OS update), the file entry shows a warning state.
- Warning: "File not accessible" badge.
- A "Re-verify Access" button allows the user to re-select the file from disk, which updates the stored handle.
- Never shows a generic error. Always gives a clear path to resolution.

---

## 19. Notifications

### 19.1 Web Push Notifications
- Uses the **Web Push API**.
- Works on Edge/Windows (desktop) and Safari on iOS 17 Pro (mobile).
- The user must grant notification permission on first use. A permission request prompt is shown with clear explanation of what notifications will be sent.

### 19.2 Notification Triggers
- Assignment deadline within 24 hours AND `is_submitted = false` → Push notification: "[Assignment Name] due in X hours. Not yet submitted."
- This is the only notification type in v1. More can be added later.

### 19.3 Implementation
- Notification scheduling is handled server-side via Supabase Edge Functions or a Vercel Cron Job that checks for upcoming deadlines and sends push notifications via the Web Push API.

---

## 20. Forms & Validation

### 20.1 Form Library
All forms use **React Hook Form** + **Zod** for validation. Every form is rendered inside the reapollo/basic-modal component — never on a separate page, never in a new browser window.

### 20.2 Form Design Rules
- All input boxes and form backgrounds use the same dark dotted surface background as the rest of the app.
- Input fields have a subtle border glow on focus (Framer Motion transition).
- Required fields are marked with a visual indicator (e.g. asterisk) before the user starts filling the form.
- Inline errors appear below the relevant field immediately on blur or on submit attempt. Never a browser alert. Never a toast for validation errors.
- Forms never navigate away from the current page.
- Smart defaults: forms pre-fill context-relevant fields (current semester, current class, current date/time). All pre-filled values are editable.
- Custom time input: free-text input accepting HH:MM format (e.g. 13:15, 19:44). Validated by Zod. Not limited to fixed intervals.
- Date picker: use BelkacemYerfa/datetime-picker component for all date and datetime inputs.

### 20.3 Semester Creation Form
Fields:
- Semester name (text, required)
- Start date (date picker, required)
- End date (date picker, required, must be after start date)
- Color (color picker, required)

### 20.4 Class Creation Form
Fields:
- Class name (text, required)
- Category (dropdown: Core / Minor / Elective / Other, required)
- Credits (number, required)
- Start date (date picker, defaults to semester start date)
- End date (date picker, defaults to semester end date)
- Color (color picker, defaults to semester color)
- Schedule slots: a dynamic section to add recurring slots. Each slot: day of week (multi-select), start time, end time, location (optional). User can add multiple slots.

### 20.5 Task Creation Form
Fields:
- Name (text, required)
- Deadline (datetime picker, optional)
- Is assignment toggle (boolean)
- If assignment: marks scored (decimal, optional), total marks (decimal, optional if no marks scored), is submitted (toggle)
- Linked class (dropdown, defaults to current class if on class page, can be cleared for standalone)

### 20.6 Exam Creation Form
Fields:
- Name (text, required)
- Date (date picker, required)
- Total marks (decimal, required)
- Marks scored (decimal, optional, must be ≤ total marks)
- Weightage (decimal, required, percentage)

### 20.7 Extra Class Creation Form
Fields:
- Date (date picker, required)
- Start time (time input, required)
- End time (time input, required, must be after start)
- Location (text, optional)

### 20.8 Non-Academic Event Creation Form
Fields:
- Name (text, required)
- Date (date picker, required)
- Start time (time input, required)
- End time (time input, required)
- Location (text, optional)
- Color (color picker, optional)
- Notes (text, optional)

### 20.9 Delete Confirmation
- Every delete action shows a confirmation dialog before proceeding.
- Dialog: "[Item Name] will be permanently deleted. This cannot be undone."
- Confirm and Cancel buttons.
- After deletion: 5-second undo toast notification. Clicking undo restores the deleted record.
- For drag-and-drop reordering: 5-second undo toast to revert order changes.

---

## 21. Global UX Rules

### 21.1 Optimistic UI
Optimistic UI updates must be used throughout the **entire application** — not selectively. Every user action must reflect instantly in the UI before the server confirms. If the server operation fails, the UI reverts to the previous state and shows an error toast.

Actions requiring optimistic UI:
- Marking attendance (present/absent/cancelled)
- Checking/unchecking a task
- Toggling assignment submission status
- Creating, editing, or deleting any record
- Dragging files to reorder
- Marking a semester as active

### 21.2 Toast Notifications
- Use reapollo/success-toast-notification for all toasts.
- Success toasts: "Attendance marked", "Task created", "Semester saved", etc.
- Error toasts: "Failed to save. Please try again." with retry option where applicable.
- Undo toasts: "Deleted. Undo?" with 5-second countdown progress bar.
- Toasts slide in from bottom-right, auto-dismiss after 4 seconds.

### 21.3 Empty States
Every section with potentially no data must have a thoughtful empty state:
- **No semesters:** Dashed-border card, glowing `+`, "Add your first semester to get started"
- **No classes in semester:** Dashed-border card, glowing `+`, "Add your first class"
- **No tasks:** "No tasks yet. Create your first task."
- **No assignments:** "No assignments yet."
- **No exams:** "No exams recorded yet."
- **No files:** "No files linked yet. Add notes, textbooks, or PYQs."
- **No upcoming events:** "Nothing coming up. Enjoy the calm."
- **Calendar with no events:** Subtle message inside the calendar area.
All empty states use the dashed-border card style with low-opacity background.

### 21.4 Placeholder Text
Every input field, textarea, and form field must have meaningful placeholder text that guides the user. Examples:
- Semester name: "e.g. Semester 4"
- Class name: "e.g. Fluid Mechanics"
- Location: "e.g. LA001, Room B204"
- Task name: "e.g. Submit lab report"
- File display name: "e.g. Fluid Mechanics Textbook"

### 21.5 Edit & Delete Availability
Every record the user creates has:
- An edit button that opens the edit modal
- A delete option inside the edit modal (not a separate button to prevent accidental deletion)
- Records: semesters, classes, schedule slots, tasks, assignments, exams, non-academic events, files

### 21.6 Scroll Position Memory
Every page stores its scroll position in Zustand when the user navigates away. Scroll position is restored when returning to the same page.

### 21.7 Global Synchronization
Whenever any record changes (attendance, exams, tasks, classes, etc.), all related components update automatically:
- Attendance stats recalculate
- Graphs update
- Projected SPI recalculates
- CGPA recalculates
- Calendar events refresh
- Analytics update
This is achieved via TanStack Query's `invalidateQueries` on every mutation.

### 21.8 Network Failure Handling
- If internet connection is lost, a clear banner appears: "You're offline. Changes will not be saved."
- If a specific API request fails, an error toast appears with a retry option.
- No silent failures. Every failed action surfaces clearly to the user.
- Partial operations are rolled back cleanly. No corrupted state.

### 21.9 Time Overlap Warning
- When creating or editing a class schedule slot, exam, or non-academic event, the system checks for time conflicts with existing events on the same day.
- If a conflict is detected, a warning is shown inline: "This overlaps with [Event Name] at [Time]. You can still proceed."
- Not a hard block — user can proceed despite the warning.

### 21.10 Today Highlight
The current day is always visually highlighted wherever dates appear:
- Calendar week strip
- Day view calendar
- Week view calendar column
- Attendance history table
- Schedule cards

### 21.11 Quick Peek Previews
- **Desktop hover on class card:** Shows a floating mini-preview with upcoming classes for that subject, attendance percentage, and next exam.
- **Desktop hover on semester card:** Shows upcoming events, active class count, and CGPA contribution.
- **Mobile long-press on cards:** Same preview in a bottom sheet.

---

## 22. Performance

### 22.1 Data Loading
- **Page-level fetching only:** Each page fetches only the data it needs. The home page does not pre-fetch semester details.
- **TanStack Query caching:** Data is cached and served from cache on re-visits. Background refetch keeps cache fresh.
- **Lazy loading:** Components below the fold are lazy-loaded. Heavy sections (calendar, graphs) load asynchronously.
- **Pagination / virtual scrolling:** All lists that can grow large (attendance history, tasks, files) use pagination or virtual scrolling via `react-virtual`.
- **Calendar virtual rendering:** FullCalendar renders only visible time slots. Events outside the 6-hour window are loaded lazily on scroll.

### 22.2 Animation Performance
- All animations use only `transform` and `opacity` CSS properties — GPU-accelerated, no layout reflow.
- Animations only trigger for elements in the viewport (`whileInView` with `once: true`).
- Heavy animations are disabled if the user has `prefers-reduced-motion` enabled.
- Framer Motion's `LazyMotion` with `domAnimation` feature set is used to minimize bundle size.

### 22.3 Bundle Optimization
- Next.js App Router automatic code splitting per route.
- Dynamic imports for heavy components (FullCalendar, Tremor Charts, rich text editor).
- Image optimization via Next.js `<Image />` component.

---

## 23. Error Handling & Monitoring

### 23.1 Sentry Integration
- **Sentry** is integrated via `@sentry/nextjs`.
- Captures all unhandled exceptions on both client and server (API routes, Edge functions).
- Source maps uploaded to Sentry for readable stack traces.
- Alerts configured for error spikes.

### 23.2 Error Boundaries
- React Error Boundaries wrap each major page section. If a section throws an error, it shows a fallback UI ("Something went wrong. Try refreshing.") without crashing the entire page.

### 23.3 API Error Handling
- All API routes return consistent error responses: `{ error: string, code: string }`.
- TanStack Query's `onError` callbacks trigger error toasts for failed mutations.
- Network failures are caught and surfaced as retryable error toasts.

### 23.4 Rate Limiting
- All API endpoints are rate-limited using Vercel Edge Middleware.
- Auth endpoint: max 10 requests per minute per IP.
- Data mutation endpoints: max 60 requests per minute per user.
- Returns HTTP 429 with a clear error message when rate limit is exceeded.

---

## 24. Data Export

### 24.1 Export Formats
- **JSON:** Full data backup. Exports all semesters, classes, attendance, tasks, exams, grades. Complete and restorable.
- **CSV:** Spreadsheet-compatible. Exports attendance records, exam marks, and task lists as separate CSV files in a zip.

### 24.2 Export Location
- Export button available in the app settings or profile area.
- Downloads a file directly to the user's device. No email or external service.

---

## 25. Engineering Safeguards

### 25.1 Race Conditions
- All database writes use transactions where multiple tables are affected (e.g. creating a class and its schedule slots simultaneously).
- Optimistic UI updates are tracked with a mutation ID. If two mutations fire in quick succession, only the last one's server response is applied.

### 25.2 Duplicate Prevention
- `UNIQUE` constraints in the database prevent duplicate attendance records per occurrence.
- Schedule slot overlap validation runs before saving any new or edited slot.
- Idempotent upsert operations used for attendance marking.

### 25.3 Data Validation Layers
1. **Client-side:** React Hook Form + Zod — instant inline feedback, blocks submission.
2. **API route:** Zod schema re-validated on every incoming request. Never trust client data.
3. **Database:** CHECK constraints, UNIQUE constraints, foreign key constraints.

### 25.4 Foreign Key Integrity
All relationships have `ON DELETE CASCADE` where appropriate:
- Deleting a semester → deletes all its classes, occurrences, attendance, tasks, exams, files.
- Deleting a class → deletes all its occurrences, attendance, tasks, exams, files, schedule slots.
- Deleting a task → does not delete linked exams (foreign key is nullable).

### 25.5 Timezone Handling
- All timestamps stored as UTC in the database.
- All display uses the user's local timezone via `date-fns` `toZonedTime`.
- Timezone is determined from `Intl.DateTimeFormat().resolvedOptions().timeZone` on the client.

---

## 26. Future-Proofing & Migrations

### 26.1 Database Migration Strategy
- All schema changes are versioned migration files using **Drizzle Kit**.
- Never edit the database schema directly in production.
- Migration files are committed to the Git repository alongside code changes.
- Migrations are applied automatically on deployment via a pre-deploy script.
- Every migration is backwards-compatible where possible. Breaking changes include a data migration step.

### 26.2 Scalability Considerations
- The Supabase PostgreSQL schema is designed to support additional users in the future if the app ever becomes multi-user.
- `user_id` foreign key exists on every table. RLS policies are already in place.
- Adding multi-user support would require only changes to auth flow and RLS policies — no schema redesign needed.

### 26.3 React Native Compatibility
- The codebase is structured for maximum logic reuse when migrating to React Native in the future.
- Business logic (calculations, validation schemas, data fetching hooks) lives in `/lib` and `/hooks` directories, completely separate from UI components.
- Zod schemas, TanStack Query hooks, Zustand stores, and utility functions are all platform-agnostic and fully reusable in React Native.
- Supabase JS client works identically in React Native.

---

*End of PRD — Tracker v1.0*
*All features, behaviors, validations, animations, and technical decisions documented above are final and approved for implementation.*

*This PRD is a living reference. As development progresses, requirements may evolve — new edge cases may surface, UI decisions may shift, or features may need adjustment. The AI assistant (Claude Opus) working on implementation must be prepared to adapt, ask clarifying questions when something in the PRD is ambiguous in a real coding context, and flag conflicts or technical constraints proactively. The goal is a working, polished product — not rigid adherence to this document at the cost of quality.*