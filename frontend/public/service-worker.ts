// Service Worker for offline support and caching
const CACHE_VERSION = 'v1'
const CACHE_NAME = `workflow-builder-${CACHE_VERSION}`
const RUNTIME_CACHE = `workflow-builder-runtime-${CACHE_VERSION}`

// Assets to cache on install
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/vite.svg',
]

// Cache on install
self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).then(() => {
        self.skipWaiting()
      })
    })
  )
})

// Clean up old caches
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(
            (cacheName) =>
              cacheName.startsWith('workflow-builder-') && cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE
          )
          .map((cacheName) => caches.delete(cacheName))
      )
    })
  )
})

// Cache-first strategy for static assets, network-first for APIs
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // API requests - network first, fallback to cache
  if (url.pathname.startsWith('/api')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            // Update cache with fresh data
            const cache = caches.open(RUNTIME_CACHE)
            cache.then((c) => c.put(request, response.clone()))
          }
          return response
        })
        .catch(() => {
          return caches.match(request).then((response) => {
            return response || new Response('Offline', { status: 503 })
          })
        })
    )
    return
  }

  // Static assets - cache first, fallback to network
  event.respondWith(
    caches
      .match(request)
      .then((response) => {
        if (response) {
          return response
        }

        return fetch(request).then((response) => {
          if (!response || response.status !== 200 || response.type === 'error') {
            return response
          }

          // Cache successful responses
          const cache = caches.open(RUNTIME_CACHE)
          cache.then((c) => {
            c.put(request, response.clone())
          })

          return response
        })
      })
      .catch(() => {
        return caches.match('/index.html')
      })
  )
})

// Handle messages from clients
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
