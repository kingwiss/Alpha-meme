self.addEventListener('push', function(event) {
  let title = 'Meme Coin Alert!';
  let options = {
    body: 'A new breakout coin was detected.',
    icon: '/vite.svg',
    badge: '/vite.svg',
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  if (event.data) {
    const dataText = event.data.text();
    try {
      const dataJson = JSON.parse(dataText);
      if (dataJson.title) title = dataJson.title;
      if (dataJson.body) options.body = dataJson.body;
    } catch(e) {
      options.body = dataText;
    }
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      // Check if there is already a window/tab open with the target URL
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
