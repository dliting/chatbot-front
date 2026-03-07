import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Global error handler for unhandled promise rejections (including fetch errors)
window.addEventListener('unhandledrejection', (event) => {
  // Silently handle network errors when backend is unavailable
  if (event.reason instanceof Error) {
    const errorMsg = event.reason.message || ''
    if (
      errorMsg.includes('fetch failed') ||
      errorMsg.includes('Network') ||
      errorMsg.includes('ECONNREFUSED') ||
      errorMsg.includes('Failed to fetch')
    ) {
      // Prevent the error from being logged to console
      event.preventDefault()
      return
    }
  }
})

// Global error handler for runtime errors
window.addEventListener('error', (event) => {
  // Silently handle network-related errors
  if (event.message && (
    event.message.includes('Network') ||
    event.message.includes('fetch')
  )) {
    event.preventDefault()
  }
})

const app = createApp(App)
app.use(router)
app.mount('#app')
