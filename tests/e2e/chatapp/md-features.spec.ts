/**
 * Mock-mode E2E: task list checkboxes and KaTeX math render in chat bubbles.
 */
import { test, expect } from '@playwright/test'
import { cleanState } from './helpers'

test.describe('Markdown enhancement E2E (mock)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/extended')
    await expect(page.locator('.chat-input')).toBeVisible({ timeout: 10000 })
    await cleanState(page)
    await page.reload()
    await expect(page.locator('.chat-input')).toBeVisible({ timeout: 10000 })
  })

  test('renders task list checkboxes from user markdown', async ({ page }) => {
    const input = page.locator('textarea').first()
    await input.fill('- [x] 已完成\n- [ ] 待办')
    await input.press('Enter')

    await expect(page.locator('.chatbot-message__bubble--user input[type="checkbox"]').first()).toBeVisible({ timeout: 15000 })
    const boxes = page.locator('.chatbot-message__bubble--user input[type="checkbox"]')
    await expect(boxes).toHaveCount(2)
    await expect(boxes.first()).toBeChecked()
  })

  test('renders inline and block math via KaTeX', async ({ page }) => {
    const input = page.locator('textarea').first()
    await input.fill('质能方程 $E=mc^2$ 很有名')
    await input.press('Enter')

    await expect(page.locator('.chatbot-message__bubble--user .katex').first()).toBeVisible({ timeout: 15000 })
  })
})
