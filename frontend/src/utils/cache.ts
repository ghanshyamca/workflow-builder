/**
 * API Request Cache - Simple in-memory cache for GET requests
 * Helps reduce API calls and improves perceived performance
 */

interface CacheEntry {
  data: any
  timestamp: number
  ttl: number
}

class RequestCache {
  private cache: Map<string, CacheEntry> = new Map()
  private maxSize: number = 50

  set(key: string, data: any, ttlSeconds: number = 300) {
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value
      if (firstKey) this.cache.delete(firstKey)
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
    })
  }

  get(key: string) {
    const entry = this.cache.get(key)
    if (!entry) return null

    const elapsed = Date.now() - entry.timestamp
    if (elapsed > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  clear() {
    this.cache.clear()
  }

  remove(key: string) {
    this.cache.delete(key)
  }

  // Clear cache entries that match a pattern
  clearPattern(pattern: string | RegExp) {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern
    const keysToDelete: string[] = []

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key))
  }
}

export const requestCache = new RequestCache()

/**
 * Retry with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  let lastError: Error | null = null

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      if (i < maxRetries - 1) {
        const delay = delayMs * Math.pow(2, i)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}

/**
 * Generate cache key from URL and params
 */
export const getCacheKey = (url: string, params?: Record<string, any>): string => {
  if (!params) return url
  const queryString = new URLSearchParams(params).toString()
  return `${url}?${queryString}`
}
