/**
 * Application configuration - environment-specific
 */

interface AppConfig {
  apiBaseUrl: string
  wsUrl: string
  appName: string
  isDev: boolean
  isProd: boolean
  logLevel: 'debug' | 'info' | 'warn' | 'error'
  enableAnalytics: boolean
  enableServiceWorker: boolean
  cacheTTL: number // in seconds
  requestTimeout: number // in milliseconds
}

const config: AppConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  wsUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:3000',
  appName: import.meta.env.VITE_APP_NAME || 'Workflow Builder',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  logLevel: (import.meta.env.VITE_LOG_LEVEL || 'info') as any,
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  enableServiceWorker: import.meta.env.PROD,
  cacheTTL: 300, // 5 minutes
  requestTimeout: 30000, // 30 seconds
}

// Validate required env vars in production
if (config.isProd) {
  if (!config.apiBaseUrl || config.apiBaseUrl.includes('localhost')) {
    console.error('[Config] Missing or invalid VITE_API_BASE_URL in production')
  }
  if (!config.wsUrl || config.wsUrl.includes('localhost')) {
    console.error('[Config] Missing or invalid VITE_WS_URL in production')
  }
}

// Expose in dev mode for debugging
if (config.isDev) {
  (window as any).__APP_CONFIG__ = config
}

export default config
