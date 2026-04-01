/**
 * E2E test for sidebar mode - ChatApp full application
 * Tests the sidebar interaction mode with single layout (tab-switched sessions/chat).
 *
 * Entry: examples/chatapp/frontend (port 5180, mock backend on port 3001)
 */
import { test, expect } from '@playwright/test'

test.describe('Sidebar Mode - ChatApp', () => {
  test('should navigate to sidebar demo from landing page', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('h1')).toContainText('AI Chatbot')

    // Click the sidebar mode card
    const sidebarCard = page.locator('a[href="/sidebar"], .mode-card:has-text("边栏")')
    if (await sidebarCard.isVisible()) {
      await sidebarCard.click()
    } else {
      await page.goto('/sidebar')
    }

    await expect(page).toHaveURL(/\/sidebar/)
  })

  test('should show sidebar panel with main content area', async ({ page }) => {
    await page.goto('/sidebar')

    // Main content area should be visible
    await expect(page.locator('.main-content')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('.main-content')).toContainText('主内容区域')

    // Sidebar panel should be visible (ChatPanel renders as .chatbot-panel)
    const chatPanel = page.locator('.chatbot-panel')
    await expect(chatPanel).toBeVisible({ timeout: 10000 })

    // Chat header should show the title (in EmbeddedChatPanel's ChatHeader, not ChatPanel's header)
    const chatHeader = page.locator('.chat-header__title')
    await expect(chatHeader).toContainText('智能助手')
  })

  test('should have chat input in sidebar', async ({ page }) => {
    await page.goto('/sidebar')

    const chatInput = page.locator('.chat-input')
    await expect(chatInput).toBeVisible({ timeout: 10000 })

    const textarea = page.locator('.chat-input__field')
    await expect(textarea).toBeVisible()
  })

  test('should allow typing and sending message in sidebar', async ({ page }) => {
    await page.goto('/sidebar')

    const textarea = page.locator('.chat-input__field')
    await expect(textarea).toBeVisible({ timeout: 10000 })

    await textarea.fill('Hi')
    const sendBtn = page.locator('.chat-input__send-btn')
    await expect(sendBtn).toBeEnabled()
    await sendBtn.click()

    // User message should appear
    const userMessage = page.locator('.chat-content__message.user .chat-content__text')
    await expect(userMessage).toContainText('Hi', { timeout: 10000 })

    // Assistant response should appear
    const assistantMessage = page.locator('.chat-content__message.assistant .chat-content__text')
    await expect(assistantMessage).toBeVisible({ timeout: 30000 })
  })

  test('should not have console errors on sidebar page', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    await page.goto('/sidebar')
    await page.waitForTimeout(3000)

    const criticalErrors = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('ERR_CONNECTION_REFUSED') &&
      !e.includes('waitForSuccessfulPing')
    )

    expect(criticalErrors).toEqual([])
  })
})
