// Tithi Vidya's service worker. It only shows article notifications, and
// opens the article when one is tapped. It does not cache or change pages.
// The server side is src/app/api/push.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

/** Draws one notification from what the server sent (notificationFor in src/lib/push.ts). */
function show(data) {
  return self.registration.showNotification(data.title || "New on Tithi Vidya", {
    body: data.body || "A new article is out.",
    // The small square picture beside the words, and the wide one under them
    // (Android and Windows show it; other systems leave it out).
    icon: data.icon || "/icon-192.png",
    image: data.image,
    // Android's status bar draws only the badge's shape, in one colour.
    badge: data.badge || "/badge-96.png",
    tag: data.tag,
    timestamp: data.timestamp,
    actions: [{ action: "read", title: "Read now" }],
    data: { url: data.url || "/blog" },
  });
}

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(show(data));
});

// Backstage asks for a notification on this device only, to check how one looks.
self.addEventListener("message", (event) => {
  if (event.data?.type === "preview" && event.data.payload) event.waitUntil(show(event.data.payload));
});

// A tap anywhere on it, or on "Read now", opens the article.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/blog", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const open = windows.find((client) => client.url === url);
      if (open) return open.focus();
      return self.clients.openWindow(url);
    }),
  );
});
