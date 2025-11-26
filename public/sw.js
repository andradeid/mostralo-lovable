self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/delivery-panel')
    );
  }
});

self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  
  self.registration.showNotification(data.title || 'Novo Pedido', {
    body: data.body,
    icon: '/favicon.png',
    badge: '/favicon.png',
    vibrate: [200, 100, 200],
    requireInteraction: true
  });
});
