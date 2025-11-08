/**
 * Service Worker - PWA Phase 2
 * Gestion du cache et fonctionnalités offline
 */

const CACHE_NAME = 'payhuk-v1';
const RUNTIME_CACHE = 'payhuk-runtime-v1';
const STATIC_CACHE = 'payhuk-static-v1';

// Assets à mettre en cache immédiatement
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/payhuk-logo.png',
  '/favicon.ico',
];

// Routes à mettre en cache au runtime
const RUNTIME_PATTERNS = [
  /^https:\/\/.*\.supabase\.co\/.*/,
  /^https:\/\/fonts\.googleapis\.com\/.*/,
  /^https:\/\/fonts\.gstatic\.com\/.*/,
];

// Install - Mise en cache des assets statiques
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((error) => {
        console.warn('[SW] Erreur lors du cache initial:', error);
      });
    })
  );
  self.skipWaiting();
});

// Activate - Nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return (
              cacheName !== STATIC_CACHE &&
              cacheName !== RUNTIME_CACHE &&
              cacheName !== CACHE_NAME
            );
          })
          .map((cacheName) => {
            return caches.delete(cacheName);
          })
      );
    })
  );
  return self.clients.claim();
});

// Fetch - Stratégie de cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-GET
  if (request.method !== 'GET') {
    return;
  }

  // Ignorer les requêtes vers des domaines externes non-whitelistés
  if (url.origin !== location.origin && !RUNTIME_PATTERNS.some((pattern) => pattern.test(request.url))) {
    return;
  }

  // Stratégie: Cache First pour les assets statiques
  if (STATIC_ASSETS.some((asset) => request.url.includes(asset))) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Stratégie: Network First pour les API
  if (url.pathname.startsWith('/api/') || url.origin.includes('supabase.co')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Stratégie: Stale While Revalidate pour les pages
  event.respondWith(staleWhileRevalidate(request));
});

/**
 * Cache First - Pour les assets statiques
 */
async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
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
    console.warn('[SW] Erreur fetch:', error);
    return new Response('Offline', { status: 503 });
  }
}

/**
 * Network First - Pour les API
 */
async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    return new Response('Offline', { status: 503 });
  }
}

/**
 * Stale While Revalidate - Pour les pages
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => {
    // En cas d'erreur réseau, retourner le cache si disponible
    return cached || new Response('Offline', { status: 503 });
  });
  
  return cached || fetchPromise;
}

// Message handler pour la mise à jour du cache
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(RUNTIME_CACHE).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});

// ============================================================
// PUSH NOTIFICATIONS
// ============================================================

// Écouter les notifications push
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received:', event);
  
  let notificationData = {
    title: 'Payhula',
    body: 'Vous avez une nouvelle notification',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'default',
    data: {},
  };
  
  // Essayer de parser les données de la notification
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        tag: data.tag || notificationData.tag,
        data: data.data || notificationData.data,
        requireInteraction: data.requireInteraction || false,
        silent: data.silent || false,
        vibrate: data.vibrate || [200, 100, 200],
        actions: data.actions || [],
      };
    } catch (error) {
      console.warn('[SW] Error parsing push data:', error);
      // Utiliser les données textuelles si le JSON échoue
      if (event.data.text()) {
        notificationData.body = event.data.text();
      }
    }
  }
  
  // Afficher la notification
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      requireInteraction: notificationData.requireInteraction,
      silent: notificationData.silent,
      vibrate: notificationData.vibrate,
      actions: notificationData.actions,
    })
  );
});

// Gérer les clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  
  event.notification.close();
  
  // Ouvrir ou focaliser la fenêtre
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then((clientList) => {
      // Chercher une fenêtre ouverte
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Ouvrir une nouvelle fenêtre si aucune n'est ouverte
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
  
  // Gérer les actions de notification
  if (event.action) {
    console.log('[SW] Notification action clicked:', event.action);
    const actionUrl = event.notification.data?.actions?.[event.action]?.url;
    if (actionUrl) {
      event.waitUntil(
        clients.openWindow(actionUrl)
      );
    }
  }
});

// Gérer la fermeture des notifications
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event);
  // Ici on pourrait envoyer un événement au serveur pour tracking
});
