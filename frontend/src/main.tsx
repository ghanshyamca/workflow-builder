import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/index.css'
import { Provider } from 'react-redux'
import { store } from '@store/store'

// Register Service Worker for offline support and caching
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.ts', { scope: '/' })
      .then((registration) => {
        console.debug('[SW] Service Worker registered:', registration)

        // Check for updates periodically
        setInterval(() => {
          registration.update()
        }, 60000) // Check every minute
      })
      .catch((error) => {
        console.error('[SW] Service Worker registration failed:', error)
      })

    // Listen for updates
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.debug('[SW] Controller changed - new version available')
    })
  })
}

// Web Vitals monitoring in production
if (import.meta.env.PROD) {
  // Dynamically import web-vitals only in production
  import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
    const sendToAnalytics = (metric: any) => {
      // Send to your analytics service
      if (typeof window !== 'undefined' && 'gtag' in window) {
        (window as any).gtag('event', metric.name, {
          value: Math.round(metric.value),
          event_category: 'web_vitals',
          event_label: metric.id,
        })
      }

      // Also log locally for debugging
      if (import.meta.env.DEV === false) {
        console.debug(`[Web Vitals] ${metric.name}:`, metric.value)
      }
    }

    getCLS(sendToAnalytics)
    getFID(sendToAnalytics)
    getFCP(sendToAnalytics)
    getLCP(sendToAnalytics)
    getTTFB(sendToAnalytics)
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
)
