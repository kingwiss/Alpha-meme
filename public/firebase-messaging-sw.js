importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the
// messagingSenderId.
firebase.initializeApp({
  apiKey: "AIzaSyATXkkwSnUH7n0INQzA4DPYGSnMkocb_gk",
  authDomain: "gen-lang-client-0758275318.firebaseapp.com",
  projectId: "gen-lang-client-0758275318",
  storageBucket: "gen-lang-client-0758275318.firebasestorage.app",
  messagingSenderId: "425573221322",
  appId: "1:425573221322:web:678428f7aa445817808533",
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification?.title || payload.data?.title || 'Meme Coin Alert!';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'A new breakout coin was detected.',
    icon: '/vite.svg',
    badge: '/vite.svg',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      for (let i = 0; i < windowClients.length; i++) {
        let client = windowClients[i];
        if (client.url.includes('/') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
