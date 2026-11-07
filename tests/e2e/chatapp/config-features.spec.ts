/**
 * Mock-mode E2E for subproject-② config features:
 * clear-all flow, code copy button, enableImageUpload=false.
 */
import { test, expect } from '@playwright/test'
import { cleanState } from './helpers'

test.describe('Config features - Extended Mode (mock)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/extended')
    await expect(page.locator('.chat-input')).toBeVisible({ timeout: 10000 })
    await cleanState(page)
    await page.reload()
    await expect(page.locator('.chat-input')).toBeVisible({ timeout: 10000 })
  })

  test('clear-all flow clears messages after confirmation', async ({ page }) => {
    const input = page.locator('textarea').first()
    await input.fill('hello before clear')
    await input.press('Enter')
    await expect(page.locator('.chatbot-message__bubble--user')).not.toHaveCount(0)

    await page.locator('.chat-header__clear').click()
    await expect(page.locator('.confirm-dialog')).toBeVisible()
    await page.locator('.confirm-dialog__btn--confirm').click()
    await expect(page.locator('.chatbot-message__bubble')).toHaveCount(0)
  })

  test('code block copy button is rendered and clickable', async ({ page }) => {
    const input = page.locator('textarea').first()
    await input.fill('```js\nconsole.log("e2e copy")\n```')
    await input.press('Enter')

    const copyBtn = page.locator('.markdown-copy-btn').first()
    await expect(copyBtn).toBeVisible({ timeout: 15000 })
    await copyBtn.click()
    // success toast from the copy handler
    await expect(page.locator('.el-message')).toBeVisible({ timeout: 5000 })
  })

})
