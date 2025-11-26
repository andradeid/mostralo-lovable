const CACHE_NAME = 'mostralo-v1';
const RUNTIME_CACHE = 'mostralo-runtime';
const IMAGE_CACHE = 'mostralo-images';
const FONT_CACHE = 'mostralo-fonts';

// Workbox manifest injection point (necessário para vite-plugin-pwa)
const PRECACHE_MANIFEST = self.__WB_MANIFEST || [];

// Assets críticos adicionais para cache imediato
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/favicon.png',
  '/manifest.json'
];

// Instalação - cachear assets críticos
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Cache aberto, adicionando assets críticos');
        // Cachear assets do Workbox manifest
        const precacheUrls = PRECACHE_MANIFEST.map(entry => 
          typeof entry === 'string' ? entry : entry.url
        );
        // Combinar com assets críticos adicionais
        const allAssets = [...new Set([...precacheUrls, ...CRITICAL_ASSETS])];
        return cache.addAll(allAssets);
      })
      .then(() => self.skipWaiting())
  );
});

// Ativação - limpar caches antigos
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando service worker...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== RUNTIME_CACHE && 
              cacheName !== IMAGE_CACHE &&
              cacheName !== FONT_CACHE) {
            console.log('[SW] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estratégia de cache por tipo de recurso
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requisições de chrome-extension e non-http
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Estratégia para diferentes tipos de recursos
  if (request.method === 'GET') {
    // Fontes - Cache First (imutáveis)
    if (request.destination === 'font' || url.pathname.match(/\.(woff2?|ttf|otf|eot)$/)) {
      event.respondWith(cacheFirst(request, FONT_CACHE));
      return;
    }

    // Imagens - Cache First com fallback
    if (request.destination === 'image' || url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico)$/)) {
      event.respondWith(cacheFirst(request, IMAGE_CACHE));
      return;
    }

    // Assets estáticos (JS, CSS) - Stale While Revalidate
    if (url.pathname.match(/\.(js|css)$/)) {
      event.respondWith(staleWhileRevalidate(request, CACHE_NAME));
      return;
    }

    // API calls do Supabase - Network First
    if (url.hostname.includes('supabase.co')) {
      event.respondWith(networkFirst(request, RUNTIME_CACHE));
      return;
    }

    // HTML e navegação - Network First com fallback
    if (request.mode === 'navigate' || request.destination === 'document') {
      event.respondWith(networkFirst(request, RUNTIME_CACHE));
      return;
    }

    // Outros recursos - Stale While Revalidate
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
  }
});

// Estratégia Cache First - para assets imutáveis
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[SW] Cache First falhou:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Estratégia Network First - para conteúdo dinâmico
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Network First falhou, usando cache:', error);
    const cached = await cache.match(request);
    return cached || new Response('Offline', { 
      status: 503,
      statusText: 'Sem conexão com a internet'
    });
  }
}

// Estratégia Stale While Revalidate - melhor UX
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cached);

  return cached || fetchPromise;
}

// Notificações Push (mantido do código original)
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