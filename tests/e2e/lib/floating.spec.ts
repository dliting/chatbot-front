/**
 * E2E test for floating mode - Component library entry
 * Tests the full component chain: SuspendedBall → FloatingChatPanel → ChatContent
 *
 * Entry: src/entries/floating.ts (dev server on port 5173)
 * This test catches integration bugs where unit tests pass but the real UI breaks.
 */
import { test, expect } from '@playwright/test'

test.describe('Floating Mode - Library Entry', () => {
  test('should show SuspendedBall on page load', async ({ page }) => {
    // Navigate to page - the floating entry mounts AIChatbot component
    await page.goto('/')

    // SuspendedBall should be visible (it's position:fixed, bottom-right)
    const ball = page.locator('.chatbot-ball')
    await expect(ball).toBeVisible({ timeout: 10000 })
  })

  test('should open chat panel when SuspendedBall is clicked', async ({ page }) => {
    await page.goto('/')

    // Click the suspended ball
    const ball = page.locator('.chatbot-ball')
    await expect(ball).toBeVisible({ timeout: 10000 })
    await ball.click()

    // DraggableWindow should appear
    const window = page.locator('.draggable-window')
    await expect(window).toBeVisible({ timeout: 5000 })

    // ChatHeader should be visible inside the window
    const header = window.locator('.chat-header')
    await expect(header).toBeVisible()
  })

  test('should show ChatContent with input area after opening panel', async ({ page }) => {
    await page.goto('/')

    // Open the panel
    const ball = page.locator('.chatbot-ball')
    await expect(ball).toBeVisible({ timeout: 10000 })
    await ball.click()

    const window = page.locator('.draggable-window')
    await expect(window).toBeVisible({ timeout: 5000 })

    // ChatContent should be visible - this catches the "blank panel" bug
    const chatContent = page.locator('.chat-content')
    await expect(chatContent).toBeVisible()

    // Welcome section should be visible (no messages yet)
    const welcome = page.locator('.chat-content__welcome')
    await expect(welcome).toBeVisible()

    // ChatInput should be present (input area at the bottom)
    const inputArea = page.locator('.chat-content__input-area')
    await expect(inputArea).toBeVisible()

    // The textarea/input should exist inside the input area
    const textarea = inputArea.locator('textarea')
    await expect(textarea).toBeVisible()
  })

  test('should not have double DraggableWindow (regression guard)', async ({ page }) => {
    await page.goto('/')

    const ball = page.locator('.chatbot-ball')
    await expect(ball).toBeVisible({ timeout: 10000 })
    await ball.click()

    await page.waitForTimeout(1000)

    // There should be exactly ONE DraggableWindow
    const windows = page.locator('.draggable-window')
    await expect(windows).toHaveCount(1)
  })

  test('should not have console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.goto('/')

    const ball = page.locator('.chatbot-ball')
    await expect(ball).toBeVisible({ timeout: 10000 })
    await ball.click()

    await page.waitForTimeout(2000)

    // Filter out known non-critical errors
    const criticalErrors = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('ERR_CONNECTION_REFUSED') &&
      !e.includes('waitForSuccessfulPing')
    )

    expect(criticalErrors).toEqual([])
  })

  test('should close panel when close button is clicked', async ({ page }) => {
    await page.goto('/')

    // Open panel
    const ball = page.locator('.chatbot-ball')
    await expect(ball).toBeVisible({ timeout: 10000 })
    await ball.click()

    const window = page.locator('.draggable-window')
    await expect(window).toBeVisible({ timeout: 5000 })

    // Click close button
    const closeBtn = window.locator('.chat-header__close')
    await closeBtn.click()

    // Window should close, SuspendedBall should reappear
    await expect(window).not.toBeVisible({ timeout: 5000 })
    const ballAgain = page.locator('.chatbot-ball')
    await expect(ballAgain).toBeVisible({ timeout: 5000 })
  })
})
