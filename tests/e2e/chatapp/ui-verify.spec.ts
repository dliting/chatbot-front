/** TEMP debug probe — deleted after run */
import { test, expect } from '@playwright/test'

test('probe voice button state', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))
  await page.goto('/extended')
  await expect(page.locator('.chat-input')).toBeVisible({ timeout: 10000 })
  await page.waitForTimeout(1500)
  const settings = await page.evaluate(() => localStorage.getItem('chatapp-settings'))
  console.log('SETTINGS:', settings)
  console.log('BTN:', await page.locator('.chat-input__voice-btn').count())
  console.log('MIC-BTN-ALL:', await page.locator('button').count())
  console.log('ERRORS:', errors.slice(0, 5).join(' | ').slice(0, 500))
  await page.screenshot({ path: 'tests/e2e/results/ui-verify/07-voice-probe.png' })
})
