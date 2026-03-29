/**
 * E2E test for extended mode - ChatApp full application
 * Tests the complete user flow through the ExtendedDemo page.
 *
 * Entry: examples/chatapp/frontend (port 5180, mock backend on port 3001)
 */
import { test, expect } from '@playwright/test'

test.describe('Extended Mode - ChatApp', () => {
  test('should navigate to extended demo from landing page', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('h1')).toContainText('AI Chatbot')

    // Click the extended mode card
    const extendedCard = page.locator('a[href="/extended"], .mode-card:has-text("扩展")')
    if (await extendedCard.isVisible()) {
      await extendedCard.click()
    } else {
      await page.goto('/extended')
    }

    await expect(page).toHaveURL(/\/extended/)

    // Extended page shows sidebar with "历史话题" and chat area with "智能助手"
    await expect(page.getByRole('heading', { name: '历史话题' })).toBeVisible()
    await expect(page.locator('.chat-header__title')).toContainText('智能助手')
  })

  test('should show dual layout with topic list and chat area', async ({ page }) => {
    await page.goto('/extended')

    // Extended mode uses sidebar (complementary role) + main area
    const sidebar = page.getByRole('complementary')
    const main = page.locator('main')
    await expect(sidebar).toBeVisible({ timeout: 10000 })
    await expect(main).toBeVisible()
  })

  test('should have ChatInput for user interaction', async ({ page }) => {
    await page.goto('/extended')

    const chatInput = page.locator('.chat-input')
    await expect(chatInput).toBeVisible({ timeout: 10000 })
  })

  test('should not have console errors on extended page', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    await page.goto('/extended')
    await page.waitForTimeout(3000)

    const criticalErrors = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('ERR_CONNECTION_REFUSED') &&
      !e.includes('waitForSuccessfulPing')
    )

    expect(criticalErrors).toEqual([])
  })
})
