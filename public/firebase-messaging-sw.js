// Firebase Messaging Service Worker for Minbar Live
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAq_nm6YX_5d7DMOqmEmQ8MgKsXLoqKeKY",
  authDomain: "minbar-live.firebaseapp.com",
  projectId: "minbar-live",
  storageBucket: "minbar-live.firebasestorage.app",
  messagingSenderId: "645939734747",
  appId: "1:645939734747:web:daf3aae436ce0f5c3884fe",
  measurementId: "G-QEY8E2RP3M"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log("Background message received:", payload);
  const { title, body, icon } = payload.notification;
  self.registration.showNotification(title, {
    body: body,
    icon: icon || "/logo192.png",
    badge: "/logo192.png",
    vibrate: [200, 100, 200],
    data: payload.data,
    actions: [
      { action: "watch", title: "Watch Now 📺" },
      { action: "dismiss", title: "Dismiss" }
    ]
  });
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "watch" || !event.action) {
    event.waitUntil(
      clients.openWindow("https://islamic-live-app.vercel.app")
    );
  }
});
