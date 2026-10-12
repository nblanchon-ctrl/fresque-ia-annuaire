// ── Service Worker — Fresque de l'IA Animateurs ──────────────────
const CACHE_NAME = 'fresque-ia-v1'
const STATIC_CACHE = 'fresque-ia-static-v1'

// Ressources à mettre en cache immédiatement
const PRECACHE_URLS = [
  '/',
  '/formation',
  '/fresqueurs',
  '/offline',
]

// ── Install ──────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch(() => {})
    })
  )
  self.skipWaiting()
})

// ── Activate ─────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

// ── Fetch ─────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Ignorer les requêtes non-GET et les appels API Supabase
  if (request.method !== 'GET') return
  if (url.hostname.includes('supabase.co')) return
  if (url.pathname.startsWith('/api/')) return

  // Assets statiques Next.js → Cache First
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/_next/image/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone))
          }
          return response
        })
      })
    )
    return
  }

  // Pages → Network First avec fallback cache puis offline
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
        .catch(() => {
          return caches.match(request)
            .then((cached) => cached || caches.match('/offline'))
        })
    )
    return
  }

  // Autres ressources → Stale While Revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      }).catch(() => cached)
      return cached || fetchPromise
    })
  )
})

// ── Push Notifications (futur) ────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title || 'Fresque de l\'IA', {
      body: data.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-72.png',
      data: { url: data.url || '/' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(clients.openWindow(url))
})
