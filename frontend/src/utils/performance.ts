/**
 * Performance monitoring and optimization utilities
 */

// Log performance metrics in development
export const logPerformanceMetric = (name: string, value: number, unit: string = 'ms') => {
  if (import.meta.env.DEV) {
    console.debug(`[Perf] ${name}: ${value}${unit}`)
  }
}

// Measure function execution time
export const measurePerformance = async <T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> => {
  const start = performance.now()
  try {
    const result = await fn()
    const duration = performance.now() - start
    logPerformanceMetric(name, duration)
    return result
  } catch (error) {
    const duration = performance.now() - start
    logPerformanceMetric(`${name} (error)`, duration)
    throw error
  }
}

// Debounce function for expensive operations
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      func(...args)
    }, delay)
  }
}

// Throttle function for high-frequency operations
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let lastRun = 0
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastRun >= limit) {
      func(...args)
      lastRun = now
    } else {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        func(...args)
        lastRun = Date.now()
      }, limit - (now - lastRun))
    }
  }
}

// Request idle callback polyfill
export const requestIdleCallback = (cb: IdleRequestCallback, options?: IdleRequestOptions) => {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(cb, options)
  }
  const start = Date.now()
  return setTimeout(() => {
    cb({
      didTimeout: false,
      timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
    } as IdleDeadline)
  }, 1)
}

// Intersection Observer for lazy loading
export const createIntersectionObserver = (
  element: Element,
  callback: (isVisible: boolean) => void,
  options: IntersectionObserverInit = {}
) => {
  if (!('IntersectionObserver' in window)) {
    callback(true)
    return null
  }

  const observer = new IntersectionObserver(([entry]) => {
    callback(entry.isIntersecting)
  }, {
    threshold: 0.1,
    ...options,
  })

  observer.observe(element)
  return observer
}

// Analytics event tracking
export const trackEvent = (eventName: string, data?: Record<string, any>) => {
  if (import.meta.env.PROD && typeof window !== 'undefined') {
    // Send to analytics service
    if ('gtag' in window) {
      (window as any).gtag('event', eventName, data)
    }
  }
}
