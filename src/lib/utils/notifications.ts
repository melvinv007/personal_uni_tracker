/**
 * Notification Utilities — Web Push API helpers
 *
 * Purpose: Register service worker, manage push subscription,
 * request notification permission, and show assignment deadline
 * notifications via the browser Notification API.
 *
 * Per PRD §19.2, the ONLY notification type in v1 is:
 * "Assignment deadline within 24 hours AND is_submitted = false"
 * → Push: "[Assignment Name] due in X hours. Not yet submitted."
 *
 * Reference: PRD Section 19 (Notifications)
 */

/** Check if notifications are supported in the current browser */
export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator;
}

/** Get current notification permission state */
export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
}

/** Request notification permission from the user */
export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!isNotificationSupported()) return "unsupported";

  /* Already granted — no need to prompt */
  if (Notification.permission === "granted") return "granted";

  /* Already denied — browser won't re-prompt */
  if (Notification.permission === "denied") return "denied";

  const result = await Notification.requestPermission();
  return result;
}

/** Register the service worker for push notifications */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    return registration;
  } catch {
    console.error("Service worker registration failed");
    return null;
  }
}

/**
 * Show a local notification for an assignment deadline.
 * Called client-side when we detect upcoming unsubmitted assignments.
 *
 * PRD §19.2: "[Assignment Name] due in X hours. Not yet submitted."
 *
 * @param assignmentName — Name of the assignment
 * @param hoursUntilDeadline — Hours remaining before deadline
 * @param url — URL to navigate to on click
 */
export function showAssignmentDeadlineNotification(
  assignmentName: string,
  hoursUntilDeadline: number,
  url: string = "/"
): void {
  if (getNotificationPermission() !== "granted") return;

  const hoursText = hoursUntilDeadline <= 1
    ? "less than 1 hour"
    : `${Math.round(hoursUntilDeadline)} hours`;

  const title = `${assignmentName} due in ${hoursText}`;
  const body = "Not yet submitted.";

  /* Use service worker if available for better reliability */
  navigator.serviceWorker?.ready
    .then((registration) => {
      registration.showNotification(title, {
        body,
        icon: "/favicon.ico",
        tag: `assignment-deadline-${assignmentName}`,
        data: { url },
      });
    })
    .catch(() => {
      /* Fallback to basic Notification API */
      new Notification(title, { body, icon: "/favicon.ico" });
    });
}

/**
 * Check for unsubmitted assignments with deadlines within 24 hours
 * and show notifications for each one. Called on page load when
 * notification permission is granted.
 *
 * @param assignments — Array of assignment data from TanStack Query
 */
export function checkAndNotifyAssignmentDeadlines(
  assignments: Array<{
    name: string;
    deadline: string | null;
    isAssignment: boolean | null;
    isSubmitted: boolean | null;
    isCompleted: boolean | null;
    classId: string | null;
    semesterId: string;
  }>
): void {
  if (getNotificationPermission() !== "granted") return;

  const now = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000;

  for (const assignment of assignments) {
    /* PRD §19.2: Only assignments, not submitted, with deadlines */
    if (!assignment.isAssignment) continue;
    if (assignment.isSubmitted) continue;
    if (assignment.isCompleted) continue;
    if (!assignment.deadline) continue;

    const deadlineMs = new Date(assignment.deadline).getTime();
    const timeUntil = deadlineMs - now;

    /* Only notify if deadline is within 24 hours and not already past */
    if (timeUntil > 0 && timeUntil <= twentyFourHours) {
      const hoursUntil = timeUntil / (60 * 60 * 1000);
      const url = assignment.classId
        ? `/semester/${assignment.semesterId}/class/${assignment.classId}`
        : `/semester/${assignment.semesterId}`;

      showAssignmentDeadlineNotification(assignment.name, hoursUntil, url);
    }
  }
}
