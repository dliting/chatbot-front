/**
 * Shared helpers for ChatApp E2E tests
 */
import type { Page } from '@playwright/test'

/**
 * Clear both localStorage and backend sessions for a clean test state.
 * Must be called after navigating to a valid page (not about:blank).
 */
export async function cleanState(page: Page) {
  await page.evaluate(async () => {
    localStorage.clear()
    try {
      const res = await fetch('/api/mock/sessions')
      const data = await res.json()
      if (data.data?.sessions) {
        for (const s of data.data.sessions) {
          await fetch(`/api/mock/sessions/${s.sessionId}`, { method: 'DELETE' })
        }
      }
    } catch { /* ignore — tests will fail on their own if backend is down */ }
  })
}
