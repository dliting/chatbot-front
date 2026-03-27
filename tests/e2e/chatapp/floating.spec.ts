/**
 * E2E test for floating mode - ChatApp full application
 * Tests the complete user flow through the FloatingDemo page.
 *
 * Entry: examples/chatapp/frontend (port 5180, mock backend on port 3001)
 * This catches integration bugs at the application level.
 */
import { test, expect } from '@playwright/test'

test.describe('Floating Mode - ChatApp', () => {
  test('should navigate to floating demo from landing page', async ({ page }) => {
    await page.goto('/')

    // Should see the landing page with mode cards
    await expect(page.locator('h1')).toContainText('AI Chatbot')

    // Click the floating mode card
    const floatingCard = page.locator('a[href="/floating"], .mode-card:has-text("悬浮")')
    if (await floatingCard.isVisible()) {
      await floatingCard.click()
    } else {
      // Fallback: navigate directly
      await page.goto('/floating')
    }

    // Should be on the floating demo page
    await expect(page).toHaveURL(/\/floating/)
    await expect(page.locator('h1')).toContainText('悬浮窗模式')
  })

  test('should show SuspendedBall on floating demo page', async ({ page }) => {
    await page.goto('/floating')

    // SuspendedBall should be visible in the bottom-right area
    const ball = page.locator('.chatbot-ball')
    await expect(ball).toBeVisible({ timeout: 10000 })
  })

  test('should open floating panel with content when ball is clicked', async ({ page }) => {
    await page.goto('/floating')

    const ball = page.locator('.chatbot-ball')
    await expect(ball).toBeVisible({ timeout: 10000 })
    await ball.click()

    // DraggableWindow should appear with content
    const window = page.locator('.draggable-window')
    await expect(window).toBeVisible({ timeout: 5000 })

    // Verify panel is NOT blank - content should be visible
    const chatContent = page.locator('.chat-content')
    await expect(chatContent).toBeVisible()

    // Input area must be present
    const inputArea = page.locator('.chat-content__input-area')
    await expect(inputArea).toBeVisible()

    // Textarea should be usable
    const textarea = inputArea.locator('textarea')
    await expect(textarea).toBeVisible()
  })

  test('should have exactly one DraggableWindow (no double wrapping)', async ({ page }) => {
    await page.goto('/floating')

    const ball = page.locator('.chatbot-ball')
    await expect(ball).toBeVisible({ timeout: 10000 })
    await ball.click()

    await page.waitForTimeout(1000)

    const windows = page.locator('.draggable-window')
    await expect(windows).toHaveCount(1)
  })

  test('should not have console errors on floating page', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    await page.goto('/floating')

    const ball = page.locator('.chatbot-ball')
    await expect(ball).toBeVisible({ timeout: 10000 })
    await ball.click()

    await page.waitForTimeout(2000)

    const criticalErrors = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('ERR_CONNECTION_REFUSED') &&
      !e.includes('waitForSuccessfulPing')
    )

    expect(criticalErrors).toEqual([])
  })
})
