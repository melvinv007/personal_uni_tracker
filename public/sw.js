/**
 * Service Worker — Push Notifications
 *
 * Purpose: Handles incoming push events and displays
 * native browser notifications for deadline reminders.
 * Supports click-to-open behavior to navigate to relevant page.
 *
 * Reference: PRD Section 18 (Notifications)
 */

/* eslint-disable no-restricted-globals */

self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();

  const options = {
    body: data.body || "You have an upcoming deadline",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: data.tag || "tracker-notification",
    /* Attach URL so we can navigate on click */
    data: {
      url: data.url || "/",
    },
    /* Auto-close after 10 seconds */
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(data.title || "Tracker", options));
});

/* Handle notification click — open the relevant page */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      /* Focus existing tab if already open */
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      /* Otherwise open a new window */
      return self.clients.openWindow(url);
    })
  );
});

/* Activate immediately on install */
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
